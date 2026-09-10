const mongoose = require('mongoose');

const additionalDocSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: String
}, { _id: false });

const eventSubmissionSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    mode: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    registrationStatus: {
      type: String,
      enum: ['Open', 'Closed', 'Draft', 'Not Yet Started'],
      default: 'Open'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    registeredUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
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
    externalRegistrationLink: { type: String, default: '' },
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
    attendedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    withdrawalStatus: {
      type: String,
      enum: ['none', 'pending', 'approved'],
      default: 'none'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventSubmission', eventSubmissionSchema);
