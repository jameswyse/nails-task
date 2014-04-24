var Agenda = require('agenda');
var utils  = require('nails-utils');

exports = module.exports = {};

exports.name = 'task';
exports.type = 'integration';

exports.register = function(app, options, next) {

  // Apply default options
  var defaults = {
    db: {
      address: 'localhost:27017/' + app.name,
      collection: 'tasks'
    },
    processEvery: '30 seconds',
    maxConcurrency: 20,
    defaultConcurrency: 5
  };

  options = utils.defaults(defaults, options || {});

  // Assign a new Agenda instance to app.task
  app.task = new Agenda(options);

  // Log task events
  app.task
    .on('start', function(job) {
      app.log(['info', 'task', 'start'], 'Task Starting: ' + job.attrs.name);
    })
    .on('success', function(job) {
      app.log(['info', 'task', 'complete'], 'Task Complete: ' + job.attrs.name);
    })
    .on('fail', function(err, job) {
      app.log(['error', 'task', 'failed'], 'Task Failed: ' + job.attrs.name);
      if(err) {
        app.log(['error', 'task', 'failed'], err);
      }
    });

  // Start
  app.on('started', function() {
    // Purge any tasks without definitions
    app.task.purge(function(err, num) {

      // Log purge error
      if(err) {
        app.log(['error', 'task', 'purge'], 'Task purged failed', err);
      }

      // Log purge success
      else if(num) {
        app.log(['info', 'task', 'purge'], 'Purged ' + num + ' old tasks.');
      }

      // Start scheduler
      app.task.start();

      app.log(['info', 'task', 'started'], 'Started task scheduler');
    });
  });

  // Stop
  app.on('stopping', function() {
    app.task.stop();
    app.log(['info', 'task', 'stopped'], 'Stopped task scheduler');
  });

  next();
};
