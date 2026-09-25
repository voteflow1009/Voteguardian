import { useEffect, useState, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence } from 'framer-motion';

/* ── Components ── */
import Preloader from './components/Preloader';
import Navbar    from './components/Navbar';
import Hero      from './components/Hero';
import Footer    from './components/Footer';

import ProblemStory    from './components/ProblemStory';
import LaunchSteps     from './components/LaunchSteps';
import FeatureTabs     from './components/FeatureTabs';
import BuildForBoth    from './components/BuildForBoth';
import GalleryCta      from './components/GalleryCta';
import {

  MarqueeStrip,
} from './components/LandingPage';
import PendingApprovalListener from './components/PendingApprovalListener';

/* ── Pages ── */
import Auth           from './pages/Auth';
import Clubs          from './pages/Clubs';
import Home2          from './pages/Home2';
import ClubDetail     from './pages/ClubDetail';
import EventDetail    from './pages/EventDetail';
import PrivacyPolicy  from './pages/PrivacyPolicy';
import TermsOfUse     from './pages/TermsOfUse';
import CookiePolicy   from './pages/CookiePolicy';

import EditProfile    from './pages/EditProfile';
import ManageEvent    from './pages/ManageEvent';
import RegisteredEvents from './pages/RegisteredEvents';
import Gallery        from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import AdminCreateEvent from './pages/AdminCreateEvent';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerSetup   from './pages/OrganizerSetup';
import PublicScanner  from './pages/PublicScanner';
import Contact        from './pages/Contact';
import About          from './pages/About';

/* ── Context ── */
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider }         from './contexts/ThemeContext';

import './index.css';

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════
   App Content
