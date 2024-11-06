require("dotenv").config()
const express = require("express");
const Razorpay= require("razorpay")
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const multer = require('multer');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const GoogleRegisterModel = require("./models/GooglesignModel");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const RegisterModel=require("./models/RegisterModel");
const cookieParser=require("cookie-parser");
const bodyParser=require("body-parser");
const jwt=require("jsonwebtoken");
const RoomModel = require("./models/RoomModel");
const ReservationModel = require("./models/ReservationModel");
const StaffModel = require("./models/StaffModel");
const crypto = require('crypto');
const HousekeepingJobModel=require("./models/HousekeepingJobModel")
const LeaveApplicationModel=require("./models/LeaveApplicationModel")
const AttendanceModel=require("./models/AttendenceModel");
const MaintenanceJobModel = require("./models/MaintenanceJobmodel");
const nodemailer = require('nodemailer');
const RoomGuestModel=require('./models/Guestroom')
const BillModel=require('./models/BillModel')
const FeedbackModel=require('./models/FeedbackModel')



const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

app.use(cors({
  origin: ["http://localhost:5173","http://localhost:5174","http://localhost:5175"],
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true // Allows cookies to be sent with the request
}));


// mongoose.connect("mongodb://127.0.0.1:27017/test2");

mongoose.connect(process.env.Mongodb_Connection);

app.use("/uploads",express.static("./uploads/rooms"))
app.use("/cleanedrooms",express.static("./uploads/cleanedrooms"))
app.use("/profilepicture",express.static("./uploads/staffprofilepicture"))
app.use("/profdocs",express.static("./uploads/proofdocs"))
// Setup session
var MemoryStore =session.MemoryStore;
app.use(session({
    secret: "secretintelli01",
    resave: false,
    saveUninitialized: true,
    store: new MemoryStore(),
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'None',
        maxAge:1000*60*60*24
    },
}));

// Razorpay instance

// var instance = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
//   });


//   var options = {
//     amount: 50000,  // amount in the smallest currency unit
//     currency: "INR",
//     receipt: "order_rcptid_11"
//   };
//   instance.orders.create(options, function(err, order) {
//     console.log(order);
//   });

// Razorpay end






// Setup passport
app.post("/authWithGoogle",async (req,res)=>{
    
        const {name,  email, password, images} = req.body;
        
    
        try{
            const existingUser = await GoogleRegisterModel.findOne({ email: email });       
    
            if(!existingUser){
                const result = await GoogleRegisterModel.create({
                    displayName:name,
                    email:email,
                    password:password,
                    image:images,
                
                });
    
        
                const token = jwt.sign({displayName:result.displayName,email:result.email,_id: result._id}, process.env.JWT_SECRET_KEY);
    
                return res.status(200).send({
                     user:result,
                     token:token,
                     msg:"User Login Successfully!"
                 })
        
            }
    
            else{
                const existingUser = await GoogleRegisterModel.findOne({ email: email });
                const token = jwt.sign({displayName:existingUser.displayName,email:existingUser.email,_id: existingUser._id}, process.env.JWT_SECRET_KEY);
    
                return res.status(200).send({
                     user:existingUser,
                     token:token,
                     msg:"User Login Successfully!"
                 })
            }
          
        }catch(error){
            console.log(error)
        }
    
});

 app.post("/logout", (req, res) => {
    if(req.session){
        req.session.destroy(err=>{
            if(err){
            res.status(500).json({error:"failed to logout"});
            }else{
                res.status(200).json("logout successful");
            }
        })
    }
    else{
        res.status(400).json({error:"no session found"});
    }

});


app.post('/login', (req, res) => {
    const { emailsign, passwordsign } = req.body;
    console.log(passwordsign)
    GoogleRegisterModel.findOne({ email: emailsign })
        .then(user => {
            if (user) {
            
                if (user.password && user.password.length > 0 && user.password === passwordsign) {
                    console.log("hello")
                    req.session.email =  emailsign ;
                    const token = jwt.sign({ displayName:user.displayName,email:user.email,_id:user._id,image:user.image }, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",data: req.session.email,id:user._id,token:token,displayName:user.displayName});
                    
                } else {
                    res.json("the password is incorrect");
                }
            } else {
                res.json("No user found :(");
            }
        })
        .catch(err => res.json(err));
});


app.post('/stafflogin', (req, res) => {
    const { emailsign, passwordsign } = req.body;
    StaffModel.findOne({ email: emailsign })
        .then(user => {
            if (user) {
                if (user.password === passwordsign) {
                    console.log(user._id)
                    console.log(user.image)
                    const token = jwt.sign({displayName:user.displayName,email:user.email,role:user.role,_id:user._id,image:user.image}, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",token: token});
                    
                } else {
                    res.json({message:"the password is incorrect"});
                }
            } else {
                res.json({message:"No user found :("});
            }
        })
        .catch(err => res.json(err));
});

app.post('/Adminlogin', (req, res) => {
    const { emailsign, passwordsign } = req.body;
   
            if (emailsign==='admin@gmail.com' ) {
                if (passwordsign==='Admin123@') {
                  
                    const token = jwt.sign({email:'admin@gmail.com'}, process.env.JWT_SECRET_KEY);
                    res.status(200).json({message:"success",token: token});
                    
                } else {
                    res.json("the password is incorrect");
                }
            } else {
                res.json("No user found :(");
            }
        
        
});



app.get('/profile', (req, res) => {
    console.log(req.user);
    if (req.user) {
        
        res.status(200).json( req.user.email);
    } 
    else {
      res.status(401).json({ message: 'Not logged in' });
    }
  });

// app.post('/register', async(req, res) => {
//     const{email,password}=req.body;
//     try {
//         let user = await GoogleRegisterModel.findOne({ email: email });
//         if (!user) {
//             user = new GoogleRegisterModel({
               
//                 email: email ,
//                 password: password,
//             });
//             await user.save();
//             return res.status(200).json("success");
//              // Save the new user to the database
//         }
//         else{
//         return res.json("exists");
//         }
//     } catch (error) {
//         return done(error, null);
//     }
// });



// Function to generate a random OTP
const otpStore = {};

// Generate OTP function
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    console.log(`Generated OTP: ${otp}`);
    return otp;
};

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email_id,
            pass: process.env.password,
        },
    });

    let mailOptions = {
        from: process.env.email_id,
        to: email,
        subject: 'Your OTP for Registration',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    };

    return transporter.sendMail(mailOptions);
};

// Route to handle registration and OTP generation
app.post('/register', async (req, res) => {
    console.log("Request Body:", req.body);
    const { email, password, firstname } = req.body;

    try {
        let user = await GoogleRegisterModel.findOne({ email: email });
        console.log(user);
        if (user) {
            return res.status(200).json({ message: "Email already exists." });
        } else {
            // Generate OTP
            const otp = generateOTP();
            console.log('Generated OTP:', otp);

            // Store OTP and password in memory for 10 minutes
            otpStore[email] = { otp, password, expires: Date.now() + 10 * 60 * 1000 }; // expires in 10 minutes

            // Send OTP to the user's email
            await sendOtpEmail(email, otp);

            // Send response with all form data
            return res.status(200).json({
                message: "OTP sent to your email.",
                formdata: { ...req.body },
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
});

// Route to verify OTP
// app.post('/verify-otp', async (req, res) => {
//     console.log(req.body)
//     const { email, otp, firstname } = req.body;

//     try {
//         // Check if the OTP exists and is still valid
//         const storedData = otpStore[email];
//         if (!storedData || Date.now() > storedData.expires) {
//             delete otpStore[email]; // Clean up expired OTP
//             return res.status(400).json({ message: "OTP has expired or is invalid." });
//         }

//         // Check if the OTP matches
//         if (otp === storedData.otp) {
//             // OTP is correct, save user to the database
//             let user = new GoogleRegisterModel({
//                 email,
//                 password: storedData.password, // Ideally, hash this before saving
//                 displayName: firstname,
//             });
//             await user.save();

//             // Remove OTP from memory after successful registration
//             delete otpStore[email];

//             return res.status(200).json({ message: "OTP verified. Registration complete." });
//         } else {
//             return res.status(400).json({ message: "Invalid OTP." });
//         }
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Server error. Please try again." });
//     }
// });

const sendAccountConfirmationEmail = async (email,firstname) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email_id,
            pass: process.env.password,
        },
    });

    let mailOptions = {
        from: process.env.email_id,
        to: email,
        subject: 'Account Successfully Created',
        text: `Your account has been successfully created! Welcome, ${firstname} to IntelliStay platform.`,
    };

    return transporter.sendMail(mailOptions);
};

