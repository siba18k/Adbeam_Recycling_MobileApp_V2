import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';

const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    refreshNotifications: async () => {},
    markAsRead: async (id) => {}
});

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const result = await getUserNotifications(user.uid, 100);
            if (result.success) {
                setNotifications(result.data);
                setUnreadCount(result.data.filter(n => !n.read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshNotifications();
    }, [user]);

    const markAsRead = async (notificationId) => {
        if (!user) return;
        try {
            await markNotificationAsRead(user.uid, notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                refreshNotifications,
                markAsRead,
                loading
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
