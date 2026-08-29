import notificationModel from '../models/notificationModel.js';

const listNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const unreadCount = async (req, res) => {
    try {
        const count = await notificationModel.countDocuments({ isRead: false });
        res.json({ success: true, count });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await notificationModel.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.json({ success: false, message: "Notification not found" });
        res.json({ success: true, data: notification });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await notificationModel.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const notification = await notificationModel.findByIdAndDelete(req.params.id);
        if (!notification) return res.json({ success: false, message: "Notification not found" });
        res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const clearNotifications = async (req, res) => {
    try {
        await notificationModel.deleteMany({});
        res.json({ success: true, message: "Notifications cleared" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { listNotifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearNotifications };
