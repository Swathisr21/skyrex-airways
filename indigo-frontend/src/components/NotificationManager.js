import React, { useState, useEffect, useCallback, useRef } from 'react';

const NotificationManager = {
  permission: false,

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    const permission = await Notification.requestPermission();
    this.permission = permission === 'granted';
    return this.permission;
  },

  send(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      requireInteraction: false,
      ...options
    };

    try {
      return new Notification(title, defaultOptions);
    } catch (e) {
      console.error('Notification error:', e);
    }
  },

  bookingSuccess(bookingDetails) {
    this.send('✅ Booking Confirmed!', {
      body: `Your flight ${bookingDetails.flightNumber || ''} has been booked successfully. PNR: IND${bookingDetails.id?.toString().padStart(8, '0') || '00000000'}`,
      tag: 'booking-success',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Booking' },
        { action: 'close', title: 'Close' }
      ]
    });
  },

  flightDelayed(flightDetails) {
    this.send('⚠️ Flight Delayed', {
      body: `Flight ${flightDetails.flightNumber} from ${flightDetails.source} to ${flightDetails.destination} is delayed. New departure: ${flightDetails.newDepartureTime}`,
      tag: 'flight-delayed',
      requireInteraction: true,
      badge: '/logo.png'
    });
  },

  boardingReminder(bookingDetails) {
    this.send('🛫 Boarding Soon!', {
      body: `Flight ${bookingDetails.flightNumber} boarding starts in 1 hour. Gate: ${bookingDetails.gate || 'TBA'}`,
      tag: 'boarding-reminder',
      requireInteraction: true,
      badge: '/logo.png'
    });
  },

  checkInReminder(bookingDetails) {
    this.send('🎫 Check-in Open', {
      body: `Online check-in is now open for flight ${bookingDetails.flightNumber}. Don't forget to select your seat!`,
      tag: 'checkin-reminder',
      badge: '/logo.png'
    });
  },

  flightStatusUpdate(flightDetails) {
    this.send('✈️ Flight Status Update', {
      body: `Flight ${flightDetails.flightNumber} status: ${flightDetails.status}. ${flightDetails.message || ''}`,
      tag: 'status-update',
      badge: '/logo.png'
    });
  }
};

// React hook for notifications
export function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission === 'granted');
  const [notificationHistory, setNotificationHistory] = useState([]);

  const requestPermission = useCallback(async () => {
    const granted = await NotificationManager.requestPermission();
    setPermission(granted);
    return granted;
  }, []);

  const sendNotification = useCallback((title, options = {}) => {
    const notif = NotificationManager.send(title, options);
    if (notif) {
      setNotificationHistory(prev => [...prev, { title, ...options, timestamp: new Date() }]);
    }
    return notif;
  }, []);

  const notifyBookingSuccess = useCallback((details) => {
    NotificationManager.bookingSuccess(details);
    setNotificationHistory(prev => [...prev, {
      title: 'Booking Confirmed',
      body: details.flightNumber,
      timestamp: new Date()
    }]);
  }, []);

  const notifyFlightDelayed = useCallback((details) => {
    NotificationManager.flightDelayed(details);
  }, []);

  const notifyBoardingReminder = useCallback((details) => {
    NotificationManager.boardingReminder(details);
  }, []);

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyBookingSuccess,
    notifyFlightDelayed,
    notifyBoardingReminder,
    notificationHistory
  };
}

// Notification Toast Component
function NotificationToast({ notifications, onDismiss }) {
  return (
    <div className="notification-toast-container">
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification-toast ${notif.type}`}>
          <div className="toast-icon">{notif.icon}</div>
          <div className="toast-content">
            <div className="toast-title">{notif.title}</div>
            <div className="toast-message">{notif.message}</div>
          </div>
          <button className="toast-dismiss" onClick={() => onDismiss(notif.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// Global notification provider component
function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    // Request permission on mount
    if (Notification.permission === 'default') {
      NotificationManager.requestPermission();
    }
  }, []);

  const addToast = useCallback((title, message, type = 'info', icon = 'ℹ️') => {
    const id = ++toastId.current;
    const toast = { id, title, message, type, icon };
    setToasts(prev => [...prev, toast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Make addToast available globally
  useEffect(() => {
    window.showIndigoToast = addToast;
    window.IndigoNotifications = NotificationManager;
  }, [addToast]);

  return (
    <>
      {children}
      <NotificationToast notifications={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default NotificationProvider;
export { NotificationManager };
