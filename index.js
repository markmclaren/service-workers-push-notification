navigator.serviceWorker.register('service-worker.js');

Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      setTimeout(function() {
        registration.showNotification('Notification with ServiceWorker');
      }, 1 * 60 * 1000); // 1 minute in milliseconds
    });
  }
});