import express from 'express';
import multer from 'multer';
import path from 'path';
import { submitContact } from '../controllers/contactController.js';

const contactRouter = express.Router();
const allowedTypes = new Map([
    ['.pdf', ['application/pdf']],
    ['.jpg', ['image/jpeg']],
    ['.jpeg', ['image/jpeg']],
    ['.png', ['image/png']],
    ['.doc', ['application/msword']],
    ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']]
]);

const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const mimeTypes = allowedTypes.get(extension);
        if (!mimeTypes || !mimeTypes.includes(file.mimetype)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'attachment'));
        }
        cb(null, true);
    }
});

contactRouter.post('/submit', (req, res, next) => {
    upload.single('attachment')(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File size must be less than 5 MB.' });
        }
        return res.status(400).json({ success: false, message: 'Please upload a valid file.' });
    });
}, submitContact);

export default contactRouter;