app.post('/verify-otp', async (req, res) => {
    console.log(req.body);
    const { email, otp, firstname } = req.body;

    try {
        // Check if the OTP exists and is still valid
        const storedData = otpStore[email];
        if (!storedData || Date.now() > storedData.expires) {
            delete otpStore[email]; // Clean up expired OTP
            return res.status(400).json({ message: "OTP has expired or is invalid." });
        }
        
        // Check if the OTP matches
        if (otp === storedData.otp) {
            // OTP is correct, save user to the database
            const salt=await bcrypt.genSalt(10);
            const hashpass=await bcrypt.hash(storedData.password,salt)
            let user = new GoogleRegisterModel({
                email,
                password: hashpass, // Ideally, hash this before saving
                displayName: firstname,
            });
            await user.save();

            // Send account creation confirmation email
            await sendAccountConfirmationEmail(email,firstname);

            // Remove OTP from memory after successful registration
            delete otpStore[email];

            return res.status(200).json({ message: "OTP verified. Registration complete." });
        } else {
            return res.status(400).json({ message: "Invalid OTP." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
});


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/rooms'); // Define the folder where images will be stored
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Give each file a unique name
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and JPEG are allowed.'), false);
    }
};

// Initialize Multer for multiple file uploads
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
}).array('images', 10); // Allow up to 10 images

// Updated '/addroom' endpoint
app.post('/addroom', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        const { roomno, roomtype, status, rate, description } = req.body;
        
        try {
            let room = await RoomModel.findOne({ roomno: roomno });
            if (!room) {
                // Get file paths for the uploaded images
                const imagePaths = req.files.map(file => path.basename(file.path));

                // Create new room with images
                room = new RoomModel({
                    roomno: roomno ,
                    roomtype: roomtype,
                    status:status,
                    rate:rate,
                    description:description,
                    images: imagePaths
                });
                
                await room.save();
                return res.status(200).json("Room added successfully");
            } else {
                return res.status(400).json("exists");
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });
});



// app.post('/addroom', async(req, res) => {
//     const{roomno,roomtype,status,rate,description}=req.body;
//     try {
//         let room = await RoomModel.findOne({ roomno: roomno });
//         if (!room) {
//             room = new RoomModel({
               
//                 roomno: roomno ,
//                 roomtype: roomtype,
//                 status:status,
//                 rate:rate,
//                 description:description,
//             });
//             await room.save();
//             return res.status(200).json("added"); // Save the new user to the database
//         }
//         else{
//         return res.json("exists");
//         }
//     } catch (error) {
//         return res.json(error, null);
//     }
// });

app.post('/roomdetails', async (req, res) => {
    try {
        let rooms = await RoomModel.find();
        
        if (rooms && rooms.length > 0) {
            
            return res.status(200).json(rooms); // sending room details
        } else {
            return res.status(404).json({ message: "No rooms are available" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
});

app.post('/handleMaintenance', async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Room ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await RoomModel.updateOne(
            { _id: id }, 
            { $set: { status: "maintenance" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Room not found or status already set to maintenance.");
        }

        return res.status(200).json("Room status updated successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
});


app.post('/handleAvailable', async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Room ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await RoomModel.updateOne(
            { _id: id }, 
            { $set: { status: "available" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Room not found or status already set to available.");
        }

        return res.status(200).json("Room status updated successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
});


const booking=() => {
    
    try {
            let reservation = new ReservationModel({
                user_id:"1212",
                room_id: "66d18e0c66d97da49543b32d" ,
                check_in: "2024-08-29",
                check_out:"2024-08-30",
                booking_date:"2024-08-24",
                status:"reserved",
                total_amount:5500,
                
            });
            reservation.save();
            console.log("added"); // Save the new user to the database
        }
       
     catch (error) {
        console.log(error); 
    }
};
// booking();




// Route to get reservation details
app.post('/resdetails', async (req, res) => {
    try {
        // Fetch all reservations sorted in reverse order based on _id
        let reservations = await ReservationModel.find().sort({ _id: -1 });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "No reservations found" });
        }

        // Extract user_ids and room_ids from reservations
        const userIds = reservations.map(reservation => reservation.user_id);
        const roomIds = reservations.map(reservation => reservation.room_id);

        // Fetch user details for the extracted user_ids
        const users = await GoogleRegisterModel.find({ _id: { $in: userIds } }).select('-password'); // Exclude password

        // Fetch room details for the extracted room_ids
        const rooms = await RoomModel.find({ _id: { $in: roomIds } });

        // Create a mapping for users and rooms for easy lookup
        const userMap = {};
        users.forEach(user => {
            userMap[user._id] = user;
        });

        const roomMap = {};
        rooms.forEach(room => {
            roomMap[room._id] = room;
        });

        // Combine reservation details with user and room details
        const detailedReservations = reservations.map(reservation => ({
            ...reservation.toObject(), // Convert mongoose document to plain object
            user: userMap[reservation.user_id], // Add user details
            room: roomMap[reservation.room_id], // Add room details
        }));

        return res.status(200).json(detailedReservations); // Sending combined details
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // Handle errors properly
    }
});





app.post('/handleCancellation', async (req, res) => {
    try {
        // Ensure you extract the ID properly from the request body
        const { id } = req.body;

        if (!id) {
            return res.status(400).json("Reservation ID is required.");
        }

        // Update the room status to "maintenance"
        const result = await ReservationModel.updateOne(
            { _id: id }, 
            { $set: { status: "cancelled" } }
        );

        // Check if any documents were modified
        if (result.nModified === 0) {
            return res.status(404).json("Booking not found or status already set to cancelled.");
        }

        return res.status(200).json("Reservation Cancelled successfully.");
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); // handle errors properly
    }
});


const generatePassword = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_';
  let password = '';
  
  // Generate password until it meets the conditions
  while (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[a-zA-Z\d!@#$%^&*()_+[\]{}|;:,.<>?]{6,50}$/.test(password)) {
      password = '';
      for (let i = 0; i < 10; i++) { // Generate a password of 10 characters
          const randomIndex = Math.floor(Math.random() * characters.length);
          password += characters[randomIndex];
      }
  }
  return password;
};


// Function to send a confirmation email
const sendConfirmationEmail = async (email, displayName, password,role) => {
  // Create a transporter object using your SMTP settings
  const transporter = nodemailer.createTransport({
      service: 'gmail', // For example, using Gmail
      auth: {
          user: process.env.email_id, // Your email address
          pass: process.env.password, // Your email password or app password
      },
  });

  const mailOptions = {
      from: process.env.email_id,
      to: email,
      subject: 'Account Confirmation',
      text: `Hello ${displayName},\n\nYour account has been created successfully!\n\nEmail: ${email}\nRole: ${role}\nPassword: ${password}\n\nPlease keep this information safe.\n\nBest regards,\nIntelliSttay`,
  };

  return transporter.sendMail(mailOptions);
};

app.post('/staffregister', async (req, res) => {
  
  const { email, displayName, phone_no, role, address, dob, salary } = req.body;
  try {
      let staff = await StaffModel.findOne({ email: email });
      
      if (!staff) {
        
          // Generate a unique password that meets the regex requirements
          const password = generatePassword();
          

          staff = new StaffModel({
              displayName: displayName,
              phone_no: phone_no,
              role: role,
              address: address,
              dob: dob,
              salary: salary,
              email: email,
              password: password, // Use the generated password
          });

          await staff.save();

          // Send confirmation email
          await sendConfirmationEmail(email, displayName, password,role);

          return res.status(200).json({ message: "Staff registered successfully" });
      } else {
          return res.json("exists");
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
  }
});


app.post('/staffdetails', async (req, res) => {
    try {
        
        let staff = await StaffModel.find().select('-password');
        
        if (staff && staff.length > 0) {
            return res.status(200).json(staff); 
        } else {
            return res.status(404).json({ message: "No staffs are added" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message }); 
    }
});

const assignHousekeepingJobs = async () => {
    try {
        // Fetch all reservations where the checkout date is today
        const today = new Date().setHours(0, 0, 0, 0); // Set to start of the day
        const tomorrow = new Date().setHours(24, 0, 0, 0); // Set to start of the next day

        const reservations = await ReservationModel.find({
            check_out: {
                $gte: today,
                $lt: tomorrow,
            },
            status: "reserved",
        });

        for (const reservation of reservations) {
            // Find an available housekeeping staff
            const availableStaff = await StaffModel.findOne({ role: "housekeeping", availability: true });

            if (availableStaff) {
                // Assign the job to the housekeeping staff
                const housekeepingJob = new HousekeepingJobModel({
                    room_id: reservation.room_id.toString(),
                    task_description: "Room cleaning after checkout",
                    task_date: new Date(),
                    status: "assigned",
                    staff_id: availableStaff._id.toString(),
                });

                await housekeepingJob.save();

                // Update the room status to "cleaning assigned"
                await RoomModel.updateOne(
                    { _id: reservation.room_id },
                    { status: "cleaning assigned" }
                );

                console.log(`Job assigned to ${availableStaff.displayName} for room ${reservation.room_id}`);
            } else {
                console.log("No available housekeeping staff for this reservation.");
            }
        }
    } catch (error) {
        console.error("Error assigning housekeeping jobs:", error);
    }

};

// Call the function to start the job assignment
//

//assignHousekeepingJobs();


// Schedule the job assignment to run automatically based on the reservation table's checkout date and time
const scheduleJobAssignment = () => {
    const currentDate = new Date();
    const targetTime = new Date().setHours(10, 55, 0, 0);

    if (currentDate >= targetTime) {
        assignHousekeepingJobs();
    } else {
        const delay = targetTime - currentDate;
        setTimeout(assignHousekeepingJobs, delay);
    }
};

// Call the function to start the job assignment schedule
// scheduleJobAssignment();





app.post('/asjobdetails', async (req, res) => {
    try {
        // Fetch all housekeeping jobs
        const housekeepingJobs = await HousekeepingJobModel.find().lean();
        
        // Fetch all maintenance jobs
        const maintenanceJobs = await MaintenanceJobModel.find().lean();

        // Combine both job details
        const allJobs = [...housekeepingJobs, ...maintenanceJobs];

        // If no jobs are found, send an empty array
        if (allJobs.length === 0) {
            return res.status(200).json([]);
        }

        // Array to hold job details with room number and staff details
        const jobDetailsWithRoomNoAndStaff = await Promise.all(
            allJobs.map(async (job) => {
                // Find the room based on roomId
                const room = await RoomModel.findById(job.room_id).lean();

                // Find the staff based on staffId
                const staff = await StaffModel.findById(job.staff_id).lean();

                // Return an object with desired fields
                return {
                    _id: job._id,
                    roomNo: room ? room.roomno : 'Unknown', // Fallback if room is not found
                    taskDescription: job.task_description,
                    taskDate: job.task_date,
                    status: job.status,
                    photos: job.photos,
                    maintenanceRequired: job.maintenanceRequired,
                    completedAt: job.completedAt,
                    staffDisplayName: staff ? staff.displayName : 'Unknown', // Fallback if staff is not found
                    staffRole: staff ? staff.role : 'Unknown', // Fallback if staff is not found
                    staffEmail: staff ? staff.email : 'Unknown' // Fallback if staff is not found
                };
            })
        );

        // Respond with the job details including room number and staff details
        res.status(200).json(jobDetailsWithRoomNoAndStaff);
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Assuming you have the Room model setup

// Setup multer for file storage
// const stora = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/rooms'); // Set your upload directory
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname); // Save the file with its original name
//   },
// });

// const uploadss = multer({ stora });

const stora = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/rooms'); // Define the folder where images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate unique file name
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save file with unique name
  }
});

// File filter to accept only images (PNG, JPG, JPEG)
const filler = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and JPEG are allowed.'), false); // Reject file if not allowed type
  }
};

// Initialize Multer for multiple file uploads
const uploadss = multer({
  storage: stora,
  fileFilter: filler
}).array('newImages', 10); // Limit to 10 images

// Update room route with image handling
app.post('/updateroom/:id', (req, res) => {
  uploadss(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message }); // Handle Multer errors
    }

    const { roomno, roomtype, status, rate, description, existingImages } = req.body;

    // Ensure `existingImages` is an array, or initialize it as an empty array
    let updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

    // If new images were uploaded, append their unique filenames to `updatedImages`
    if (req.files && req.files.length > 0) {
      const newImageNames = req.files.map(file => file.filename); // Save only filenames
      updatedImages = [...updatedImages, ...newImageNames]; // Merge existing and new images
    }
// Merge existing and new images
    

    console.log("Final Images Array:", updatedImages); // Log final image array
try{
    // Update room details and images in the database
    const updatedRoom = await RoomModel.findByIdAndUpdate(
      req.params.id,
      {
        roomno,
        roomtype,
        status,
        rate,
        description,
        images: updatedImages, // Save the final image array
      },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).send('Room not found');
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error); // Log the error for debugging
    res.status(500).send('Server error');
  }
});
});


