const WebSocket = require('ws');
const pty = require('node-pty');
const wss = new WebSocket.Server({ noServer: true });
const spawn = require('cross-spawn');
const IS_WIN = process.platform === "win32";

module.exports = {
  handleUpgrade: function (request, socket, head) {
    return wss.handleUpgrade(request, socket, head, (ws) => {
      let cmd = "docker-compose";
      let cmdOpts = ["logs", "--tail=all", "-f"];
      if (IS_WIN) {
        cmd = "powershell.exe";
        cmdOpts.unshift("docker-compose");
      }
      let logs = pty.spawn(cmd, cmdOpts, {
        name: "xterm",
        cwd: process.cwd(),
        env: process.env
      });
      logs.on('data', (chunk) => ws.send(chunk));
      ws.on('close', () => {
        logs.kill();
      });
      wss.emit('connection', ws, request);
    });
  }
};
