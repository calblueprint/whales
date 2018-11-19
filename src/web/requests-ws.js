const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

module.exports = (eventEmitter) => {
  return {
    handleUpgrade: function (request, socket, head) {
      return wss.handleUpgrade(request, socket, head, (ws) => {
        const wsPipe = (data) => ws.send(JSON.stringify(data));
        eventEmitter.on('requested', wsPipe);
        ws.on('close', () => {
          eventEmitter.removeListener('requested', wsPipe);
        });
        wss.emit('connection', ws, request);
      });
    }
  };
};
