import mongoose from 'mongoose';
import { contactConnection } from '../config/contactDb.js';

const contactSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    attachment: { type: String, default: '' }
}, { timestamps: true });

const contactModel = contactConnection.models.contact || contactConnection.model('contact', contactSchema);

export default contactModel;
