import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ type: 1, orderId: 1 }, { unique: true });

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default notificationModel;
