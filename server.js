'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// MongoDB Connection
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Security Features
app.use(helmet({
  frameguard: { action: 'sameorigin' }, // Only allow loading in an iframe on the same origin
  dnsPrefetchControl: { allow: false }, // Prevent DNS prefetching
  referrerPolicy: { policy: 'same-origin' } // Only send referrer for same-origin
}));

app.use(cors({ origin: '*' })); // For FCC testing purposes only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static file serving
app.use('/public', express.static(process.cwd() + '/public'));

// Sample front-end routes
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// FCC testing routes
fccTestingRoutes(app);

// API routes
apiRoutes(app);

// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Start server and run tests
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
