import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import foodRouter from './routes/foodRoute.js'
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import contactRouter from './routes/contactRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import reportRouter from './routes/reportRoute.js';
import path from 'path';
import { fileURLToPath } from 'url';

//app config
const app = express()
const port = process.env.PORT || 4000
const uploadsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');

// middleware
app.use(express.json())

// Configure CORS
const allowedOrigins = [
    'https://food-delivery-website-3-tq77.onrender.com',
    'https://food-delivery-website-kappa-three.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with']
}));

// Pre-flight requests
app.options('*', cors());

//db connection
connectDB();

// Debug environment variables
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);

// api endpoints
app.use("/api/food",foodRouter)
app.use("/uploads",express.static(uploadsDirectory))
app.use('/api/user', userRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/contact', contactRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/report', reportRouter)

app.get("/",(req,res)=>{
        res.send("API working")
})

app.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})

