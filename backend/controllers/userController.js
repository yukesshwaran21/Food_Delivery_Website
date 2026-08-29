import userModel from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(400).json({
                success: false,
                message: "Google login is not configured on the server"
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                message: "Google account email is missing"
            });
        }

        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({
                success: false,
                message: "Google token audience is invalid"
            });
        }

        const email = payload.email.toLowerCase().trim();
        const name = payload.name || payload.given_name || "Google User";
        const googleId = payload.sub;

        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                name,
                email,
                password: "",
                googleId,
                authProvider: "google"
            });
        } else {
            const updateNeeded =
                (!user.googleId && googleId) ||
                (!user.name && name) ||
                (!user.authProvider || user.authProvider === "email");

            if (updateNeeded) {
                user.googleId = user.googleId || googleId;
                user.name = user.name || name;
                user.authProvider = user.authProvider || "google";
                await user.save();
            }
        }

        const token = createToken(user._id);

        return res.json({
            success: true,
            token
        });

    } catch (error) {
        console.error("Google Login Error:", error);

        const message = error?.message?.includes("audience")
            ? "Google token audience is invalid"
            : "Google authentication failed";

        return res.status(401).json({
            success: false,
            message
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