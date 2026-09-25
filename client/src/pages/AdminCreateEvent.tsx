import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, MapPin, Ticket, Users, ChevronDown, X, ArrowLeft, Repeat } from 'lucide-react';
import { api } from '../lib/api';

const MOCK_LOCATIONS = [
  { id: '1', title: 'Jaipur', subtitle: 'Rajasthan, India' },
  { id: '2', title: 'JECRC University', subtitle: 'Plot No. IS-2036 to IS-2039, Ramchandrapura, Sitapura Extension...' },
  { id: '3', title: 'Delhi', subtitle: 'National Capital Territory of Delhi, India' },
  { id: '4', title: 'Mumbai', subtitle: 'Maharashtra, India' },
  { id: '5', title: 'Bangalore', subtitle: 'Karnataka, India' },
];

const DEPARTMENTS = [
  'School of Engineering and Technology',
  'School of Computer Applications',
  'School of Business',
  'School of Design',
  'School of Humanities and Social Sciences',
  'School of Economics',
  'School of Law',
  'School of Sciences',
  'School of Hospitality',
  'School of Mass Communications',
  'Other'
];

export default function AdminCreateEvent({ eventId }: { eventId?: string }) {
  const isEditing = !!eventId;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Form State ---
  const [eventName, setEventName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [location, setLocation] = useState('');
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [selectedMockLocation, setSelectedMockLocation] = useState<any>(null);

  const [ticketType, setTicketType] = useState<'Free' | 'Paid'>('Free');
  const [ticketPrice, setTicketPrice] = useState('');
  const [maxTickets, setMaxTickets] = useState('');

  const [capacity, setCapacity] = useState('');
  const [participantType, setParticipantType] = useState<'individual' | 'team'>('individual');
  const [teamMax, setTeamMax] = useState('4');
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [generateQRCode, setGenerateQRCode] = useState(false);
  const [visibility, setVisibility] = useState<'Public' | 'Private' | 'Unlisted'>('Public');
  const [allowMultipleRegistrations, setAllowMultipleRegistrations] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (eventId) {
      const fetchEvent = async () => {
        try {
          const { data } = await api.get(`/events/${eventId}`);
          setEventName(data.title || '');
          setOrganizer(data.organizer?.name || data.organizer || '');

          const validCatList = ['Tech', 'Gaming', 'Music', 'Culture', 'Arts', 'Sports', 'Workshops', 'Media', 'Literature'];
          if (data.category) {
            const foundCat = validCatList.find(c => c.toLowerCase() === data.category.toLowerCase());
            if (foundCat) {
              setCategory(foundCat);
            } else {
              setCategory('custom');
              setCustomCategory(data.category);
            }
          } else {
            setCategory('');
          }

          setDescription(data.description || '');

          if (data.startDate && data.startDate.includes('T')) {
            const [d, t] = data.startDate.split('T');
            setStartDate(d); setStartTime(t);
          }
          if (data.endDate && data.endDate.includes('T')) {
            const [d, t] = data.endDate.split('T');
            setEndDate(d); setEndTime(t);
          }

          const loc = data.location || data.venue || '';
          if (loc) {
            setLocation(loc);
            const mockLoc = MOCK_LOCATIONS.find(l => l.title.toLowerCase() === loc.toLowerCase());
            if (mockLoc) {
              setSelectedMockLocation(mockLoc);
            } else {
              setSelectedMockLocation({ id: 'custom', title: loc, subtitle: 'Manual Location' });
            }
          }

          if (data.isPaid || (data.price && data.price !== 'Free' && data.price !== '0')) {
            setTicketType('Paid');
            setTicketPrice(data.price || data.pricing?.ticketPrice?.toString() || '');
            setMaxTickets(data.pricing?.maxTicketsPerUser?.toString() || '');
          }
          setCapacity(data.capacity?.toString() || data.seats?.toString() || '');
          if (data.participantType) setParticipantType(data.participantType as any);
          if (data.teamMax || data.teamMin) setTeamMax((data.teamMax || data.teamMin || 4).toString());
          setTargetDepartment(data.targetDepartment || 'All');
          setGenerateQRCode(data.generateQRCode || false);
          if (data.visibility) setVisibility(data.visibility);
          if (data.allowMultipleRegistrations !== undefined) setAllowMultipleRegistrations(!!data.allowMultipleRegistrations);

          if (data.image || data.imageUrl) {
            setImagePreview(data.image || data.imageUrl);
          }
        } catch (e) {
          console.error('Failed to load event details', e);
        }
      };
      fetchEvent();
    }
  }, [eventId]);

  const showError = (msg: string) => {
    setFormError(msg);
    setTimeout(() => setFormError(''), 4000);
  };

  const handlePost = async () => {
    setFormError('');
    const finalLocation = selectedMockLocation ? selectedMockLocation.title : location;

    if (!eventName.trim() || !category || (category === 'custom' && !customCategory.trim()) ||
      !startDate || !startTime || !endDate || !endTime || !finalLocation || !imagePreview) {
      showError('Please fill in all required fields and upload an event poster.');
      return;
    }

    const startObj = new Date(`${startDate}T${startTime}`);
    const endObj = new Date(`${endDate}T${endTime}`);
    if (endObj <= startObj) {
      showError('End time must be strictly after the Start time.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', eventName.trim());
      formData.append('organizer', organizer.trim());
      formData.append('category', category === 'custom' ? customCategory.trim() : category);

      const fullDesc = instructions.trim() ? `${description.trim()}\n\nInstructions: ${instructions.trim()}` : description.trim();
      formData.append('description', fullDesc);

      const sd = `${startDate}T${startTime}`;
      const ed = `${endDate}T${endTime}`;
      formData.append('startDate', sd);
      formData.append('endDate', ed);
      formData.append('location', finalLocation);
      formData.append('mode', 'Offline');
      formData.append('capacity', capacity || '0');

      const mappedDate = `${sd} - ${ed}`;
      formData.append('date', mappedDate);
      formData.append('venue', finalLocation);
      formData.append('seats', capacity || 'Limited');
      formData.append('targetDepartment', targetDepartment);
      formData.append('participantType', participantType);
      if (participantType === 'team') {
        const count = teamMax || '4';
        formData.append('teamMin', count);
        formData.append('teamMax', count);
      } else {
        formData.append('teamMin', '1');
        formData.append('teamMax', '1');
      }
      formData.append('generateQRCode', String(generateQRCode));
      formData.append('visibility', visibility);
      formData.append('allowMultipleRegistrations', String(allowMultipleRegistrations));
      formData.append('price', ticketType === 'Paid' ? ticketPrice : 'Free');

      formData.append('isPaid', (ticketType === 'Paid').toString());
      if (ticketType === 'Paid') {
        formData.append('ticketPrice', ticketPrice);
        formData.append('ticketCapacity', capacity || '0');
        formData.append('maxTicketsPerUser', maxTickets || '1');
      }

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview && !imageFile) {
        formData.append('imageUrl', imagePreview);
      }

      if (isEditing) {
        await api.put(`/admin/events/${eventId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/admin/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      localStorage.setItem('adminActiveTab', 'events');
      localStorage.setItem('adminActiveEventTab', 'admin');
      window.location.hash = '#admin';
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to submit event. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: isMobile ? '1rem 0.75rem' : '2rem', fontFamily: "'Inter', sans-serif" }}>
      <button
        onClick={() => { window.location.hash = '#admin'; }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontWeight: 600, marginBottom: '2rem' }}
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#111' }}>{isEditing ? 'Edit Event' : 'Create Event'}<span style={{ color: '#ec4899' }}>.</span></h1>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1fr) 1.2fr', gap: isMobile ? '1.5rem' : '3rem', alignItems: 'start' }} className="mobile-create-grid">

          {/* Left Column - Image Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              aspectRatio: isMobile ? '4 / 3' : '1 / 1.414', background: '#222', borderRadius: '16px', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                  const reader = new FileReader();
                  reader.onload = (e) => setImagePreview(e.target?.result as string);
                  reader.readAsDataURL(e.target.files[0]);
                }
              }} />

              {imagePreview ? (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  <img src={imagePreview} alt="Blur" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px)', opacity: 0.6, transform: 'scale(1.2)' }} />
                  <img src={imagePreview} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                </div>
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', zIndex: 2, lineHeight: 1.2 }}>upload<br />your image</h3>
                  <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: '#fff', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                    <ImageIcon size={20} color="#7c3aed" />
                  </div>
                </>
              )}
            </label>

            {imagePreview && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => { setImagePreview(null); setImageFile(null); }} style={{ flex: 1, background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Delete Poster
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <input placeholder="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '2.5rem', fontWeight: 700, color: '#111', padding: '0 0 0.5rem 0', outline: 'none' }} />
            <input placeholder="Organizer Name" value={organizer} onChange={e => setOrganizer(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 600, color: '#555', padding: '0 0 1rem 0', outline: 'none' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: '#eaeaea', border: 'none', padding: '16px 20px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, color: '#555', appearance: 'none', outline: 'none', cursor: 'pointer' }}>
                  <option value="" disabled>Event Category</option>
                  <option value="Tech">Tech</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Culture">Culture</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Media">Media</option>
                  <option value="Literature">Literature</option>
                  <option value="custom">Add your category...</option>
                </select>
                <ChevronDown size={20} color="#111" style={{ position: 'absolute', right: '16px', top: '16px', pointerEvents: 'none' }} />
              </div>
              {category === 'custom' && (
                <input placeholder="Enter your custom category" value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={{ width: '100%', background: '#eaeaea', border: 'none', padding: '16px 20px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, color: '#555', outline: 'none' }} />
              )}
            </div>

            <textarea placeholder="Add Description" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', background: '#eaeaea', border: 'none', padding: '16px 20px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, color: '#555', outline: 'none', minHeight: '100px', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: '1rem', background: '#eaeaea', padding: '20px', borderRadius: '12px' }}>
              {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111' }} />
                  <div style={{ width: '2px', flex: 1, borderLeft: '2px dotted #888', margin: '6px 0' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #111', background: 'transparent' }} />
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Start</div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: '#dcdcdc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#555', border: 'none', outline: 'none', flex: 1, width: isMobile ? '100%' : 'auto' }} />
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ background: '#dcdcdc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#555', border: 'none', outline: 'none', width: isMobile ? '100%' : '130px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>End</div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: '#dcdcdc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#555', border: 'none', outline: 'none', flex: 1, width: isMobile ? '100%' : 'auto' }} />
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ background: '#dcdcdc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#555', border: 'none', outline: 'none', width: isMobile ? '100%' : '130px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => { if (!selectedMockLocation) setIsLocationExpanded(true); }}>
                <MapPin size={20} color="#888" />
                <div style={{ flex: 1 }}>
                  {selectedMockLocation ? (
                    <>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>{selectedMockLocation.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{selectedMockLocation.subtitle}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Add Event Location</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Offline location or virtual link</div>
                    </>
                  )}
                </div>
                {selectedMockLocation && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedMockLocation(null); setLocationSearchTerm(''); setLocation(''); setIsLocationExpanded(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} />
                  </button>
                )}
              </div>

              {!selectedMockLocation && isLocationExpanded && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                  <input autoFocus placeholder="Enter location or virtual link" value={locationSearchTerm} onChange={e => setLocationSearchTerm(e.target.value)} style={{ width: '100%', background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600, color: '#555', outline: 'none' }} />

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {locationSearchTerm.trim() !== '' && (
                      <div onClick={() => { setSelectedMockLocation({ id: 'custom', title: locationSearchTerm, subtitle: 'Manual Location' }); setLocation(locationSearchTerm); setIsLocationExpanded(false); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '8px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}>
                        <MapPin size={16} color="#888" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}>Use "{locationSearchTerm}"</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>Add location manually</div>
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', marginTop: locationSearchTerm.trim() !== '' ? '0.5rem' : '0' }}>Recent Locations</div>
                    {MOCK_LOCATIONS.filter(loc => loc.title.toLowerCase().includes(locationSearchTerm.toLowerCase())).map(loc => (
                      <div key={loc.id} onClick={() => { setSelectedMockLocation(loc); setLocation(loc.title); setIsLocationExpanded(false); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '8px', cursor: 'pointer', borderRadius: '8px' }}>
                        <MapPin size={16} color="#888" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}>{loc.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>{loc.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMockLocation && (
                <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem', background: '#ccc' }}>
                  <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMockLocation.title)}&t=&z=13&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                </div>
              )}
            </div>

            <textarea placeholder="Add Instructions for attendees (e.g., Gate number, Dress code)" value={instructions} onChange={e => setInstructions(e.target.value)} style={{ width: '100%', background: '#eaeaea', border: 'none', padding: '16px 20px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, color: '#555', outline: 'none', minHeight: '80px', resize: 'vertical' }} />

            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Ticket size={20} color="#888" />
                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Registration Fees</div>
                <select value={ticketType} onChange={e => setTicketType(e.target.value as 'Free' | 'Paid')} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: '#555', outline: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {ticketType === 'Paid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Price (₹)</span>
                    <input type="number" placeholder="0" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} style={{ width: '100px', background: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', textAlign: 'right', fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Max tickets per user</span>
                    <input type="number" placeholder="e.g. 2" value={maxTickets} onChange={e => setMaxTickets(e.target.value)} style={{ width: '100px', background: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', textAlign: 'right', fontWeight: 600, outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Users size={20} color="#888" />
              <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Capacity</div>
              <input placeholder="Unlimited" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ background: 'transparent', border: 'none', textAlign: 'right', fontWeight: 700, color: '#555', width: '100px', outline: 'none' }} />
            </div>

            {/* Participant Type (Individual vs Team) */}
            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={20} color={participantType === 'team' ? '#8B5CF6' : '#888'} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Participant Type</div>
                </div>
                <select
                  value={participantType}
                  onChange={e => setParticipantType(e.target.value as 'individual' | 'team')}
                  style={{ background: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, color: '#111', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team Event</option>
                </select>
              </div>

              {participantType === 'team' && (
                <div style={{ borderTop: '1px solid #ccc', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Team Members per Team</div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={teamMax}
                    onChange={e => setTeamMax(e.target.value)}
                    placeholder="4"
                    style={{ width: '80px', background: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', textAlign: 'center', fontWeight: 700, outline: 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <Users size={20} color="#888" />
              <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Target Department</div>
              <select value={targetDepartment} onChange={e => setTargetDepartment(e.target.value)} style={{ background: 'transparent', border: 'none', textAlign: 'right', fontWeight: 700, color: '#555', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Generate QR Code Toggle */}
            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Ticket size={20} color="#888" />
                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Generate QR Codes for Attendees</div>
              </div>
              <div
                onClick={() => setGenerateQRCode(!generateQRCode)}
                style={{ width: '40px', height: '24px', background: generateQRCode ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
              >
                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: generateQRCode ? '19px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>

            {/* Private Direct Link Only (Unlisted Event) Toggle */}
            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Users size={20} color={visibility === 'Unlisted' ? '#8B5CF6' : '#888'} />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Private Direct Link Only (Unlisted Event)</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                    {visibility === 'Unlisted'
                      ? 'ON: Hidden from Home Page & Portals. Accessible ONLY via direct URL link.'
                      : 'OFF: Visible to normal users on Home Page & Portals.'}
                  </div>
                </div>
              </div>
              <div
                onClick={() => setVisibility(visibility === 'Unlisted' ? 'Public' : 'Unlisted')}
                style={{ width: '40px', height: '24px', background: visibility === 'Unlisted' ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
              >
                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: visibility === 'Unlisted' ? '19px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>

            {/* Allow Multiple Registrations Toggle */}
            <div style={{ background: '#eaeaea', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Repeat size={20} color={allowMultipleRegistrations ? '#8B5CF6' : '#888'} />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>Allow Multiple Registrations per User</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                    {allowMultipleRegistrations
                      ? 'ON: Single user can register multiple times for this event.'
                      : 'OFF: Default restriction. Users can register only once.'}
                  </div>
                </div>
              </div>
              <div
                onClick={() => setAllowMultipleRegistrations(!allowMultipleRegistrations)}
                style={{ width: '40px', height: '24px', background: allowMultipleRegistrations ? '#8B5CF6' : '#ccc', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
              >
                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: allowMultipleRegistrations ? '19px' : '3px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fca5a5' }}>{formError}</div>
              )}
              <button onClick={handlePost} disabled={submitting} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Processing...' : (isEditing ? 'Update Event' : 'Create Event')}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
