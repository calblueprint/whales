const WebSocket = require('ws');
const pty = require('node-pty');
const wss = new WebSocket.Server({ noServer: true });
const spawn = require('cross-spawn');

module.exports = {
  handleUpgrade: function (request, socket, head) {
    return wss.handleUpgrade(request, socket, head, (ws) => {
      let logs = pty.spawn(
        process.platform === "win32" ? "docker-compose.exe" : "docker-compose",
        ['logs', '--tail=all', '-f'],
        { name: "xterm", cwd: process.env.PWD, env: process.env }
      );
      logs.on('data', (chunk) => ws.send(chunk));
      ws.on('close', () => {
        logs.kill();
      });
      wss.emit('connection', ws, request);
    });
  }
};
