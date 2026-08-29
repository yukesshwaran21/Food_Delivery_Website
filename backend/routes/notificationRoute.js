import express from "express";
import {
    listNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get('/list', listNotifications);
notificationRouter.get('/unread-count', unreadCount);
notificationRouter.post('/:id/read', markAsRead);
notificationRouter.post('/read-all', markAllAsRead);
notificationRouter.delete('/clear-all', clearNotifications);
notificationRouter.delete('/:id', deleteNotification);

export default notificationRouter;