// app.post('/updateroom/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updatedData = req.body;

//         // Find the room by ID and update it
//         const updatedRoom = await RoomModel.findByIdAndUpdate(id, updatedData, { new: true });

//         if (!updatedRoom) {
//             return res.status(404).json({ message: 'Room not found' });
//         }

//         res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
//     } catch (error) {
//         console.error('Error updating room:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

app.post('/checkrooms', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, adults, children } = req.body.searchdata;
        
        // Validation: Check if adults or children are within reasonable bounds
        if (adults <= 0 || children < 0) {
            return res.status(400).json({ message: 'Invalid number of adults or children' });
        }

        // Calculate the number of rooms needed based on 2 adults and 2 children per room
        const totalPeople = adults + children;
        const roomsNeeded = Math.ceil(totalPeople / 4); // Each room can have up to 4 people (2 adults, 2 children)

        // Find reserved rooms for the check-in date
        const reservedRooms = await ReservationModel.find({
            check_in: { $eq: new Date(checkInDate) }
        }).distinct('room_id');
        // console.log('Reserved rooms:', reservedRooms);

        // Find available rooms
        const availableRooms = await RoomModel.find({
            _id: { $nin: reservedRooms }
        });
console.log("avaiable",availableRooms)
        if (availableRooms.length < roomsNeeded) {
            return res.status(200).json({ 
                message: 'Not enough available rooms', 
                availableRooms, 
                roomsNeeded, 
                roomsAvailable: availableRooms.length 
            });
        }

        // Return the available rooms and number of rooms needed
        res.status(200).json({ 
            message: 'Rooms available', 
            availableRooms, 
            roomsNeeded 
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).send('Server Error');
    }
});


//   app.post('/confirmbook', async (req, res) => {
//     try {
//         const { roomdatas, datas, userid,trateString } = req.body;
//          console.log(datas);
//          console.log(roomdatas);
//         const newReservation = new ReservationModel({
//             user_id: userid,
//             room_id: roomdatas._id,
//             check_in: new Date(datas.checkInDate),
//             check_out: new Date(datas.checkOutDate),
//             booking_date: new Date(),
//             status: 'booked', // Example status
//             check_in_time: datas.check_in_time ? new Date() : null,
//             check_out_time: datas.check_out_time ? new Date() : null,
//             total_amount: trateString,
//         });

//         await newReservation.save();

//         res.status(200).json({ message: 'Booking confirmed', reservation: newReservation });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Server Error', error: err });
//     }
// });

app.get('/previousGuestDetails/:id', async (req, res) => {
  try {
    const userid = req.params.id;
    // Fetch all previous guest details from database for the given user_id
    const previousGuests = await RoomGuestModel.find({ user_id: userid , saveDetails: true });

    if (previousGuests && previousGuests.length > 0) {
      return res.json(previousGuests);
    } else {
      return res.status(404).json({ message: 'No previous guests found' });
    }
  } catch (error) {
    console.error('Error fetching previous guests:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Define storage for the uploaded files
const pack = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/proofdocs'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Define unique filename
    }
});

// File filter to restrict file types
const Filter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, JPG, and PNG are allowed.'), false); // Reject file
    }
};

// Create a multer instance with file filter
const uploadssss = multer({
    storage: pack,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: Filter
});

// Middleware to handle file uploads (you can adjust the number of files as needed)
const uploadHandler = uploadssss.array('proofDocuments', 10); // Maximum 10 files at a time


// Create a transporter using SMTP


