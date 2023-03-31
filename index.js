navigator.serviceWorker.register('service-worker.js');
Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('Notification with ServiceWorker');
    });
  }
});