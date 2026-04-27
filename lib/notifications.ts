/**
 * Request permission for system notifications
 */
export async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("This browser does not support system notifications.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        try {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return false;
        }
    }

    return false;
}

/**
 * Show a system notification
 */
export function showSystemNotification(title: string, options?: NotificationOptions) {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
        // Use a default icon if none provided
        const notificationOptions: NotificationOptions = {
            icon: "/hospital-logo.png",
            badge: "/icon-light-32x32.png",
            ...options
        };

        try {
            return new Notification(title, notificationOptions);
        } catch (error) {
            console.error("Error showing system notification:", error);
        }
    }
}