══════════════════════════════════════════════ */
function AppContent() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '');
  const { user, isLoggedIn, loading, loginWithToken, logout }   = useAuth();

  /* ── Token Parsing & Hash routing & Scroll Reset ── */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      sessionStorage.setItem('loggingIn', 'true');
      loginWithToken(token).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        setTimeout(() => sessionStorage.removeItem('loggingIn'), 1000);
      });
    }
  }, [loginWithToken]);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Aggressively force absolute top on load (fights browser delayed scroll restoration)
    window.scrollTo(0, 0);
    const scrollInterval = setInterval(() => {
      window.scrollTo(0, 0);
    }, 10);
    setTimeout(() => clearInterval(scrollInterval), 1000);

    // Force absolute top before refresh so browser doesn't save scroll position
    const onBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const onHash = () => {
      setCurrentRoute(window.location.hash || '');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  /* ── Auth guard ── */
  useEffect(() => {
    if (loading) return;

    // Organizer onboarding guard
    if (isLoggedIn && user?.role === 'organizer') {
      if (!user.hasCompletedProfile && currentRoute !== '#organizer-setup') {
        window.location.hash = '#organizer-setup';
        return;
      }
      // Allow organizers to revisit setup page to edit their profile
    }

    // If user is logged in but hasn't completed onboarding, redirect to #signin profile setup
    if (isLoggedIn && user && !user.hasCompletedProfile) {
      if (currentRoute !== '#signin') {
        window.location.hash = '#signin';
      }
      return;
    }

    const protected_ = [
      '#settings', '#edit-profile', '#admin', 
      '#registered-events', '#organizer-dashboard', '#edit-event', '#organizer-setup'
    ];
    
    const isProtected = protected_.some(prefix => currentRoute.startsWith(prefix));
    
    if (!isLoggedIn && isProtected) {
      window.location.hash = '#signin';
    }

    // If logged-in user is on signin page
    if (isLoggedIn && currentRoute === '#signin') {
      if (!user?.hasCompletedProfile) {
        return; // Let them finish onboarding on the Auth page
      }

      if (sessionStorage.getItem('loggingIn')) {
        // They are actively logging in, redirect them to dashboard
        if (user?.role === 'organizer') {
          window.location.replace('#organizer-dashboard');
        } else if (user?.role === 'admin') {
          window.location.replace('#admin');
        } else {
          window.location.replace('#home');
        }
      } else {
        // They pressed back button to reach sign-in page -> log them out
        logout();
        window.location.replace('');
      }
    }
  }, [currentRoute, isLoggedIn, loading, user]);

  const innerPages = [
    '#clubs','#signin',
    '#settings','#edit-profile','#registered-events',
    '#admin',
    '#about', '#contact', '#privacy-policy', '#terms-of-use', '#cookie-policy'
  ];
  const isInner = innerPages.includes(currentRoute)
    || currentRoute.startsWith('#club-detail')
    || currentRoute.startsWith('#event-detail')
    || currentRoute.startsWith('#edit-event');

  const lenisRef = useRef<any>(null);

  /* ── Lenis smooth scroll (landing only) ── */
  useEffect(() => {
    if (isInner) return;

    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.8 });
    lenisRef.current = lenis;
    lenis.scrollTo(0, { immediate: true });

    lenis.on('scroll', ScrollTrigger.update);

    const gsapTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    
    gsap.ticker.add(gsapTicker);
    gsap.ticker.lagSmoothing(0, 0);

    return () => { 
      lenis.destroy(); 
      lenisRef.current = null;
      gsap.ticker.remove(gsapTicker);
    };
  }, [isInner]); // ONLY re-run when isInner changes!

  // Force scroll to top and ScrollTrigger refresh on EVERY route change
  useEffect(() => {
    // Force scroll to top so we don't end up out-of-bounds on short pages
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentRoute]);

  /* ── Render ── */
  const renderContent = () => {
    if (currentRoute === '#home')            return <Home2 />;
    if (currentRoute === '#clubs')            return <Clubs />;
    if (currentRoute.startsWith('#club-detail')) return <ClubDetail hash={currentRoute} />;
    if (currentRoute.startsWith('#event-detail') || currentRoute.startsWith('#event_detail')) return <EventDetail hash={currentRoute} />;
    if (currentRoute === '#signin')           return <Auth />;
    if (currentRoute === '#registered-events') return <RegisteredEvents />;
    if (currentRoute === '#gallery')          return <Gallery />;
    if (currentRoute === '#organizer-setup') {
      if (!isLoggedIn) return null;
      if (user?.role !== 'organizer' && user?.role !== 'admin') {
        window.location.hash = '#home';
        return null;
      }
      return <OrganizerSetup />;
    }
    if (currentRoute.startsWith('#organizer-dashboard')) {
      if (!isLoggedIn) return null;
      if (user?.role !== 'organizer' && user?.role !== 'admin') {
        window.location.hash = '#home';
        return null;
      }
      return <OrganizerDashboard />;
    }

    const cleanRoute = decodeURIComponent(currentRoute || '');

    if (
      cleanRoute === '#settings' ||
      cleanRoute === '#edit-profile' ||
      cleanRoute === '#edit profile' ||
      cleanRoute.startsWith('#edit-profile') ||
      cleanRoute.startsWith('#edit profile') ||
      cleanRoute.startsWith('#settings')
    ) {
      if (loading) return null;
      if (!isLoggedIn) {
        window.location.hash = '#signin';
        return <Auth />;
      }
      return <EditProfile />;
    }
    if (currentRoute.startsWith('#edit-event')) {
      if (!isLoggedIn) return null;
      return <ManageEvent />;
    }
    if (currentRoute === '#admin') {
      if (isLoggedIn && user?.role === 'admin') return <AdminDashboard />;
      window.location.hash = '';
      return null;
    }
    if (currentRoute === '#admin-create-event') {
      if (isLoggedIn && user?.role === 'admin') return <AdminCreateEvent />;
      window.location.hash = '';
      return null;
    }
    if (currentRoute.startsWith('#admin-edit-event=')) {
      if (isLoggedIn && user?.role === 'admin') {
        const id = currentRoute.split('=')[1];
        return <AdminCreateEvent eventId={id} />;
      }
      window.location.hash = '';
      return null;
    }

    if (currentRoute.startsWith('#scanner=')) {
      const token = currentRoute.split('=')[1];
      return <PublicScanner token={token} />;
    }

    if (currentRoute.startsWith('#scanner=')) {
      const token = currentRoute.split('=')[1];
      return <PublicScanner token={token} />;
    }

    if (currentRoute === '#contact') {
      return (
        <div className="landing-page">
          <Contact />
          <Footer />
        </div>
      );
    }

    if (currentRoute === '#about') {
      return (
        <div className="landing-page">
          <About />
          <Footer />
        </div>
      );
    }

    if (currentRoute === '#privacy-policy') return (
      <div className="landing-page">
        <PrivacyPolicy />
        <Footer />
      </div>
    );
    if (currentRoute === '#terms-of-use') return (
      <div className="landing-page">
        <TermsOfUse />
        <Footer />
      </div>
    );
    if (currentRoute === '#cookie-policy') return (
      <div className="landing-page">
        <CookiePolicy />
        <Footer />
      </div>
    );

    /* ── Logged-in home → Dashboard ── */
    // if (isLoggedIn && user?.role === 'user') return <Dashboard />;

    /* ══════════════════════════════════════
       PREMIUM LANDING PAGE
    ══════════════════════════════════════ */
    return (
      <div className="landing-page">
        {/* 1. Hero */}
        <Hero />

        {/* 2. Marquee feature strip */}
        <MarqueeStrip />

        {/* 3. Story Scroll Animation Section */}
        <ProblemStory />

        {/* 4. 3 Steps to LAUNCH */}
        <LaunchSteps />

        {/* 5. Feature Tabs (Replaces ServiceShowcase) */}
        <FeatureTabs />

        {/* 6. Build for Both */}
        <BuildForBoth />

        {/* 7. Gallery CTA */}
        <GalleryCta />

        {/* Footer */}
        <Footer />
      </div>
    );
  };

  const isProfileSetup = isLoggedIn && user && !user.hasCompletedProfile;
  const hideNavbar =
    isProfileSetup ||
    currentRoute.startsWith('#organizer-dashboard') ||
    currentRoute.startsWith('#organizer-setup') ||
    currentRoute.startsWith('#admin-create-event') ||
    currentRoute.startsWith('#admin-edit-event') ||
    currentRoute.startsWith('#edit-event') ||
    currentRoute.startsWith('#scanner=') ||
    currentRoute === '#admin';

  return (
    <div className="App">
      {/* Navbar (Shown on Sign In/Sign Up; Hidden on Profile Setup & Full Dashboard pages) */}
      {!hideNavbar && <Navbar />}

      {/* Page content */}
      <main>
        {renderContent()}
      </main>

      {/* Auth-required listeners */}
      <PendingApprovalListener />
    </div>
  );
}

/* ══════════════════════════════════════════════
   Root
══════════════════════════════════════════════ */
export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatePresence>
          {showPreloader && <Preloader key="preloader" onComplete={() => setShowPreloader(false)} />}
        </AnimatePresence>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
