const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reservation',
    required: [true, 'Reservation ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoogleRegisters',
    required: [true, 'User ID is required']
  },
  hotelRating: {
    type: Number,
    required: [true, 'Hotel rating is required'],
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  roomRating: {
    type: Number,
    required: [true, 'Room rating is required'],
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  feedback: {
    type: String,
    trim: true,
    maxLength: [500, 'Feedback cannot exceed 500 characters']
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  lastEditedDate: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
module.exports = FeedbackModel;
