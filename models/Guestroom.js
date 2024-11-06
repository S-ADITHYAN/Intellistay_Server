const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GoogleRegisters', required: true },
  name: { type: String, required: true },
  email: { type: String},
  phone: { type: String},
  address: { type: String },
  dob: { type: Date, required: true },
  role: { type: String, required: true },
  proofType: { type: String},
  proofNumber: { type: String},
  proofDocument: { type: String },
  saveDetails: { type: Boolean, default: false } // store the file URL or path
});

const RoomGuestModel = mongoose.model('RoomGuest', guestSchema);

module.exports = RoomGuestModel;