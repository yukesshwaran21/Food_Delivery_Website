import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { connectContactDB } from './config/contactDb.js'
import foodRouter from './routes/foodRoute.js'
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import contactRouter from './routes/contactRoute.js';

//app config
const app = express()
const port = process.env.PORT || 4000

// middleware
app.use(express.json())

// Configure CORS
app.use(cors({
    origin: ['https://food-delivery-website-kappa-three.vercel.app', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with']
}));

// Pre-flight requests
app.options('*', cors());

//db connection
connectDB();
connectContactDB().catch(() => process.exit(1));

// Debug environment variables
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);

// api endpoints
app.use("/api/food",foodRouter)
app.use("/uploads",express.static('uploads'))
app.use('/api/user', userRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/contact', contactRouter)

app.get("/",(req,res)=>{
        res.send("API working")
})

app.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})

