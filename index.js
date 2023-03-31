navigator.serviceWorker.register('service-worker.js');

notificationOptions = {
  icon: "./alarm.gif",
  requireInteraction: true,
  vibrate: [200, 100, 200, 100, 200, 100, 200],
}

Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      setTimeout(function() {
        registration.showNotification('Notification with ServiceWorker', notificationOptions);
      }, 1 * 60 * 1000); // 1 minute in milliseconds
    });
  }
});