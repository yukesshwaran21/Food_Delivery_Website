import userModel from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    try {

        const { credential } = req.body;

        if (!credential) {
            return res.json({
                success: false,
                message: "Google credential is required"
            });
        }

        // Verify Google token received from frontend
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Get Google user details
        const payload = ticket.getPayload();

        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;


        // Check if user already exists
        let user = await userModel.findOne({ email });


        // If user does not exist, create a new user
        if (!user) {

            user = await userModel.create({
                name,
                email,
                password: "",
                googleId
            });
        }


        // Create your application's JWT
        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET
        );


        res.json({
            success: true,
            token
        });

    } catch (error) {

        console.error("Google Login Error:", error);

        res.json({
            success: false,
            message: "Google authentication failed"
        });
    }
};

//login user
const loginUser = async (req,res) =>{
    const {email, password} = req.body;
    try {
        const user = await userModel.findOne({email});

        if(!user){
           return res.json({success:false, message:'User does not exist'}) 
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.json({success:false, message:'Invalid credentials'})
        }

        const token = createToken(user._id);
        res.json({success:true, token})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

const createToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET)
}

//register user
const registerUser = async (req, res) =>{
    const {name,password,email} = req.body;
    try {

        // checking is user already exists
        const exists = await userModel.findOne({email});
        if(exists){
            return res.json({success:false, message:'User already exists'})
        }

        //validating email format and strong password
        if(!validator.isEmail(email)){
            return res.json({success:false, message:'Please enter a valid email'})
        }

        if(password.length<8){
            return res.json({success:false, message:'Please enter a strong password'})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword
        })

      const user =  await newUser.save()
      const token = createToken(user._id)
      res.json({success:true, token})

    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message || 'Error'});
    }
}

export {loginUser, registerUser, googleLogin}