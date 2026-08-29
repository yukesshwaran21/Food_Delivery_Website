import orderModel from './../models/orderModel.js';
import userModel from './../models/userModel.js';
import notificationModel from './../models/notificationModel.js';
import Stripe from "stripe"

const stripe =  new Stripe(process.env.STRIPE_SECRET_KEY)

// Placing user order for frontend
const placeOrder = async (req, res) =>{

    const frontend_url = 'https://food-delivery-website-3-tq77.onrender.com';
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount:req.body.amount,
            address: req.body.address
        })

        await newOrder.save();
        const customerName = `${req.body.address?.firstName || ''} ${req.body.address?.lastName || ''}`.trim() || 'Guest';
        await notificationModel.updateOne(
            { type: 'new-order', orderId: newOrder._id },
            {
                $setOnInsert: {
                    type: 'new-order',
                    title: 'New Order Received',
                    message: `A new order has been placed by ${customerName}.`,
                    orderId: newOrder._id,
                    customerName,
                    amount: newOrder.amount,
                    isRead: false
                }
            },
            { upsert: true }
        );
        await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}});

        const line_items = req.body.items.map((item)=>({
            price_data :{
                currency: "lkr",
                product_data:{
                    name: item.name
                },
                unit_amount:item.price*100*300
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data :{
                currency:"lkr",
                product_data:{
                    name:"Delivery Charges"
                },
                unit_amount:2*100*80
            },
            quantity:1
        })

        const session = await stripe.checkout.sessions.create({
            line_items:line_items,
            mode:'payment',
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        })

        res.json({success:true, session_url:session.url})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

const verifyOrder = async (req, res) =>{
    const {orderId, success} = req.body;
    try {
        if(success=='true'){
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true, message:"Paid"})
        }else{
            await notificationModel.findOneAndDelete({ orderId });
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false, message:"Not Paid"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId})
        res.json({success:true, data:orders})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

// listing orders for admin panel
const listOrders = async (req,res) =>{
   try {
    const orders = await orderModel.find({});
    res.json({success:true, data:orders})
   } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})  
   } 
}

// api for updating order status
const updateStatus = async (req, res) =>{
    try {
        const order = await orderModel.findById(req.body.orderId);
        
        if (!order) {
            return res.json({success:false, message:"Order not found"});
        }
        
        // Only update tracking history if status is different
        if (order.status !== req.body.status) {
            // Add new entry to tracking history
            order.trackingHistory.push({
                status: req.body.status,
                timestamp: new Date()
            });
            
            // Update the main status
            order.status = req.body.status;
            
            await order.save();
        }
        
        res.json({success:true, message:"Status Updated", data: order})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})  
    }
}

export {placeOrder, verifyOrder, userOrders,listOrders, updateStatus}