app.post('/confirmbook', (req, res) => {
    uploadHandler(req, res, async (err) => {
        if (err) {
            console.log('Upload Error:', err);
            return res.status(500).json({
                success: false,
                message: 'File upload failed',
                error: err.message,
            });
        }
    
        console.log('Uploaded Files:', req.files);

        try {
            // Parse request body data
            const roomDetails = JSON.parse(req.body.roomDetails);
            const datas = JSON.parse(req.body.datas);
            const selectedGuestIds = JSON.parse(req.body.selectedGuestIds);
            const newGuestDetails = JSON.parse(req.body.newGuestDetails);
            const userid = req.body.userid;
            const totalRate = req.body.totalRate;
            const totldays = req.body.totldays;

            // Extract specific details
            const roomId = roomDetails._id;
            const checkInDate = datas.checkInDate;
            const checkOutDate = datas.checkOutDate;
            const totalAmount = totalRate;
            const userId = userid;

            // Save New Guest Details (Adults and Children)
            const newGuestIds = [];
            let fileIndex = 0;

            // Process New Adults
            if (Array.isArray(newGuestDetails.adults) && newGuestDetails.adults.length > 0) {
                for (const adult of newGuestDetails.adults) {
                    const proofDocument = req.files && req.files[fileIndex] ? req.files[fileIndex].filename : null;
                    fileIndex++;

                    const newGuest = new RoomGuestModel({
                      user_id:userId,
                        name: adult.name,
                        email: adult.email,
                        phone: adult.phone,
                        address: adult.address,
                        dob: adult.dob,
                        role: 'adult',
                        proofType: adult.proofType,
                        proofNumber: adult.proofNumber,
                        proofDocument,
                        saveDetails: adult.saveDetails,
                    });

                    const savedGuest = await newGuest.save();
                    newGuestIds.push(savedGuest._id);
                }
            }

            // Process New Children
            if (Array.isArray(newGuestDetails.children) && newGuestDetails.children.length > 0) {
                for (const child of newGuestDetails.children) {
                    const newChildGuest = new RoomGuestModel({
                        name: child.name,
                        dob: child.dob,
                        role: 'child',
                        saveDetails: child.saveDetails,
                    });
                    const savedChild = await newChildGuest.save();
                    newGuestIds.push(savedChild._id);
                }
            }

            // Combine selected previous guest IDs with new guest IDs
            const allGuestIds = [...selectedGuestIds, ...newGuestIds];

            // Create Reservation
            const newReservation = new ReservationModel({
                user_id: userId,
                room_id: roomId,
                check_in: new Date(checkInDate),
                check_out: new Date(checkOutDate),
                booking_date: new Date(),
                status: 'booked',
                total_amount: totalAmount,
                totaldays: totldays,
                check_in_time: datas.check_in_time ? new Date() : null,
                check_out_time: datas.check_out_time ? new Date() : null,
                guestids: allGuestIds,
            });

            // Save reservation to the database
            const savedReservation = await newReservation.save();

            // Fetch user email from the database
            res.status(201).json({
                success: true,
                message: 'Room booking confirmed and confirmation email sent!',
                reservation: savedReservation,
            });
        } catch (error) {
            console.error('Error in booking process:', error);
            res.status(500).json({
                success: false,
                message: 'Error booking room or sending confirmation email',
                error: error.message,
            });
        }
    });
});

  

app.get('/my-bookings/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch bookings and sort by _id in descending order
    const bookings = await ReservationModel.find({ user_id: userId })
      .populate({
        path: 'room_id', // Populate the room details
        select: 'images roomtype', // Select only the fields you want
      })
      .sort({ _id: -1 }); // -1 for descending order

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error });
  }
});



//   const upload = multer({ storage: multer.memoryStorage() });

const store = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/rooms'); // Upload directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
    }
});

// File filter for image validation
const fileFilters = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only! (jpeg, jpg, png)');
    }
};

// Setup multer upload
const upd = multer({
    storage: store,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
    fileFilter: fileFilters
});



