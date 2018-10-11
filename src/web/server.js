const path = require('path');
const pty = require('node-pty');

module.exports = (locationArgs) => {
  const express = require('express');
  const app = express();
  const server = require('http').Server(app);

  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ noServer: true });

  console.log("Now listening on port 7331...");
  server.listen(7331);
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      let wsPipe = (data) => ws.send(data);
      let termProc = pty.spawn(
        "docker-compose",
        [...locationArgs, "run", "web", "/bin/bash"],
        { name: "xterm", cwd: process.env.PWD, env: process.env }
      );
      termProc.on('data', wsPipe);

      ws.on('message', (msg) => termProc.write(msg));
      ws.on('close', () => {
        termProc.kill();
      });
      wss.emit('connection', ws, request);
    });
  });

  app.use(express.static(path.join(__dirname, 'public')));
};
