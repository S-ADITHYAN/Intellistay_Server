const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    staffId: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    present: {
        type: Boolean,
        default: false,
    },
});

const AttendanceModel = mongoose.model('Attendance', AttendanceSchema);
module.exports = AttendanceModel;