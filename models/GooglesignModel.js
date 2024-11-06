const mongoose = require('mongoose')

const GoogleRegisterSchema = new mongoose.Schema({
    googleId: String,
    displayName:String,
    image:String, 
    email: String,
    password:String,
    otp:String,
    otpExpires:String,
    dob:String,
    address:String,
    phone_no:String,
},{timestamps:true});

 const GoogleRegisterModel = mongoose.model("GoogleRegisters",GoogleRegisterSchema);
 module.exports=GoogleRegisterModel;