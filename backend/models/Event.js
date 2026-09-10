const mongoose = require('mongoose');

const additionalDocSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: String
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organizer: {
    type: String,
    required: true
  },
  date: {
    type: String, // String to match existing frontend format (e.g. "Sat, Feb 14 • 4:45 am")
    required: false
  },
  venue: {
    type: String,
    required: false
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: ''
  },
  externalRegistrationLink: { type: String, default: '' },
  location: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 0
  },
  image: {
    type: String, // Cloudinary URL
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: String,
    default: 'Free'
  },
  seats: {
    type: String,
    default: 'Limited'
  },
  tag: {
    type: String,
    enum: ['', 'Trending', 'Hot', 'New'],
    default: ''
  },
  participantType: {
    type: String,
    enum: ['individual', 'team'],
    default: 'individual'
  },
  teamMin: { type: Number, default: 1 },
  teamMax: { type: Number, default: 4 },
  eligibility: { type: String, default: '' },
  targetDepartment: { type: String, default: 'All' },
  timeline: [{
    title: String,
    desc: String,
    startDate: String,
    endDate: String
  }],
  additionalDocs: [additionalDocSchema],
  rules: { type: String, default: '' },
  contacts: [{
    name: String,
    email: String,
    phone: String
  }],
  announcements: [{
    title: String,
    content: String,
    date: { type: Date, default: Date.now }
  }],
  customQuestions: [{
    question: String,
    type: { type: String, enum: ['Text', 'Checkbox', 'Radio', 'Dropdown', 'File Upload'], default: 'Text' },
    required: { type: String, enum: ['Required', 'Optional', 'Off'], default: 'Optional' },
    options: [String],
    selectionType: { type: String, enum: ['Single', 'Multiple'], default: 'Multiple' }
  }],
  tickets: [{
    category: String,
    price: String
  }],
  prizes: [{
    rewardType: String,
    position: String,
    amount: String
  }],
  visibility: { type: String, default: 'Public' },
  registrationDeadline: { type: String, default: '' },
  generateQRCode: { type: Boolean, default: false },
  registrationControl: { type: String, default: 'Require Approval' },
  personalInfo: [{
    name: String,
    required: String
  }],
  eduInfo: [{
    name: String,
    required: String
  }],
  organizingTeam: [{
    name: String,
    email: String,
    phone: String,
    role: String,
    color: String
  }],
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attendedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationStatus: {
    type: String,
    enum: ['Open', 'Closed', 'Draft', 'Not Yet Started'],
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
