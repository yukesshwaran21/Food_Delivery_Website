import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, default: ""},
    cartData:{type:Object, default:{}},
    googleId: { type: String, default: ""},
    authProvider: {
        type: String,
        enum: ["email", "google"],
        default: "email"
    }
},{
    minimize:false,
    timestamps: true
})

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;