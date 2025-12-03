const User=require('../models/User')
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Register User
exports.registerUser = async (req, res) => {
    // Log incoming body for debugging when clients send malformed requests
    console.log('RegisterUser payload:', req.body);
    const { fullName, email, password, profileImageUrl } = req.body || {};

    // Give more specific field-level errors to help frontend debugging
    if (!fullName || !email || !password) {
        const missing = [];
        if (!fullName) missing.push('fullName');
        if (!email) missing.push('email');
        if (!password) missing.push('password');
        return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    try{
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message : "Email already in use"});
        }
        const user = await User.create({
            fullName,email,password,profileImageUrl});
         
            res.status(201).json({
                id:user._id,
                user,
                token:generateToken(user._id),
            });
        }catch(err){
            res.status(500)
            .json({message:"error registering user",error:err.message})
        }
    
    }


// Login User
exports.loginUser = async (req, res) => {
    const{email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({message:"All fields are required"});

    }
    try{
        const user= await User.findOne({email});
        if(!user || !(await user.comparePassword(password))){
            return res.status(400).json({ message :"Inavlid crdentials"});
        }
        res.status(200).json({
            id:user._id,
            user,
            token:generateToken(user._id),
        });
    
    }catch(err){
        res.status(500).json({message:"Error registering user", error:err.message});
    }
};

// Get User Info
exports.getUserInfo = async (req, res) => {
    try{
        const user= await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.status(200).json(user);

    }catch(err){
        console.error('Error registering user:', err);
         res.status(500)
            .json({message:"error registering user",error:err.message})
 
    }
};