import mongoose from "mongoose";

export const connectDB = async () =>{
    const mongoUri = process.env.CONTACT_MONGODB_URI;
    if (!mongoUri) {
       throw new Error('CONTACT_MONGODB_URI is not configured.');
    }
    await mongoose.connect(mongoUri).then(()=>{
       console.log('DB connected') ;
    })
}