// Handle bulk data upload
app.post('/uploadBulkData', async (req, res) => {
    try {
        const rooms = req.body; // Array of room objects

        // Check if the rooms data is valid
        if (!Array.isArray(rooms) || rooms.some(room => typeof room !== 'object')) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        // Insert data into the database
        await RoomModel.insertMany(rooms);

        res.status(200).json({ message: 'Bulk data uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.post('/uploadBulkStaffData', async (req, res) => {
    try {
        const staffs = req.body; // Array of staff objects

        // Check if the staff data is valid
        if (!Array.isArray(staffs) || staffs.some(staff => typeof staff !== 'object')) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const validationErrors = [];
        const newStaffs = [];

        for (const staffData of staffs) {
            const { email, displayName, phone_no, role, address, dob, salary } = staffData;

            // Check if staff with the same email already exists
            let staff = await StaffModel.findOne({ email });

            if (!staff) {
                // Generate a unique password for the new staff
                const password = generatePassword(); // 16-character password

                newStaffs.push({
                    displayName,
                    phone_no,
                    role,
                    address,
                    dob,
                    salary,
                    email,
                    password, // Use the generated password
                });
                await sendConfirmationEmail(email, displayName, password,role);
            } else {
                validationErrors.push({ email, message: 'Staff already exists' });
            }
        }

        if (newStaffs.length > 0) {
            // Insert only new staff members into the database
            await StaffModel.insertMany(newStaffs);
        }

        if (validationErrors.length > 0) {
            return res.status(200).json({
                message: 'Bulk upload completed with some errors',
                errors: validationErrors
            });
        }

        return res.status(200).json({ message: 'Bulk staff details uploaded successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});


app.get('/staff/profile/:id', async (req, res) => {
    try {
      const staff = await StaffModel.findById(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
      
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  });

  app.put('/staff/profile/:id', async (req, res) => {
    try {
      const { displayName, email, address, salary,image,phone_no,role,dob } = req.body;
      const staff = await StaffModel.findByIdAndUpdate(
        req.params.id,
        { displayName, email, address, salary,image,phone_no,role,dob },
        { new: true, runValidators: true }
      );
  
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
  
      res.json({ message: "Profile updated successfully", staff });
    } catch (error) {
      res.status(500).json({ message: "Error updating profile", error });
    }
  });


  // routes/staff.js



// Change password route
app.put('/staff/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const staff = await StaffModel.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if current password matches
    if (currentPassword !== staff.password) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

    // Hash new password and update it
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);
    staff.password = newPassword;

    // Save the updated staff member
    await staff.save();
    res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


app.post('/asjobdetails/:staffId', async (req, res) => {
    try {
      // Get the staffId from the request params
      const staffId = req.params.staffId;
  
      // Find jobs assigned to the specific staffId
      const jobs = await HousekeepingJobModel.find({ staff_id: staffId });
  
      // If no jobs are found, send an empty array
      if (!jobs || jobs.length === 0) {
        return res.status(200).json([]);
      }
  
      // Array to hold job details with room number
      const jobDetailsWithRoomNo = await Promise.all(
        jobs.map(async (job) => {
          // Find the room based on room_id
          const room = await RoomModel.findById(job.room_id);
  
          // Return an object with desired fields (roomno, task_description, task_date, status)
          return {
            _id:job._id,
            roomno: room ? room.roomno : 'Unknown', // Fallback in case room is not found
            task_description: job.task_description,
            task_date: job.task_date,
            status: job.status,
            photos:job.photos,
            maintenanceRequired:job.maintenanceRequired,
            completedAt:job.completedAt
          };
        })
      );
  
      // Respond with the job details including room number
      res.status(200).json(jobDetailsWithRoomNo);
    } catch (error) {
      console.error('Error fetching job details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  app.post('/pickJob' ,async (req, res) => {
    const { jobId } = req.body;
    try {
        const job = await HousekeepingJobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        job.status = 'cleaning in progress';
        await job.save();
        res.status(200).json({ message: 'Job picked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error picking job', error });
    }
}
  );

  const storagee = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/cleanedrooms');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const uploadsss = multer({ storage: storagee });



// Complete a job
app.post('/completeJob', uploadsss.array('photos', 5) ,async (req, res) => {
    const { jobId, maintenanceRequired } = req.body;
    const files = req.files;

    try {
        const job = await HousekeepingJobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const photoFilenames = files.map(file => file.filename);
        job.photos = photoFilenames;
        job.status = 'cleaning completed';
        job.maintenanceRequired = maintenanceRequired;
        job.completedAt = new Date(); 
        await job.save();

        res.status(200).json({ message: 'Job completed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error completing job', error });
    }
}
);


app.get('/jobdetail/:id', async (req, res) => {
    try {
      const jobId = req.params.id;
  
      // Find the job in the database
      const job = await HousekeepingJobModel.findById(jobId);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Fetch the corresponding room details using the room ID from the job
      const room = await RoomModel.findById(job.room_id); // Assuming job has a field named roomId
  
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Construct the response object
      const response = {
        roomno: room.roomno,
        task_description: job.task_description,
        task_date: job.task_date,
        status: job.status,
        photos: job.photos,
        maintenanceRequired: job.maintenanceRequired,
        completedAt: job.completedAt,
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  
  app.post('/applyleave', async (req, res) => {
    try {
        const { staff_id, leaveType, startDate, endDate, reason } = req.body;
        console.log(req.body);

        // Parse startDate and endDate into Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        console.log(start);

        // Calculate the number of days for the leave application
        const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Check if the number of days applied for exceeds 5 days
        if (leaveDays > 5) {
            console.log(leaveDays);
            return res.status(200).json({ message: "You cannot apply for more than 5 days leave at a time." });
        }

        // Get current year for leave count checks
        const currentYear = new Date().getFullYear();
        console.log(currentYear)
        // Check if the staff has already taken 15 casual leaves this year
        if (leaveType === 'Casual Leave') {
            const casualLeaveTaken = await LeaveApplicationModel.countDocuments({
                staff_id,
                leaveType: 'Casual Leave',
                startDate: {
                    $gte: new Date(`${currentYear}-01-01T00:00:00.000+00:00`),
                    $lt: new Date(`${currentYear}-12-31T23:59:59.999+00:00`)
                }
            });

            if (casualLeaveTaken >= 15) {
                console.log(casualLeaveTaken)
                return res.status(200).json({ message: "You have already taken the maximum 15 Casual Leaves this year." });
            }
        }

        // Check if the staff has already taken 2 sick (medical) leaves this year
        if (leaveType === 'Sick Leave') {
            const medicalLeaveTaken = await LeaveApplicationModel.countDocuments({
                staff_id,
                leaveType: 'Sick Leave',
                startDate: {
                    $gte: new Date(`${currentYear}-01-01T00:00:00.000+00:00`),
                    $lt: new Date(`${currentYear}-12-31T23:59:59.999+00:00`)
                }
            });

            if (medicalLeaveTaken >= 2) {
                return res.status(200).json({ message: "You have already taken the maximum 2 Sick Leaves this year." });
            }
        }

        // Check if a leave application already exists for the given dates
        const existingApplication = await LeaveApplicationModel.findOne({
            staff_id,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        if (existingApplication) {
            return res.status(200).json({message:"Leave already taken on these days "});
        }

        // Create a new leave application
        const newLeaveApplication = new LeaveApplicationModel({
            staff_id,
            leaveType,
            startDate: new Date(startDate),  // ensure consistent Date format
            endDate: new Date(endDate),      // ensure consistent Date format
            reason,
            status: 'Pending',
            appliedon: new Date()
        });

        await newLeaveApplication.save();
        res.status(201).json(newLeaveApplication);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});


app.post('/leaveDetails/:userId',async (req, res) => {
    try {
      const leaves = await LeaveApplicationModel.find({ staff_id: req.params.userId });
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
  
  // Get leave detail by ID
  app.get('/leaveDetail/:leaveId',async (req, res) => {
    try {
      const leave = await LeaveApplicationModel.findById(req.params.leaveId);
      if (!leave) return res.status(404).json({ message: "Leave not found" });
      res.json(leave);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


const storagess = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/staffprofilepicture/'); // Directory where images will be stored
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  // Initialize multer upload with limits (e.g., max file size 2MB)
  const upld = multer({
    storage: storagess,
    limits: { fileSize: 2 * 1024 * 1024 },
  });


  app.post('/staff/upload-photo/:id', upld.single('image'), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Store only the filename
        const imagePath = req.file.filename;

        // Update the user's profile image in the database
        const updatedUser = await StaffModel.findByIdAndUpdate(userId, { image: imagePath }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile image updated', image: imagePath });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        // Handle Multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 2MB limit.' });
        }
      }
        res.status(500).json({ message: 'Error updating profile image', error: error.message });
    }
});


app.get('/today', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Start of the day
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999); // End of the day

        // Fetch attendance records for today
        const attendance = await AttendanceModel.find({ 
            date: { $gte: startOfDay, $lte: endOfDay }, 
            present: true 
        });

        // Extract staff IDs from attendance records
        const staffIds = attendance.map(att => att.staffId);

        // Fetch staff details based on the extracted staff IDs
        const staffDetails = await StaffModel.find({ _id: { $in: staffIds } });

        // Map attendance records to include staff details
        const response = attendance.map(att => {
            const staff = staffDetails.find(s => s._id.toString() === att.staffId); // Find the matching staff
            return {
                _id: staff._id,
                staffName: staff.displayName,
                staffEmail: staff.email,
                staffRole: staff.role,
                staffPhone: staff.phone_no,
                staffImage: staff.image,
                staffAvailability: staff.availability
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
});


app.post('/attendance/mark', async (req, res) => {
    const attendanceData = req.body;
    console.log(attendanceData) // { staffId: true/false }
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of the day for the date comparison
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day for the date comparison

    try {
        // Loop through each staff's attendance status
        for (const [staffId, isPresent] of Object.entries(attendanceData)) {
            await AttendanceModel.findOneAndUpdate(
                { 
                    staffId, 
                    date: { $gte: startOfDay, $lte: endOfDay } // Ensure the query checks for today's date
                },
                { 
                    staffId, 
                    date: new Date(), 
                    present: isPresent  // Update based on the value of isPresent
                },
                { upsert: true, new: true } // Use upsert to create the document if it doesn't exist
            );
        }
        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
});

app.post('/assign', async (req, res) => {
  const assignments = req.body; // Expecting an array of { staffId, task, role }

  try {
      // Fetch all rooms from the database
      const allRooms = await RoomModel.find({});
      const totalRooms = allRooms.length;
      
      if (totalRooms === 0) {
          return res.status(400).json({ message: 'No rooms available for assignment' });
      }

      const totalStaff = assignments.length;
      const roomsPerStaff = Math.floor(totalRooms / totalStaff); // Calculate how many rooms each staff will handle
      const remainingRooms = totalRooms % totalStaff; // Rooms that don't divide evenly among staff

      let roomIndex = 0; // This will track the current room being assigned

      for (let i = 0; i < totalStaff; i++) {
          const { staffId, task, role } = assignments[i];
          let JobModel;

          // Determine the model to use based on the role
          if (role.toLowerCase() === 'housekeeping') {
              JobModel = HousekeepingJobModel;
          } else if (role.toLowerCase() === 'maintenance') {
              JobModel = MaintenanceJobModel;
          } else {
              return res.status(400).json({ message: 'Unknown role type' });
          }

          // Calculate the number of rooms for this staff (roomsPerStaff + 1 for the first `remainingRooms` staff)
          const numRoomsToAssign = roomsPerStaff + (i < remainingRooms ? 1 : 0);

          // Assign the calculated number of rooms to the current staff
          const assignedRooms = allRooms.slice(roomIndex, roomIndex + numRoomsToAssign);
          if (assignedRooms.length === 0) {
              return res.status(400).json({ message: 'No rooms available for assignment' });
          }

          for (const room of assignedRooms) {
              await JobModel.create({
                  staff_id: staffId,
                  room_id: room._id,
                  task_description: task,
                  task_date: new Date(),
                  status: 'assigned', // Set initial status
              });
          }

          // Move the roomIndex forward by the number of rooms just assigned
          roomIndex += numRoomsToAssign;
      }

      res.status(200).json({ message: 'Jobs assigned successfully!' });
  } catch (error) {
      res.status(500).json({ message: 'Error assigning jobs', error: error.message });
  }
});




// Check if jobs are already assigned for today based on role
app.get('/checkJobs/:role', async (req, res) => {
    const { role } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of the day
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day

    try {
        let assignments;

        // Check the appropriate model based on the role
        if (role === 'housekeeping') {
            assignments = await HousekeepingJobModel.find({
                task_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else if (role === 'maintenance') {
            assignments = await MaintenanceJobModel.find({
                task_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // If assignments exist, jobs are assigned
        res.json({ jobsAssigned: assignments.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


app.get('/leave-applications', async (req, res) => {
    try {
        // Step 1: Fetch all leave applications
        const applications = await LeaveApplicationModel.find();

        // Step 2: Fetch staff IDs from the applications
        const staffIds = applications.map(application => application.staff_id);

        // Step 3: Fetch staff details based on the staff IDs
        const staffDetails = await StaffModel.find({ _id: { $in: staffIds } });

        // Create a mapping of staff details for easy access
        const staffMap = {};
        staffDetails.forEach(staff => {
            staffMap[staff._id] = {
                name: staff.displayName,
                email: staff.email,
                role: staff.role,
            };
        });

        // Step 4: Combine leave applications with staff details
        const combinedResults = applications.map(application => ({
            ...application.toObject(),
            ...staffMap[application.staff_id] || {},
        }));

        // Step 5: Send the combined results as a response
        res.json(combinedResults);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

  
  // Accept leave application
  app.post('/leave-applications/accept/:id', async (req, res) => {
    try {
      const application = await LeaveApplicationModel.findByIdAndUpdate(req.params.id, { status: 'Accepted', approvedon: new Date() }, { new: true });
      res.json(application);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Reject leave application
  app.post('/leave-applications/reject/:id', async (req, res) => {
    try {
      const application = await LeaveApplicationModel.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
      res.json(application);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  const getStartAndEndOfDay = (date) => {
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));
    return { start, end };
  };
  
  // Fetch today's attendance for all staff
  app.post('/attendance/today', async (req, res) => {
    const today = new Date();
    const { start, end } = getStartAndEndOfDay(today);
  
    try {
      // Find attendance entries where the date is between start and end of today
      const todaysAttendance = await AttendanceModel.find({
        date: {
          $gte: start,
          $lte: end,
        },
      });
      res.json(todaysAttendance);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  });


  app.delete("/deleteLeave/:leaveId", async (req, res) => {
    const leaveId = req.params.leaveId;
  
    try {
      const deletedLeave = await LeaveApplicationModel.findByIdAndDelete(leaveId);
      if (!deletedLeave) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      res.json({ message: "Leave request deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });


// forgot password field
const transporterr = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.email_id,
      pass: process.env.password,
    },
  });
  
  // 1. Request OTP (Send Email)
  app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const user = await GoogleRegisterModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
    // Save OTP in the user model or in a temporary database with expiration
    user.otp = otp;
    user.otpExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();
  
    // Send OTP via email
    const mailOptions = {
      from: process.env.email_id,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is: ${otp}`,
    };
  
    transporterr.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'OTP sent to email' });
    });
  });
  
  app.post('/staff-send-otp', async (req, res) => {
    const { email } = req.body;
    const user = await StaffModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
    // Save OTP in the user model or in a temporary database with expiration
    user.otp = otp;
    user.otpExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();
  
    // Send OTP via email
    const mailOptions = {
      from: process.env.email_id,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is: ${otp}`,
    };
  
    transporterr.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'OTP sent to email' });
    });
  });
  
  // 2. Verify OTP
  app.post('/verify', async (req, res) => {
    const { email, otp } = req.body;
    console.log(req.body)
    const user = await GoogleRegisterModel.findOne({ email });
    console.log(user)
    console.log(user.otp)
    console.log(user.otpExpires)
    if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  
    // Generate token to allow password reset
    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
    res.status(200).json({ message: 'OTP verified', token });
  });
  

  app.post('/staff-verify', async (req, res) => {
    const { email, otp } = req.body;
    console.log(req.body)
    const user = await StaffModel.findOne({ email });
    console.log(user)
    console.log(user.otp)
    console.log(user.otpExpires)
    if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  
    // Generate token to allow password reset
    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
    res.status(200).json({ message: 'OTP verified', token });
  });
  
  // 3. Reset Password
  app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    console.log(password)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded.email)
      const user = await GoogleRegisterModel.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      else{
      // Hash the new password and save
    //   const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = password;
      await user.save();
  
      res.status(200).json({ message: 'Password reset successful' });
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid token or expired token' });
    }
  });

  app.post('/staff-reset-password', async (req, res) => {
    const { token, password } = req.body;
    console.log(password)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded.email)
      const user = await StaffModel.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      else{
      // Hash the new password and save
    //   const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = password;
      await user.save();
  
      res.status(200).json({ message: 'Password reset successful' });
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid token or expired token' });
    }
  });


// forgot password end

app.get('/profile/:id', async (req, res) => {
    try {
    
      const staff = await GoogleRegisterModel.findById(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
      
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  });

  app.post('/profile/update/:id', async (req, res) => {
    try {
      console.log('Updating profile for ID:', req.params.id);
      const { displayName, email, address, image, phone_no, dob } = req.body;
      console.log('Update data:', { displayName, email, address, image, phone_no, dob });

      const staff = await GoogleRegisterModel.findById(req.params.id);

      if (!staff) {
        console.log('Staff not found');
        return res.status(404).json({ message: "Staff not found" });
      }

      // Update fields only if they are provided in the request
      if (displayName) staff.displayName = displayName;
     
      if (address) staff.address = address;
      if (image) staff.image = image;
      if (phone_no) staff.phone_no = phone_no;
      if (dob) staff.dob = dob;

      console.log('Staff before save:', staff);

      const updatedStaff = await staff.save();

      console.log('Updated staff:', updatedStaff);

      res.json({ message: "Profile updated successfully", staff: updatedStaff });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Error updating profile", error: error.message });
    }
  });


  // routes/staff.js



// Change password route
app.put('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const staff = await GoogleRegisterModel.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if current password matches
    if (currentPassword !== staff.password) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

    // Hash new password and update it
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);
    staff.password = newPassword;

    // Save the updated staff member
    await staff.save();
    res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


app.post('/upload-photo/:id', upld.single('image'), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Store only the filename
        const imagePath = req.file.filename;

        // Update the user's profile image in the database
        const updatedUser = await GoogleRegisterModel.findByIdAndUpdate(userId, { image: imagePath }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile image updated', image: imagePath });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile image', error: error.message });
    }
});
//frontdesk staff
app.get("/reservations/todays-reservations", async (req, res) => {
    try {
      const today = new Date();
      
      // Find reservations for today
      const reservations = await ReservationModel.find({
        check_in: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      });
  
      // Prepare to store enriched reservation details
      const enrichedReservations = [];
  
      for (const reservation of reservations) {
        // Get guest name from GoogleSignModel using user_id
        const guest = await GoogleRegisterModel.findById(reservation.user_id);
        const guestName = guest ? guest.displayName : "Unknown";
        const guestemail=guest? guest.email : "unknown";
        const guestphno=guest? guest.phone_no : "unknown";
        // Get room number from RoomModel using room_id
        const room = await RoomModel.findById(reservation.room_id);
        const roomNumber = room ? room.roomno : "Unknown";
        
        // Add reservation data with guest name and room number
        enrichedReservations.push({
          _id: reservation._id,
          guestName,
          roomNumber,
          guestemail,
          guestphno,
          checkInDate: reservation.check_in,
          checkOutDate: reservation.check_out,
          check_in_time: reservation.check_in_time,
          status: reservation.status,
        });
      }
  
      // Send enriched reservation details
      res.json(enrichedReservations);
  
    } catch (error) {
      console.error("Error fetching today's reservations", error);
      res.status(500).json({ error: "Error fetching today's reservations." });
    }
  });
  
  // Verify reservation
  app.put("/reservations/verify/:id", async (req, res) => {
    try {
      const reservation = await ReservationModel.findById(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
  
      reservation.is_verified = "yes"; // Update status to verified
      await reservation.save();
      res.json({ message: "Reservation verified", reservation });
    } catch (error) {
      res.status(500).json({ error: "Error verifying reservation" });
    }
  });
  
  // Check-in reservation
  app.put("/reservations/checkin/:id", async (req, res) => {
    try {
      const reservation = await ReservationModel.findById(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
  
      if (reservation.is_verified !== "yes") {
        return res.status(400).json({ error: "Reservation must be verified first" });
      }
  
      reservation.check_in_time = new Date(); // Set current time as check-in time
      reservation.status = "checked_in"; // Mark reservation as checked-in
      await reservation.save();
      res.json({ message: "Check-in completed", reservation });
    } catch (error) {
      res.status(500).json({ error: "Error checking in reservation" });
    }
  });

  app.get("/reservations/todays-checkouts", async (req, res) => {
    try {
      const today = new Date();
      const reservations = await ReservationModel.find({
        check_out: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      });
  
      const enrichedReservations = [];
  
      for (const reservation of reservations) {
        const guest = await GoogleRegisterModel.findById(reservation.user_id);
        const room = await RoomModel.findById(reservation.room_id);
  
        enrichedReservations.push({
          _id: reservation._id,
          guestName: guest ? guest.displayName : "Unknown",
          guestEmail: guest ? guest.email : "Unknown",
          guestPhone: guest ? guest.phone_no : "Unknown",
          roomNumber: room ? room.roomno : "Unknown",
          checkOutDate: reservation.check_out,
          status: reservation.status,
          checkoutTime: reservation.check_out_time || null,
        });
      }
  
      res.json(enrichedReservations);
    } catch (error) {
      console.error("Error fetching today's checkouts", error);
      res.status(500).json({ error: "Error fetching today's checkouts." });
    }
  });

//   app.put("/reservations/check-verify/:reservationId", async (req, res) => {
//     try {
//       const reservation = await ReservationModel.findByIdAndUpdate(req.params.reservationId, {
//         is_verified: "yes",
//       });
//       res.json({ message: "Reservation verified successfully" });
//     } catch (error) {
//       res.status(500).json({ error: "Error verifying reservation." });
//     }
//   });

  app.put("/reservations/checkout/:reservationId", async (req, res) => {
    try {
      const reservation = await ReservationModel.findByIdAndUpdate(
        req.params.reservationId,
        {
          status: "checked_out",
          check_out_time: new Date(),
        },
        { new: true }
      );
      res.json({ message: "Checkout completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error during checkout." });
    }
  });

//frontdesk roomreserve

app.get('/staff/rooms/types', async (req, res) => {
  try {
    const roomTypes = await RoomModel.distinct('roomtype');
    console.log(roomTypes)
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room types' });
  }
});


// Get available rooms
app.get('/staff/rooms/available', async (req, res) => {
  const { roomType, checkInDate, checkOutDate, adults, children } = req.query;

  try {
    // Validation: Check if adults or children are within reasonable bounds
    if (adults <= 0 || children < 0) {
      return res.status(400).json({ message: 'Invalid number of adults or children' });
    }

    // Calculate the number of rooms needed based on 2 adults and 2 children per room
    const totalPeople = parseInt(adults) + parseInt(children);
    const roomsNeeded = Math.ceil(totalPeople / 4); // Each room can accommodate up to 4 people

    // Find reserved rooms for the check-in and check-out dates
    const reservedRooms = await ReservationModel.find({
      $or: [
        {
          check_in: { $lt: new Date(checkOutDate) }, 
          check_out: { $gt: new Date(checkInDate) }
        }
      ]
    }).distinct('room_id');

    // Find available rooms excluding reserved rooms
    const availableRooms = await RoomModel.find({
      _id: { $nin: reservedRooms },
      roomtype: roomType // Filter by room type if provided
    });

    // Check if there are enough available rooms
    if (availableRooms.length < roomsNeeded) {
      return res.status(200).json({ 
        message: 'Not enough available rooms', 
        availableRooms, 
        roomsNeeded, 
        roomsAvailable: availableRooms.length 
      });
    }

    // Return available rooms and number of rooms needed
    res.status(200).json({ 
      message: 'Rooms available', 
      availableRooms, 
      roomsNeeded 
    });

  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ message: 'Failed to fetch available rooms' });
  }
});






// Configure Multer storage and file filter
const storeg = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/proofdocs'); // Destination for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  }
});

const filFilt = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG are allowed.'), false); // Reject file
  }
};

// Multer instance
const pload = multer({
  storage: storeg,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: filFilt
});

// Handle room booking and file upload
app.post('/staff/rooms/confirmbook', pload.array('proofDocuments', 10), async (req, res) => {
  try {
    // Parse request body (they come as strings in multipart/form-data)
    const roomDetails = JSON.parse(req.body.roomDetails);
    const datas = JSON.parse(req.body.datas);
    const adultDetails = Array.isArray(req.body.adultDetails) 
        ? req.body.adultDetails.map(detail => JSON.parse(detail)) 
        : [];
    const childrenDetails = Array.isArray(req.body.childrenDetails) 
        ? req.body.childrenDetails.map(detail => JSON.parse(detail)) 
        : [];
    const userid = req.body.userid;
    const totalRate = req.body.totalRate;
    const totldays = req.body.totldays;

    const roomId = roomDetails._id;
    const checkInDate = datas.checkInDate;
    const checkOutDate = datas.checkOutDate;
    const totalAmount = totalRate;
    const userId = userid;

    // Save guest details (adults and children)
    const guestIds = [];

    // Process adults with proof documents
    for (let i = 0; i < adultDetails.length; i++) {
      const adult = adultDetails[i];
      const proofDocument = req.files && req.files[i] ? req.files[i].filename : null;

      const newGuest = new RoomGuestModel({
        name: adult.name,
        email: adult.email,
        phone: adult.phone,
        address: adult.address,
        dob: adult.dob,
        role: 'adult',
        proofType: adult.proofType,
        proofNumber: adult.proofNumber,
        proofDocument: proofDocument, // Store proof document if available
      });

      const savedGuest = await newGuest.save();
      guestIds.push(savedGuest._id);
    }

    // Process children
    for (const child of childrenDetails) {
      const newChildGuest = new RoomGuestModel({
        name: child.name,
        dob: child.dob,
        role: 'child',
      });

      const savedChild = await newChildGuest.save();
      guestIds.push(savedChild._id);
    }

    // Create the reservation
    const newReservation = new ReservationModel({
      user_id: userId,
      room_id: roomId,
      check_in: new Date(checkInDate),
      check_out: new Date(checkOutDate),
      booking_date: new Date(),
      status: 'booked',
      total_amount: totalAmount,
      totaldays: totldays,
      check_in_time: datas.check_in_time ? new Date() : null,
      check_out_time: datas.check_out_time ? new Date() : null,
      guestids: guestIds, // Link guests to this reservation
    });

    const savedReservation = await newReservation.save();

    // Update room availability
    await Room.findByIdAndUpdate(roomId, {
      $push: { bookings: { checkInDate, checkOutDate } },
      isAvailable: false, // Mark the room as unavailable
    });

    res.status(201).json({
      success: true,
      message: 'Room booking confirmed!',
      reservation: savedReservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error booking room',
      error: error.message,
    });
  }
});



const packss= multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, './uploads/proofdocs'); // Define the destination folder for file uploads
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  }
});

// File filter to restrict file types
const Filterrrr = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
  } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'), false); // Reject file
  }
};

// Multer instance (optional, based on file upload requirements)
const updssss = multer({
  storage: packss,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: Filterrrr
});

// updssss.array('proofDocuments', 10); 
app.post('/staff/confirmbook', async (req, res) => {
  try {
      const { roomDetails, adults, children, totalRate, totldays ,checkOutDate,checkInDate} = req.body;

      // Validate and extract room details
      const roomId = roomDetails._id;
      const totalAmount = totalRate;

      // Handle adult and child details
      const guestIds = [];

      // Process adults
      if (Array.isArray(adults) && adults.length > 0) {
          for (const adult of adults) {
              const newGuest = new RoomGuestModel({
                  name: adult.name,
                  dob:adult.dob,
                  role: 'adult',
                  proofType: adult.proofType
              });

              const savedGuest = await newGuest.save();
              guestIds.push(savedGuest._id);
          }
      }

      // Process children
      if (Array.isArray(children) && children.length > 0) {
          for (const child of children) {
              const newChildGuest = new RoomGuestModel({
                  name: child.name,
                  dob: child.dob,
                  role: 'child'
              });

              const savedChild = await newChildGuest.save();
              guestIds.push(savedChild._id);
          }
      }

      // Create the reservation
      const newReservation = new ReservationModel({
          room_id: roomId,
          booking_date: new Date(), // Current date as booking date
          status: 'booked',
          total_amount: totalAmount,
          totaldays: totldays,
          check_in:checkInDate,
          check_out:checkOutDate,
          guestids: guestIds // Link guests to the reservation
      });

      // Save the reservation
      const savedReservation = await newReservation.save();

      return res.status(201).json({
          success: true,
          message: 'Room booking confirmed!',
          reservation: savedReservation
      });
  } catch (error) {
      console.error('Error during booking:', error);
      return res.status(500).json({
          success: false,
          message: 'Error booking room',
          error: error.message
      });
  }
});



app.get("/staff-reservations_details/:id", async (req, res) => {
  try {
    const reservationId = req.params.id;

    // Fetch the reservation based on ID
    const reservation = await ReservationModel.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Fetch room details using room_id from the reservation
    const room = await RoomModel.findById(reservation.room_id);

    // Fetch guest details using the array of guest ids
    const guests = await RoomGuestModel.find({ _id: { $in: reservation.guestids } });

    // Combine all data into a single response object
    const response = {
      reservation,
      room,
      guests,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    res.status(500).json({ message: "Server error" });
  }
});



//staffsidebar
app.get("/staffprof/:id", async (req, res) => {
  try {
    const staff = await StaffModel.findById(req.params.id, "displayName image"); // Select only displayName and image
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    console.log(staff)
    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff data:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//frontdesk staff end

//user section start
app.get("/user-booking/:id", async (req, res) => {
 
  try {
    const reservationId = req.params.id;
    

    // Fetch the reservation based on ID
    const reservation = await ReservationModel.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Fetch room details using room_id from the reservation
    const room = await RoomModel.findById(reservation.room_id);

    // Fetch guest details using the array of guest ids
    const guests = await RoomGuestModel.find({ _id: { $in: reservation.guestids } });
    const bill = await BillModel.findOne({ reservationid: reservationId });
    // Combine all data into a single response object
    const response = {
      reservation,
      room,
      guests,
      bill,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/user-bookings/cancel/:id",async (req, res) => {
  try {
    const bookingId = req.params.id; // Get booking ID directly
 // Get booking ID from request parameters
    console.log(bookingId)
    // Check if booking exists
    const booking = await ReservationModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check the check-in date to see if cancellation is allowed
    const checkInDate = new Date(booking.check_in);
    const currentDate = new Date();
    const daysDiff = (checkInDate - currentDate) / (1000 * 60 * 60 * 24); // Difference in days

    if (daysDiff <= 2) {
      return res.status(400).json({ message: 'No refund is available if cancelled within 2 days of the check-in date.' });
    }

    // Proceed with cancellation
    booking.status = 'Cancelled'; // Update the booking status
    booking.cancel_date = currentDate; // Set the cancel_date to the current date and time
    await booking.save();

    const user = await GoogleRegisterModel.findById(booking.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found for the booking.' });
    }

    // Set up the transporter for nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use any email service
      auth: {
        user: process.env.email_id, // Replace with your email
        pass: process.env.password, // Replace with your email password or an app-specific password
      },
    });

    // Create the email options
    const mailOptions = {
      from: process.env.email_id, // Sender address
      to: user.email, // The email of the user to notify
      subject: 'Booking Cancellation Confirmation',
      text: `Dear ${user.displayName},

Your booking with ID ${bookingId} has been successfully cancelled.

Cancellation Date: ${currentDate.toLocaleDateString()}
Check-in Date: ${checkInDate.toLocaleDateString()}

If you have any questions, feel free to contact our support team.

Thank you,
Your IntelliStay Hotel Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending cancellation email:', error);
        return res.status(500).json({ message: 'Booking cancelled, but error in sending email.' });
      } else {
        console.log('Cancellation email sent: ' + info.response);
        return res.status(200).json({ message: 'Booking has been cancelled successfully, and a notification email has been sent to the user.' });
      }
    });
    // return res.status(200).json({ message: 'Booking has been cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


const stge = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proofdocs');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with a timestamp to avoid conflicts
  },
});

const load = multer({ storage: stge });

// Update guest proof document
app.post("/user-guests-proofupdate/:id",load.single('proofDocument'),async (req, res) => {
    try {
      console.log(req.file)
      const guestId = req.params.id;
      const guest = await RoomGuestModel.findById(guestId);

      if (!guest) {
        return res.status(404).json({ success: false, message: 'Guest not found' });
      }

      // Check if check-in time is already set
      if (ReservationModel.check_in_time) {
        return res.status(400).json({ success: false, message: 'Cannot update document after check-in' });
      }
   console.log(req.file.filename)
      // Update proofDocument field with new file name
      guest.proofDocument = req.file.filename;
      await guest.save();

      res.status(200).json({ success: true, message: 'Document updated successfully' });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
);


const mailtrans = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  auth: {
    user:  process.env.email_id, // Replace with your email
    pass:  process.env.password // Replace with your app password
  }
});

app.post('/orders/create', async (req, res) => {
  const { userid, paymentId, totalRate, totldays ,reservation_id, checkInDate, checkOutDate} = req.body;

  try {
    // Validate the room availability before confirming the order

    // Create new order object
    const newBill = new BillModel({
      userid,
      paymentId, // Assuming roomDetails contains info about each room
      totalRate,
      totldays,
      orderDate: new Date(),
      status: 'Confirmed',
      reservationid: reservation_id
    });

    // Save the order to the database
    await newBill.save();
    const userDetails = await GoogleRegisterModel.findById(userid).select('displayName email'); // Adjust fields as needed

    // Fetch reservation details from Reservation model using reservation_id
    const reservationDetails = await ReservationModel.findById(reservation_id);

    
    // Prepare email content
    const emailContent = `
    Dear ${userDetails.displayName},

    Your booking has been confirmed!

    Booking Details:
    - Check-in: ${new Date(checkInDate).toLocaleDateString()}
    - Check-out: ${new Date(checkOutDate).toLocaleDateString()}
    - Total Amount: $${totalRate}
    - Number of Days: ${totldays}

    Thank you for choosing our service!

    Best regards,
    Your IntelliStay Hotel Team
`;

// Send email
await mailtrans.sendMail({
    from:  process.env.password,
    to: userDetails.email,
    subject: 'Booking Confirmation',
    text: emailContent
});
 console.log("email sent")
 console.log(userDetails)
 console.log(reservationDetails)
    res.status(201).json({ message: 'Payment successfully', bill: newBill , user: userDetails,  // Include user details in the response
      reservation: reservationDetails});
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


app.post('/rooms-details', async (req, res) => {
  try {
    // Fetch distinct available rooms grouped by room type
    const availableRooms = await RoomModel.aggregate([
      {
        $group: {
          _id: "$roomtype", // Group by room_type
          roomDetails: { $first: "$$ROOT" } // Get the first room document for each room_type
        }
      },
      {
        $replaceRoot: { newRoot: "$roomDetails" } // Replace the root document with the room details
      }
    ]);

    console.log("available", availableRooms);

    // Return the distinct available rooms
    res.status(200).json({
      message: 'Distinct rooms available by room type',
      availableRooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).send('Server Error');
  }
});


app.get('/saved-guests/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all guests for this user where saveDetails is true
    const savedGuests = await RoomGuestModel.find({ user_id: userId, saveDetails: true });

    if (savedGuests.length === 0) {
      return res.status(404).json({ message: 'No saved guests found for this user' });
    }

    res.json(savedGuests);
  } catch (error) {
    console.error('Error fetching saved guests:', error);
    res.status(500).json({ message: 'Server error while fetching saved guests' });
  }
});


app.put('/update-guest/:id', async (req, res) => {
  try {
    const guestId = req.params.id;
    const updatedData = req.body;

    // Validate the incoming data
    const { name, email, phone, address, dob, proofType, proofNumber } = updatedData;

    if (!name || !email || !phone || !dob || !proofType || !proofNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Perform any additional validations here if needed

    // Update the guest in the database
    const updatedGuest = await RoomGuestModel.findByIdAndUpdate(
      guestId,
      {
        name,
        email,
        phone,
        address,
        dob,
        proofType,
        proofNumber,
        // Don't update proofDocument here as it's typically handled separately
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedGuest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(updatedGuest);
  } catch (error) {
    console.error('Error updating guest:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating guest' });
  }
});


app.delete('/reservations/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    await ReservationModel.findByIdAndDelete(reservationId);
    res.status(200).json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
});


app.post('/feedback', async (req, res) => {
  try {
    const { reservationId, hotelRating, roomRating, feedback, userId } = req.body;

    const newFeedback = new FeedbackModel({
      reservationId,
      userId,
      hotelRating,
      roomRating,
      feedback,
      submittedDate: new Date()
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});
//user section end

//admin section
app.get('/lastRoomNumber/:roomType', async (req, res) => {
  const { roomType } = req.params;

  try {
      const lastRoom = await RoomModel.findOne({ roomtype: roomType }).sort({ roomno: -1 }).limit(1);
      const lastRoomNumber = lastRoom ? lastRoom.roomno : 0; // Return 0 if no rooms exist of that type
      res.status(200).json({ lastRoomNumber });
  } catch (error) {
      console.error("Error fetching last room number:", error);
      res.status(500).json({ message: 'Server error while fetching last room number' });
  }
});

app.post('/addMultipleRooms', async (req, res) => {
  const rooms = req.body; // Expecting an array of room objects

  try {
      const savedRooms = [];
      const errors = [];

      // Validate and save each room
      for (const room of rooms) {
          // Example validation (you can add more as needed)
          if (!room.roomno || !room.roomtype || !room.status || !room.rate || !room.description) {
              errors.push({ roomno: room.roomno, error: 'Missing required fields' });
              continue; // Skip this room if validation fails
          }

          const newRoom = new RoomModel({
              roomno: room.roomno,
              roomtype: room.roomtype,
              status: room.status,
              rate: room.rate,
              description: room.description,
              images: room.images, // Assuming images is an array of image URLs or paths
          });

          try {
              const savedRoom = await newRoom.save();
              savedRooms.push(savedRoom);
          } catch (error) {
              errors.push({ roomno: room.roomno, error: error.message });
          }
      }

      if (errors.length > 0) {
          return res.status(400).json({ success: false, message: 'Some rooms could not be added', errors });
      }

      res.status(201).json({ success: true, message: 'Rooms added successfully', savedRooms });
  } catch (error) {
      console.error('Error adding multiple rooms:', error);
      res.status(500).json({ success: false, message: 'Failed to add rooms', error: error.message });
  }
});

//admin section end
app.use(express.static(path.join(__dirname, '../Frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist/', 'index.html'));
});

app.listen(3001, () => {
    console.log("Server connected");
});


