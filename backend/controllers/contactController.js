import fs from 'fs';
import contactModel from '../models/contactModel.js';
import { contactConnection } from '../config/contactDb.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s().-]{7,}$/;

const submitContact = async (req, res) => {
    const { fullName, email, phone, subject, message } = req.body;
    const values = [fullName, email, phone, subject, message];

    if (values.some((value) => typeof value !== 'string' || !value.trim())) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: 'All contact fields are required.' });
    }

    if (!emailPattern.test(email.trim()) || !phonePattern.test(phone.trim())) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: 'Please provide valid contact details.' });
    }

    try {
        if (contactConnection.readyState !== 1) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(503).json({ success: false, message: 'Contact service is temporarily unavailable.' });
        }

        const contact = new contactModel({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            subject: subject.trim(),
            message: message.trim(),
            attachment: req.file ? `/uploads/${req.file.filename}` : ''
        });

        await contact.save();
        res.status(201).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {});
        console.log(error);
        res.status(500).json({ success: false, message: 'Unable to save message.' });
    }
};

export { submitContact };
