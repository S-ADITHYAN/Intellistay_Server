const mongoose = require('mongoose')

const MaintenanceJobSchema = new mongoose.Schema({
    staff_id: String,
    room_id: String,
    task_description: String,
    task_date:Date,
    status:String,
    photos: {
        type: [String],
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    cleaningRequired: {
        type: String,
        default: null
    }
    
},{timestamps:true});

 const MaintenanceJobModel = mongoose.model("maintenancejob",MaintenanceJobSchema);
 module.exports=MaintenanceJobModel;