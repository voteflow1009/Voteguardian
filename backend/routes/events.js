const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { transporter } = require('../utils/email');

const Event = require('../models/Event');
const EventSubmission = require('../models/EventSubmission');
const ClubsEvent = require('../models/ClubsEvent');
const { protect } = require('../middleware/authMiddleware');
const { softAuth, requireAuth, requireAdmin } = require('../middleware/auth');
const { upload, uploadBufferToR2 } = require('../config/r2');
const PaidEventDetail = require('../models/PaidEventDetail');
const ScannerLink = require('../models/ScannerLink');
const crypto = require('crypto');
const PaidRegistration = require('../models/PaidRegistration');
const Registration = require('../models/Registration');
const User = require('../models/User');

// === Event Submission Routes (HEAD) ===

// @desc    Upload file for custom questions
// @route   POST /api/events/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const url = await uploadBufferToR2(req.file.buffer, 'uploads', null, req.file.mimetype, req.file.originalname);
    res.json({ url, type: req.file.mimetype, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

let approvedCache = { data: null, timestamp: 0 };
const APPROVED_CACHE_TTL = 10000; // 10 seconds RAM cache

router.get('/approved', softAuth, async (req, res) => {
  try {
    const now = Date.now();
    if (!req.user && approvedCache.data && (now - approvedCache.timestamp < APPROVED_CACHE_TTL)) {
      return res.json(approvedCache.data);
    }

    const list = await EventSubmission.find({
      status: 'approved',
      withdrawalStatus: { $ne: 'approved' },
      visibility: { $nin: ['Private', 'Unlisted'] }
    })
      .populate('organizer', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all pricing details in one query
    const eventIds = list.map(e => e._id);
    const pricingDetails = await PaidEventDetail.find({ event: { $in: eventIds } }).lean();
    const pricingMap = {};
    pricingDetails.forEach(p => {
      p.isPaid = true;
      pricingMap[p.event.toString()] = p;
    });

    // Attach pricing details and check registration for each approved submission
    const listWithPricing = list.map((event) => {
      const isRegistered = req.user ? event.registeredUsers?.some(id => id.toString() === req.user._id.toString()) : false;
      return { ...event, pricing: pricingMap[event._id.toString()], isRegistered };
    });

    if (!req.user) {
      approvedCache = { data: listWithPricing, timestamp: now };
    }

    res.json(listWithPricing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const list = await EventSubmission.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/pending', requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await EventSubmission.find({ status: 'pending' })
      .populate('organizer', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/submission/:id', requireAuth, async (req, res) => {
  try {
    const s = await EventSubmission.findById(req.params.id).lean();
    if (!s) return res.status(404).json({ message: 'Not found' });
    const isOwner = s.organizer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/submission/:id', requireAuth, async (req, res) => {
  try {
    let s = await EventSubmission.findById(req.params.id);
    let eventModel = EventSubmission;
    let isClubsEvent = false;
    let isEvent = false;

    if (!s) {
      const ClubsEvent = require('../models/ClubsEvent');
      s = await ClubsEvent.findById(req.params.id);
      eventModel = ClubsEvent;
      isClubsEvent = true;
    }

    if (!s) {
      s = await Event.findById(req.params.id);
      eventModel = Event;
      isEvent = true;
    }

    if (!s) return res.status(404).json({ message: 'Event not found' });

    let isOwner = (s.createdBy && s.createdBy.toString() === req.user._id.toString()) ||
      (s.organizer && s.organizer.toString() === req.user._id.toString()) ||
      (s.organizer && req.user.name && s.organizer.toString().toLowerCase() === req.user.name.toLowerCase());

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own events' });
    }

    await eventModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/submission/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    let s = await EventSubmission.findById(req.params.id);
    let isClubsEvent = false;

    if (!s) {
      const ClubsEvent = require('../models/ClubsEvent');
      s = await ClubsEvent.findById(req.params.id);
      if (s) isClubsEvent = true;
    }

    if (!s) {
      const EventModel = require('../models/Event');
      s = await EventModel.findById(req.params.id);
    }

    if (!s) return res.status(404).json({ message: 'Not found' });

    // Only the organizer (or an admin) can update their event
    let isOwner = (s.createdBy && s.createdBy.toString() === req.user._id.toString()) ||
      (s.organizer && s.organizer.toString() === req.user._id.toString()) ||
      (s.organizer && req.user.name && s.organizer.toString().toLowerCase() === req.user.name.toLowerCase());

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own events' });
    }

    const {
      title, description, startDate, endDate, mode, location, capacity, imageUrl,
      participantType, teamMin, teamMax, eligibility, timeline, additionalDocs, rules, contacts, announcements, customQuestions,
      tickets, prizes, visibility, registrationControl, personalInfo, eduInfo, organizingTeam, registrationDeadline,
      generateQRCode, targetDepartment, registrationStatus, externalRegistrationLink
    } = req.body;

    if (title !== undefined) s.title = title;
    if (description !== undefined) s.description = description;
    if (startDate !== undefined) s.startDate = startDate;
    if (endDate !== undefined) s.endDate = endDate;
    if (mode !== undefined) s.mode = mode;
    if (location !== undefined) s.location = location;
    s.capacity = capacity !== undefined ? Number(capacity) : s.capacity;
    if (registrationStatus !== undefined) s.registrationStatus = registrationStatus;
    if (externalRegistrationLink !== undefined) s.externalRegistrationLink = externalRegistrationLink;
    if (req.file) {
      const uploadedUrl = await uploadBufferToR2(req.file.buffer, 'events');
      s.imageUrl = uploadedUrl;
      s.image = uploadedUrl;
    } else if (imageUrl) {
      s.imageUrl = imageUrl;
      s.image = imageUrl;
    } else if (req.body.image) {
      s.imageUrl = req.body.image;
      s.image = req.body.image;
    } else if (req.body.img) {
      s.imageUrl = req.body.img;
      s.image = req.body.img;
    }

    const safeParseArray = (val) => {
      if (val === undefined || val === null) return val;
      if (typeof val === 'string') {
        val = val.trim();
        try {
          val = JSON.parse(val);
        } catch (e1) {
          try {
            val = new Function(`return ${val}`)();
          } catch (e2) { /* ignore */ }
        }
      }
      if (Array.isArray(val)) {
        return val.map(item => {
          if (typeof item === 'string') {
            item = item.trim();
            try {
              return JSON.parse(item);
            } catch (e1) {
              try {
                const parsed = new Function(`return ${item}`)();
                return typeof parsed === 'object' && parsed !== null ? parsed : item;
              } catch (e2) {
                return item;
              }
            }
          }
          return item;
        });
      }
      return val;
    };

    if (participantType !== undefined) s.participantType = participantType;
    if (teamMin !== undefined) s.teamMin = teamMin;
    if (teamMax !== undefined) s.teamMax = teamMax;
    if (eligibility !== undefined) s.eligibility = eligibility;
    if (timeline !== undefined) s.timeline = safeParseArray(timeline);
    if (additionalDocs !== undefined) s.additionalDocs = safeParseArray(additionalDocs);
    if (rules !== undefined) s.rules = rules;
    if (contacts !== undefined) s.contacts = safeParseArray(contacts);
    if (announcements !== undefined) s.announcements = safeParseArray(announcements);
    if (customQuestions !== undefined) s.customQuestions = safeParseArray(customQuestions);
    if (tickets !== undefined) s.tickets = safeParseArray(tickets);
    if (prizes !== undefined) s.prizes = safeParseArray(prizes);
    if (visibility !== undefined) s.visibility = visibility;
    if (registrationControl !== undefined) s.registrationControl = registrationControl;
    if (personalInfo !== undefined) s.personalInfo = safeParseArray(personalInfo);
    if (eduInfo !== undefined) s.eduInfo = safeParseArray(eduInfo);
    if (organizingTeam !== undefined) s.organizingTeam = safeParseArray(organizingTeam);
    if (registrationDeadline !== undefined) s.registrationDeadline = registrationDeadline;
    if (generateQRCode !== undefined) s.generateQRCode = generateQRCode === true || generateQRCode === 'true';
    if (targetDepartment !== undefined) s.targetDepartment = targetDepartment;

    await s.save();
    res.json({ submission: s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/submission/:id', requireAuth, async (req, res) => {
  try {
    const ClubsEvent = require('../models/ClubsEvent');
    let s = await EventSubmission.findById(req.params.id);
    let isClubsEvent = false;

    if (!s) {
      s = await ClubsEvent.findById(req.params.id);
      isClubsEvent = true;
    }

    if (!s) return res.status(404).json({ message: 'Not found' });

    let isOwner = false;
    if (isClubsEvent) {
      isOwner = s.createdBy.toString() === req.user._id.toString();
    } else {
      isOwner = s.organizer.toString() === req.user._id.toString();
    }

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own events' });
    }

    if (isClubsEvent) {
      await ClubsEvent.findByIdAndDelete(req.params.id);
    } else {
      await EventSubmission.findByIdAndDelete(req.params.id);
    }

    res.json({ message: 'Event successfully deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const s = await EventSubmission.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    s.status = 'approved';
    await s.save();
    res.json({ submission: s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const s = await EventSubmission.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    s.status = 'rejected';
    await s.save();
    res.json({ submission: s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Request withdrawal of an event
// @route   PATCH /api/events/submission/:id/withdraw
router.patch('/submission/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const s = await EventSubmission.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can withdraw this event' });
    }
    s.withdrawalStatus = 'pending';
    await s.save();
    res.json({ message: 'Withdrawal request sent to admin', submission: s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get all withdrawal requests for admin
// @route   GET /api/events/admin/withdrawals
router.get('/admin/withdrawals', requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await EventSubmission.find({ withdrawalStatus: 'pending' })
      .populate('organizer', 'name email')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Approve or reject withdrawal request
// @route   PATCH /api/events/admin/withdrawals/:id/:action
router.patch('/admin/withdrawals/:id/:action', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { action } = req.params;
    const s = await EventSubmission.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });

    if (action === 'approve') {
      s.withdrawalStatus = 'approved';
      s.status = 'rejected'; // Or delete it? Marking as rejected removes it from public approved list
      await s.save();
      res.json({ message: 'Withdrawal approved', submission: s });
    } else {
      s.withdrawalStatus = 'none';
      await s.save();
      res.json({ message: 'Withdrawal request rejected', submission: s });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get registrations for a specific submission (organizer only)
// @route   GET /api/events/submission/:id/registrations
router.get('/submission/:id/registrations', requireAuth, async (req, res) => {
  try {
    const s = await EventSubmission.findById(req.params.id).populate('registeredUsers', 'name email age gender avatar');
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(s.registeredUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, mode, location, capacity, imageUrl, targetDepartment } = req.body;
    if (!title || !description || !startDate || !endDate || !mode || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Determine the final image URL (from upload or fallback)
    const uploadedUrl = req.file ? await uploadBufferToR2(req.file.buffer, 'events') : '';
    const finalImageUrl = uploadedUrl || (imageUrl || '');

    const submission = await EventSubmission.create({
      organizer: req.user._id,
      title,
      description,
      startDate,
      endDate,
      mode,
      location,
      capacity: Number(capacity) || 0,
      imageUrl: finalImageUrl,
      targetDepartment: targetDepartment || 'All',
      status: 'pending',
    });

    // Handle Paid Event Details
    if (req.body.isPaid === 'true') {
      await PaidEventDetail.create({
        event: submission._id,
        eventModel: 'EventSubmission',
        ticketPrice: Number(req.body.ticketPrice) || 0,
        ticketCapacity: Number(req.body.ticketCapacity) || Number(capacity) || 1,
        maxTicketsPerUser: Number(req.body.maxTicketsPerUser) || 1,
        isRefundable: req.body.isRefundable === 'true',
        paymentDescription: req.body.paymentDescription || '',
        entryConditions: req.body.entryConditions || ''
      });
    }

    res.status(201).json({ submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === Regular Event Routes (Remote) ===

let publicEventsCache = { data: null, timestamp: 0 };
const PUBLIC_EVENTS_CACHE_TTL = 10000; // 10 seconds RAM cache

// @desc    Get all events
// @route   GET /api/events
router.get('/', softAuth, async (req, res) => {
  try {
    const now = Date.now();
    if (!req.user && publicEventsCache.data && (now - publicEventsCache.timestamp < PUBLIC_EVENTS_CACHE_TTL)) {
      return res.json(publicEventsCache.data);
    }

    const events = await Event.find({ visibility: { $nin: ['Private', 'Unlisted'] } }).sort({ date: 1 }).lean();
    const clubsEvents = await ClubsEvent.find({ visibility: { $nin: ['Private', 'Unlisted'] } }).sort({ createdAt: -1 }).lean();

    // Fetch all pricing details in one query
    const allEventIds = [...events.map(e => e._id), ...clubsEvents.map(e => e._id)];
    const pricingDetails = await PaidEventDetail.find({ event: { $in: allEventIds } }).lean();
    const pricingMap = {};
    pricingDetails.forEach(p => {
      p.isPaid = true;
      pricingMap[p.event.toString()] = p;
    });

    const eventsWithPricing = events.map(event => {
      const isRegistered = req.user ? event.registeredUsers?.some(id => id.toString() === req.user._id.toString()) : false;
      return { ...event, pricing: pricingMap[event._id.toString()], isRegistered, isAdminEvent: true };
    });

    const clubsEventsWithPricing = clubsEvents.map(event => {
      const isRegistered = req.user ? event.registeredUsers?.some(id => id.toString() === req.user._id.toString()) : false;
      return { ...event, pricing: pricingMap[event._id.toString()], isRegistered, isClubEvent: true };
    });

    const allEvents = [...eventsWithPricing, ...clubsEventsWithPricing];

    if (!req.user) {
      publicEventsCache = { data: allEvents, timestamp: now };
    }

    res.json(allEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get registered events for user
// @route   GET /api/events/registered
router.get('/registered', requireAuth, async (req, res) => {
  try {
    const events = await Event.find({ registeredUsers: req.user._id }).lean();
    const submissions = await EventSubmission.find({ registeredUsers: req.user._id }).lean();
    const clubsEvents = await ClubsEvent.find({ registeredUsers: req.user._id }).lean();

    const registrations = await Registration.find({ user: req.user._id }).lean();
    const paidRegistrations = await PaidRegistration.find({ user: req.user._id }).lean();

    const getRollNo = (eventId) => {
      const reg = registrations.find(r => r.event.toString() === eventId.toString()) ||
        paidRegistrations.find(r => r.event.toString() === eventId.toString());
      if (reg && reg.customAnswers) {
        const rollAnswer = reg.customAnswers.find(a => a.question && a.question.toLowerCase().includes('roll'));
        if (rollAnswer) return rollAnswer.answer;
      }
      return null;
    };

    // Fetch all pricing details in one query
    const allRegisteredEventIds = [
      ...submissions.map(s => s._id),
      ...events.map(e => e._id),
      ...clubsEvents.map(ce => ce._id)
    ];
    const pricingDetails = await PaidEventDetail.find({ event: { $in: allRegisteredEventIds } }).lean();
    const pricingMap = {};
    pricingDetails.forEach(p => {
      pricingMap[p.event.toString()] = p;
    });

    // Normalize format and add pricing
    const mappedSubmissions = submissions.map((s) => {
      const pricing = pricingMap[s._id.toString()];
      const qrToken = s.generateQRCode ? jwt.sign({ userId: req.user._id, eventId: s._id, model: 'EventSubmission' }, process.env.JWT_SECRET || 'secret') : null;
      return {
        ...s,
        date: s.startDate,
        venue: s.location,
        image: s.imageUrl,
        category: s.category || 'Special',
        pricing,
        qrToken,
        rollNo: getRollNo(s._id)
      };
    });

    const eventsWithPricing = events.map((e) => {
      const pricing = pricingMap[e._id.toString()];
      const qrToken = e.generateQRCode ? jwt.sign({ userId: req.user._id, eventId: e._id, model: 'Event' }, process.env.JWT_SECRET || 'secret') : null;
      return { ...e, pricing, qrToken, rollNo: getRollNo(e._id) };
    });

    const mappedClubsEvents = clubsEvents.map((ce) => {
      const pricing = pricingMap[ce._id.toString()];
      const qrToken = ce.generateQRCode ? jwt.sign({ userId: req.user._id, eventId: ce._id, model: 'ClubsEvent' }, process.env.JWT_SECRET || 'secret') : null;
      return {
        ...ce,
        pricing,
        qrToken,
        rollNo: getRollNo(ce._id)
      };
    });

    const combined = [...eventsWithPricing, ...mappedSubmissions, ...mappedClubsEvents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @desc    Generate a Magic Scanner Link
// @route   POST /api/events/generate-scanner-link
router.post('/generate-scanner-link', requireAuth, requireAdmin, async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours validity

    const newLink = await ScannerLink.create({
      token,
      createdBy: req.user._id,
      expiresAt
    });

    res.json({ link: newLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all active Magic Links
// @route   GET /api/events/scanner-links
router.get('/scanner-links', requireAuth, requireAdmin, async (req, res) => {
  try {
    const links = await ScannerLink.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Revoke a Magic Link
// @route   DELETE /api/events/scanner-link/:id
router.delete('/scanner-link/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await ScannerLink.findByIdAndDelete(req.params.id);
    res.json({ message: 'Link revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify and lock Magic Scanner Link on page load
// @route   GET /api/events/verify-scanner/:token
router.get('/verify-scanner/:token', async (req, res) => {
  const { token } = req.params;
  const { deviceId } = req.query;

  if (!token || !deviceId) {
    return res.status(400).json({ message: "Missing scanner token or device ID" });
  }

  try {
    const link = await ScannerLink.findOne({ token, isActive: true });
    if (!link) {
      return res.status(403).json({ message: "Invalid or revoked scanner link." });
    }

    if (new Date() > new Date(link.expiresAt)) {
      return res.status(403).json({ message: "This scanner link has expired." });
    }

    // Device locking check removed to allow multiple devices

    res.json({ message: "Scanner verified successfully", link });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// @desc    Public route to scan via Magic Link
// @route   POST /api/events/scan-public
router.post('/scan-public', async (req, res) => {
  const { qrToken, scannerToken, deviceId } = req.body;

  if (!scannerToken || !deviceId) {
    return res.status(400).json({ message: "Missing scanner token or device ID" });
  }

  // 1. Verify the Magic Link
  const link = await ScannerLink.findOne({ token: String(scannerToken), isActive: true });
  if (!link) {
    return res.status(403).json({ message: "Invalid or revoked scanner link." });
  }

  if (new Date() > new Date(link.expiresAt)) {
    return res.status(403).json({ message: "This scanner link has expired." });
  }

  // 2. Device Locking Logic removed to allow multiple devices

  // 3. Verify the QR Code
  let payload;
  try {
    payload = jwt.verify(qrToken, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(400).json({ message: "Invalid QR Code." });
  }

  const Model = payload.model === 'EventSubmission' ? EventSubmission : (payload.model === 'ClubsEvent' ? ClubsEvent : Event);

  // 4. Register Attendance
  const event = await Model.findOneAndUpdate(
    {
      _id: payload.eventId,
      registeredUsers: payload.userId,
      attendedUsers: { $ne: payload.userId }
    },
    { $addToSet: { attendedUsers: payload.userId } },
    { new: true }
  );

  if (!event) {
    const existing = await Model.findById(payload.eventId);
    if (!existing) return res.status(404).json({ message: "Event not found." });
    if (!existing.registeredUsers.includes(payload.userId))
      return res.status(403).json({ message: "User is not registered for this event." });
    return res.status(409).json({ message: "Already Scanned! Entry Denied." });
  }

  res.json({ message: "Access Granted" });
});

// @desc    Get events for a specific club by club's custom ID
// @route   GET /api/events/club/:id
router.get('/club/:id', async (req, res) => {
  try {
    const Club = require('../models/Club');
    const club = await Club.findOne({ id: req.params.id });
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    const events = await ClubsEvent.find({ clubId: club._id, visibility: { $nin: ['Private', 'Unlisted'] } }).sort({ createdAt: -1 }).lean();

    const eventIds = events.map(e => e._id);
    const pricingDetails = await PaidEventDetail.find({ event: { $in: eventIds } }).lean();
    const pricingMap = {};
    pricingDetails.forEach(p => {
      p.isPaid = true;
      pricingMap[p.event.toString()] = p;
    });

    const eventsWithPricing = events.map((event) => {
      return { ...event, pricing: pricingMap[event._id.toString()] };
    });

    res.json(eventsWithPricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', softAuth, async (req, res) => {
  try {
    let eventModel = 'Event';
    let event = await Event.findById(req.params.id).populate('createdBy', 'avatar logo').lean();

    if (!event) {
      event = await EventSubmission.findById(req.params.id).populate('createdBy', 'avatar logo').lean();
      eventModel = 'EventSubmission';
    }

    if (!event) {
      event = await ClubsEvent.findById(req.params.id).populate('createdBy', 'avatar logo').lean();
      eventModel = 'ClubsEvent';
    }

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.visibility === 'Private') {
      if (!req.user) {
        return res.status(403).json({ message: 'This event is private.' });
      }
      const isOwner = (event.createdBy && event.createdBy.toString() === req.user._id.toString()) ||
        (event.organizer && req.user.name && event.organizer.toLowerCase() === req.user.name.toLowerCase());

      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'This event is private.' });
      }
    }

    // Fetch Paid details if any
    const pricing = await PaidEventDetail.findOne({ event: event._id }).lean();
    if (pricing) {
      pricing.isPaid = true;
      event.pricing = pricing;
    }

    // Check registration status
    event.isRegistered = req.user ? event.registeredUsers?.some(id => id.toString() === req.user._id.toString()) : false;

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all participants for an event
// @route   GET /api/events/:id/participants
router.get('/:id/participants', requireAuth, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id).populate('registeredUsers', 'name email phone avatar');
    if (!event) {
      event = await EventSubmission.findById(req.params.id).populate('registeredUsers', 'name email phone avatar');
    }
    if (!event) {
      event = await ClubsEvent.findById(req.params.id).populate('registeredUsers', 'name email phone avatar');
    }
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Also fetch paid registrations
    const paidRegistrations = await PaidRegistration.find({ event: event._id }).populate('user', 'name email phone avatar').lean();

    // Fetch free registrations to get custom answers
    const freeRegistrations = await Registration.find({ event: event._id }).populate('user', 'name email phone avatar').lean();

    // Combine them
    const allParticipants = [];
    const attendedSet = new Set((event.attendedUsers || []).map(id => id.toString()));

    freeRegistrations.forEach(r => {
      if (!r.user) return;
      const members = r.teamMembers && r.teamMembers.length > 0
        ? r.teamMembers
        : [{ name: r.user.name, email: r.user.email, phone: r.user.phone, customAnswers: r.customAnswers }];

      allParticipants.push({
        id: r.user._id,
        name: members[0].name,
        email: members[0].email,
        phone: members[0].phone,
        avatar: r.user.avatar,
        type: 'Free',
        status: r.status || 'Registered',
        answers: members[0].customAnswers || [],
        checkedIn: attendedSet.has(r.user._id.toString()),
        isTeam: members.length > 1,
        teamSize: r.teamSize || members.length,
        teamMembers: members // Array of all members including leader
      });
    });

    paidRegistrations.forEach(r => {
      if (!r.user) return;
      const members = r.teamMembers && r.teamMembers.length > 0
        ? r.teamMembers
        : [{ name: r.user.name, email: r.user.email, phone: r.user.phone, customAnswers: r.customAnswers }];

      // Avoid duplicates if they are somehow in both (only check leaders to be safe)
      if (allParticipants.find(p => p.id.toString() === r.user._id.toString())) return;

      allParticipants.push({
        id: r.user._id,
        name: members[0].name,
        email: members[0].email,
        phone: members[0].phone,
        avatar: r.user.avatar,
        type: 'Paid',
        status: r.status || r.paymentStatus || 'Completed',
        answers: members[0].customAnswers || [],
        checkedIn: attendedSet.has(r.user._id.toString()),
        isTeam: members.length > 1,
        teamSize: r.teamSize || members.length,
        teamMembers: members
      });
    });

    res.json(allParticipants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Deregister a participant
// @route   DELETE /api/events/:id/participants/:userId
router.delete('/:id/participants/:userId', requireAuth, async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;

    let event = await Event.findById(eventId);
    let Model = Event;
    if (!event) {
      event = await EventSubmission.findById(eventId);
      Model = EventSubmission;
    }
    if (!event) {
      event = await ClubsEvent.findById(eventId);
      Model = ClubsEvent;
    }

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Ensure authorized (admin, organizer, club_admin, user, or event creator)
    const allowedRoles = ['admin', 'organizer', 'club_admin', 'user'];
    const hasRole = allowedRoles.includes(req.user.role);
    const isOwner = (event.createdBy && event.createdBy.toString() === req.user._id.toString()) ||
      (event.organizer && req.user.name && event.organizer.toLowerCase() === req.user.name.toLowerCase());

    if (!hasRole && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to manage this event' });
    }

    // Safely pull from arrays using MongoDB $pull
    await Model.findByIdAndUpdate(eventId, {
      $pull: {
        registeredUsers: userId,
        attendedUsers: userId
      }
    });

    // Also remove from PaidRegistration / Registration just in case
    await PaidRegistration.findOneAndDelete({ event: eventId, user: userId });
    await Registration.findOneAndDelete({ event: eventId, user: userId });

    res.json({ message: 'Participant deregistered successfully' });
  } catch (error) {
    console.error("Deregister Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Register for an event
// @route   POST /api/events/:id/register
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    // Try finding in Event collection first
    let event = await Event.findById(req.params.id);
    let modelName = 'Event';

    if (!event) {
      // If not found, check EventSubmission collection
      event = await EventSubmission.findById(req.params.id);
      if (event) modelName = 'EventSubmission';
    }

    if (!event) {
      event = await ClubsEvent.findById(req.params.id);
      if (event) modelName = 'ClubsEvent';
    }

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if it's a paid event
    const isPaidEvent = await PaidEventDetail.findOne({ event: event._id });
    if (isPaidEvent) {
      return res.status(403).json({ message: 'This is a paid event. Please complete the payment to register.' });
    }

    // Check if event registration is expired
    const now = new Date();
    let isExpired = false;

    if (event.timeline && event.timeline.length > 0) {
      const regDeadline = event.timeline.find(t => t.title?.toLowerCase().includes('registration'));
      if (regDeadline && regDeadline.endDate) {
        const deadline = new Date(regDeadline.endDate);
        deadline.setHours(23, 59, 59, 999);
        if (now > deadline) isExpired = true;
      }
    }
    if (!isExpired && event.endDate) {
      const end = new Date(event.endDate);
      end.setHours(23, 59, 59, 999);
      if (now > end) isExpired = true;
    } else if (!isExpired && event.startDate) {
      const start = new Date(event.startDate);
      start.setHours(23, 59, 59, 999);
      if (now > start) isExpired = true;
    }

    if (isExpired) {
      return res.status(403).json({ message: 'Registration for this event is closed.' });
    }

    // Target Department check
    if (event.targetDepartment && event.targetDepartment !== 'All') {
      if (!req.user.education || req.user.education.department !== event.targetDepartment) {
        return res.status(403).json({ message: `This event is restricted to ${event.targetDepartment} students only.` });
      }
    }

    // Check if user is already registered
    if (event.registeredUsers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Server-side validation of team members/participants
    if (req.body.teamMembers && Array.isArray(req.body.teamMembers)) {
      for (let i = 0; i < req.body.teamMembers.length; i++) {
        const m = req.body.teamMembers[i];
        if (m.name) {
          const nameTrimmed = String(m.name).trim();
          if (nameTrimmed.length < 2 || nameTrimmed.length > 60 || !/^[a-zA-Z\s.'-]+$/.test(nameTrimmed)) {
            return res.status(400).json({ message: `Member ${i + 1} Name can only contain letters, spaces, dots, and hyphens (2-60 chars)` });
          }
        }
        if (m.email) {
          const emailTrimmed = String(m.email).trim();
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrimmed)) {
            return res.status(400).json({ message: `Member ${i + 1} Email is invalid` });
          }
        }
        if (m.phone) {
          const phoneDigits = String(m.phone).replace(/\D/g, '');
          const mobile10 = phoneDigits.slice(-10);
          if (phoneDigits.length === 0 || mobile10.length !== 10 || !/^[6-9]\d{9}$/.test(mobile10)) {
            return res.status(400).json({ message: `Member ${i + 1} Phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9` });
          }
        }
      }
    }

    // Update user's phone number if provided in the registration form
    if (req.body.teamMembers && req.body.teamMembers[0] && req.body.teamMembers[0].phone) {
      await User.findByIdAndUpdate(req.user._id, { phone: req.body.teamMembers[0].phone });
    }

    event.registeredUsers.push(req.user._id);
    await event.save();

    // Save custom answers and team members for free registration
    await Registration.create({
      user: req.user._id,
      event: event._id,
      eventModel: modelName,
      customAnswers: req.body.customAnswers || [],
      teamSize: req.body.teamSize || 1,
      teamMembers: req.body.teamMembers || []
    });

    // Generate QR Token and Image
    let qrToken = null;
    let qrDataUrl = '';
    if (event.generateQRCode) {
      qrToken = jwt.sign({
        userId: req.user._id,
        eventId: event._id,
        model: modelName
      }, process.env.JWT_SECRET || 'secret');

      try {
        qrDataUrl = await QRCode.toDataURL(qrToken, { width: 200, margin: 2 });
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }

    // Send Ticket Confirmation Email
    if (req.user.email) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #8B5CF6; color: white; padding: 20px;">
              <h1 style="margin: 0; font-size: 24px;">Ticket Confirmed!</h1>
              <p style="margin: 5px 0 0;">${event.title}</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; font-weight: bold;">Hello ${req.user.name || 'User'},</p>
              <p>Your registration for <strong>${event.title}</strong> is successful.</p>
              ${event.generateQRCode ? `
              <p>Please present the digital ticket below at the entry gate.</p>
              
              <div style="background: #f8f9fc; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                <img src="cid:ticketqr" alt="Ticket QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
              </div>
              ` : ''}
              <div style="text-align: left; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 20px;">
                <p><strong>Venue:</strong> ${event.venue || event.location}</p>
                <p><strong>Date:</strong> ${event.date || event.startDate}</p>
              </div>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; font-size: 12px; color: #6b7280;">
              Powered by Eventum
            </div>
          </div>
        `;

        const attachments = [];
        if (event.generateQRCode && qrDataUrl) {
          const base64Data = qrDataUrl.split(';base64,').pop();
          attachments.push({
            filename: 'ticket-qr.png',
            content: base64Data,
            encoding: 'base64',
            cid: 'ticketqr'
          });
        }

        await transporter.sendMail({
          from: '"Eventum" <' + process.env.GMAIL_USER + '>',
          to: req.user.email,
          subject: 'Your Ticket: ' + event.title,
          html: emailHtml,
          attachments: attachments
        });
      } catch (err) {
        console.error('Error sending ticket email:', err);
      }
    }

    res.json({ message: 'Successfully registered for event', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Scan QR Code for entry
// @route   POST /api/events/scan
router.post('/scan', requireAuth, async (req, res) => {
  const { qrToken } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Unauthorized" });
  }

  let payload;
  try {
    payload = jwt.verify(qrToken, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(400).json({ message: "Invalid QR" });
  }

  const Model = payload.model === 'EventSubmission' ? EventSubmission : (payload.model === 'ClubsEvent' ? ClubsEvent : Event);

  const event = await Model.findOneAndUpdate(
    {
      _id: payload.eventId,
      registeredUsers: payload.userId,
      attendedUsers: { $ne: payload.userId }
    },
    { $addToSet: { attendedUsers: payload.userId } },
    { new: true }
  );

  if (!event) {
    const existing = await Model.findById(payload.eventId);
    if (!existing) return res.status(404).json({ message: "Event not found" });
    if (!existing.registeredUsers.includes(payload.userId))
      return res.status(403).json({ message: "Not registered" });
    return res.status(409).json({ message: "Already Scanned! Entry Denied" });
  }

  res.json({ message: "Access Granted" });
});

module.exports = router;
