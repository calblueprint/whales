const pty = require('node-pty');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });
const IS_WIN = process.platform === "win32";

module.exports = (locationArgs) => {
  return {
    handleUpgrade: function(request, socket, head) {
      return wss.handleUpgrade(request, socket, head, (ws) => {
        let wsPipe = (data) => ws.send(data);

        let projName = process.cwd();
        if (IS_WIN) {
          projName = projName.split("\\").pop();
        } else {
          projName = projName.split("/").pop();
        }

        let termProc = pty.spawn(
          IS_WIN ? "docker-compose.exe" : "docker-compose",
          [
            ...locationArgs,
            "run",
            "-e",
            "PS1=[🐳 "
              + String.raw`\[\033[1;34m\]whales\[\033[0m\]`
              + String.raw`\[\033[0;34m\]@\[\033[0m\]`
              + String.raw`\[\033[1m\]` + projName + String.raw`\[\033[0m\]] `,
            "web",
            "/bin/bash"
          ],
          { name: "xterm", cwd: process.cwd(), env: process.env }
        );
        termProc.on('data', wsPipe);

        ws.on('message', (msg) => termProc.write(msg));
        ws.on('close', () => {
          termProc.kill();
        });
        wss.emit('connection', ws, request);
      });
    }
  };
};