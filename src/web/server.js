const path = require('path');
const next = require('next');
const url = require('url');

// Import WS servers
const consoleServer = require('./console-ws');
const statusServer = require('./status-ws');

module.exports = (locationArgs) => {
  const express = require('express');
  const app = express();
  const nextApp = next({
    dev: process.env.BABEL_ENV === 'development',
    dir: __dirname
  });

  app.use(express.static(path.join(__dirname, 'public')));

  const nextHandler = nextApp.getRequestHandler();
  app.get('*', (req, res) => {
    return nextHandler(req, res);
  });

  const server = require('http').Server(app);
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    let wss;
    switch (pathname) {
      case '/console':
        wss = consoleServer(locationArgs);
        break;
      case '/status':
        wss = statusServer;
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
