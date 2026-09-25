const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  organization,
  type,
  title,
  message,
  bug = null,
}) => {
  if (!recipient || !organization || !type || !title || !message) {
    return null;
  }

  try {
    const notification = await Notification.create({
      recipient,
      organization,
      type,
      title,
      message,
      bug,
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

const createNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const validNotifications = notifications.filter(
    (notification) =>
      notification?.recipient &&
      notification?.organization &&
      notification?.type &&
      notification?.title &&
      notification?.message
  );

  if (validNotifications.length === 0) {
    return [];
  }

  try {
    const createdNotifications = await Notification.insertMany(
      validNotifications
    );

    return createdNotifications;
  } catch (error) {
    console.error("Create notifications error:", error);
    return [];
  }
};

module.exports = {
  createNotification,
  createNotifications,
};
