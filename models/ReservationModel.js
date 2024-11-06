const mongoose = require('mongoose')

const ReservationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GoogleRegisters', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'room', required: true },
    check_in:Date,
    check_out:Date, 
    booking_date:Date,
    status:String,
    check_in_time:Date,
    check_out_time:Date,
    total_amount: Number,
    guestids:[{ type: mongoose.Schema.Types.ObjectId, ref: 'RoomGuest' }],
    totaldays:String,
    is_verified:String,
    cancel_date:{ type: Date, default: null }
    
},{timestamps:true});

 const ReservationModel = mongoose.model("reservation",ReservationSchema);
 module.exports=ReservationModel;