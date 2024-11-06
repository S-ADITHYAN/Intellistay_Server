const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'GoogleRegisters', required: true },
  paymentId: { type: String, required: true },
  
  totalRate: { type: Number, required: true },
  totldays: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }, // "Confirmed", "Pending", etc.
  reservationid: { type: mongoose.Schema.Types.ObjectId, ref: 'reservation', required: true },
});

const BillModel = mongoose.model('Bill', BillSchema); // Corrected model name to 'Bill'

module.exports = BillModel;
