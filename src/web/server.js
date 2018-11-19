const IS_DEV = process.env.BABEL_ENV === 'development';

const path = require('path');
const next = require('next');
const url = require('url');
const LogListener = require("../utils/LogListener");
const events = require("events");

// Import WS servers
const consoleServer = require('./console-ws');
const statusServer = require('./status-ws');
const logsServer = require('./logs-ws');
const requestsServer = require('./requests-ws');

module.exports = (locationArgs, railsProc) => {
  const express = require('express');
  const app = express();
  const nextApp = next({
    dev: IS_DEV,
    dir: __dirname
  });

  app.use(express.static(path.join(__dirname, 'public')));

  const nextHandler = nextApp.getRequestHandler();
  app.get('*', (req, res) => {
    return nextHandler(req, res);
  });

  // Setup log listener + parser for requests view
  const eventEmitter = new events.EventEmitter();
  const listener = new LogListener(eventEmitter);
  railsProc.stdout.on("data", listener.stdout);
  railsProc.stderr.on("data", listener.stderr);
  eventEmitter.on("started", () => {
    railsProc.stdout.unpipe();
    railsProc.stderr.unpipe();
    railsProc.stdout.on("data", listener.stdout);
    railsProc.stderr.on("data", listener.stderr);
    railsProc.stdout.resume();
    railsProc.stderr.resume();
  });
  eventEmitter.on("error", console.log);

  const server = require('http').Server(app);
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    let wss;
    switch (pathname) {
      case '/console':
        wss = consoleServer(locationArgs);
        break;
      case '/requests':
        wss = requestsServer(eventEmitter);
        break;
      case '/status':
        wss = statusServer;
        break;
      case '/logs':
        wss = logsServer;
        break;
      default:
        wss = {
          handleUpgrade: () => console.log("Invalid request sent to WebSockets server.")
        };
    }

    wss.handleUpgrade(request, socket, head);
  });

  nextApp.prepare().then(() => {
    console.log("Now listening on port 7331...");
    server.listen(7331);
  });
};
