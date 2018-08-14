var express = require('express');
var webPush = require('web-push');
var bodyParser = require('body-parser');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var app = express();

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
    "environment variables. You can use the following ones:");
  console.log(webPush.generateVAPIDKeys());
  return;
}

webPush.setVapidDetails(
  'https://serviceworke.rs/',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const payloads = {};

app.use(bodyParser.json());

app.use(function maskDemoIndexes(req, res, next) {
  // Adding this redirect to simplify caching a recipe page,
  // essentially so we don't have to cache "/" and "/index.html"
  // So: "recipe/index.html" -> "recipe/" , "index.html?123" -> "?123"
  if (/\/(.*)\/index\.html\??(.*)$/.test(req.url)) {
    return res.redirect(req.url.replace('index.html', ''));
  }
  return next();
});

app.use(function setHomepageCanonical(req, res, next) {
  // Better for canonical URL, "index.html" is ugly
  if(req.url === '/index.html') {
    return res.redirect(301, '/');
  }
  return next();
});

app.use(function forceLiveDomain(req, res, next) {
  // Don't allow user to hit Heroku now that we have a domain
  var host = req.get('Host');

  if (host === 'serviceworker-cookbook.herokuapp.com') {
    return res.redirect(301, 'https://serviceworke.rs');
  }
  return next();
});

app.use(function forceSSL(req, res, next) {
  var host = req.get('Host');
  var localhost = 'localhost';

  if (host.substring(0, localhost.length) !== localhost) {
    // https://developer.mozilla.org/en-US/docs/Web/Security/HTTP_strict_transport_security
    res.header('Strict-Transport-Security', 'max-age=15768000');
    // https://github.com/rangle/force-ssl-heroku/blob/master/force-ssl-heroku.js
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + host + req.url);
    }
  }
  return next();
});

app.use(function corsify(req, res, next) {
  // http://enable-cors.org/server_expressjs.html
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
  next();
});

app.use(function setServiceWorkerHeader(req, res, next) {
  // https://github.com/mozilla/serviceworker-cookbook/issues/201
  var file = req.url.split('/').pop();
  if (file === 'service-worker.js' || file === 'worker.js') {
    res.header('Cache-control', 'public, max-age=0');
  }
  next();
});

// glob.sync('./*/server.js').map(function requireRecipe(file) {
//   var route = '/' + path.basename(path.dirname(file)) + '/';
//   require(file)(app, route);
// });

app.use(express.static('./public'));

app.get('/vapidPublicKey', function(req, res) {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

app.post('/register', function(req, res) {
  res.sendStatus(201);
});

app.post('/sendNotification', function(req, res) {
  const subscription = req.body.subscription;
  const payload = req.body.payload;
  const options = {
    TTL: req.body.ttl
  };

  setTimeout(function() {
    payloads[req.body.subscription.endpoint] = payload;
    webPush.sendNotification(subscription, null, options)
    .then(function() {
      res.sendStatus(201);
    })
    .catch(function(error) {
      res.sendStatus(500);
      console.log(error);
    });
  }, req.body.delay * 1000);
});

app.get('/getPayload', function(req, res) {
  res.send(payloads[req.query.endpoint]);
});

var port = process.env.PORT || 3003;
var ready = new Promise(function willListen(resolve, reject) {
  app.listen(port, function didListen(err) {
    if (err) {
      reject(err);
      return;
    }
    console.log('app.listen on http://localhost:%d', port);
    resolve();
  });
});

exports.ready = ready;
exports.app = app;
