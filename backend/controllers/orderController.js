import orderModel from './../models/orderModel.js';
import userModel from './../models/userModel.js';
import notificationModel from './../models/notificationModel.js';
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Placing user order for frontend
const placeOrder = async (req, res) =>{
    try {
        console.log("CREATING ORDER FOR USER:", req.body.userId);
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        })

        await newOrder.save();
    console.log("ORDER CREATED:", newOrder);
        console.log(`Order created: ${newOrder._id}`);
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

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "lkr",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 * 300
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: "lkr",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: 2 * 100 * 80
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            client_reference_id: newOrder._id.toString(),
            metadata: { orderId: newOrder._id.toString() },
            success_url: `${frontendUrl}/verify?session_id={CHECKOUT_SESSION_ID}&orderId=${newOrder._id}`,
            cancel_url: `${frontendUrl}/verify?orderId=${newOrder._id}`
        })

        res.json({ success: true, session_url: session.url })
    } catch (error) {
        console.error("ORDER ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

const verifyOrder = async (req, res) => {
    const { orderId, sessionId } = req.body;

    try {
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId !== req.body.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!sessionId) {
            return res.json({ success: false, message: 'Payment session is missing' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const sessionOrderId = session.client_reference_id || session.metadata?.orderId;
        if (sessionOrderId !== orderId || session.payment_status !== 'paid') {
            return res.json({ success: false, message: 'Payment is not completed' });
        }

        order.payment = true;
        order.status = order.status && order.status !== 'Pending' ? order.status : 'Food Processing';
        await order.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        return res.json({ success: true, message: 'Paid', data: { orderId } })
    } catch (error) {
        console.error("PAYMENT VERIFICATION ERROR:", error);
        return res.status(500).json({ success: false, message: error.message })
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        console.log("USER ORDERS REQUEST:", req.body);
        console.log("USER ID:", req.body.userId);

        if (!req.body.userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        const orders = await orderModel
            .find({ userId: req.body.userId })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: orders || []
        });
    } catch (error) {
        console.error("USER ORDERS BACKEND ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// listing orders for admin panel
const listOrders = async (req,res) =>{
   try {
    const orders = await orderModel.find({});
    console.log(`Admin order list returned ${orders.length} orders`);
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