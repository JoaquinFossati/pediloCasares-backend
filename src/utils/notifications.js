const { Expo } = require('expo-server-sdk');

const expo = new Expo();

async function sendPush(tokens, title, body, data = {}) {
  const valid = (Array.isArray(tokens) ? tokens : [tokens])
    .filter(t => t && Expo.isExpoPushToken(t));
  if (!valid.length) return;

  const messages = valid.map(to => ({ to, sound: 'default', title, body, data }));
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Push error:', err.message);
    }
  }
}

module.exports = { sendPush };
