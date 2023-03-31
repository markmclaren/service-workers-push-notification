navigator.serviceWorker.register('service-worker.js');

const notificationOptions = {
  icon: "./alarm.gif",
  requireInteraction: true,
  vibrate: [200, 100, 200, 100, 200, 100, 200]
}

Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      setTimeout(function() {
        registration.showNotification('Notification with ServiceWorker', notificationOptions);
      }, 30 * 1000); // 30 seconds in milliseconds
    });
  }
});