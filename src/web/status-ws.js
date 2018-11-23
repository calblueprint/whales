const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const promisifySpawn = require('./promisify-spawn');
const getContainerName = require('./get-container-name');

const wss = new WebSocket.Server({ noServer: true });
let currentInterval = null;

module.exports = {
  handleUpgrade: function (request, socket, head) {
    return wss.handleUpgrade(request, socket, head, (ws) => {
      ws.sendPayload = function(type, status, data) {
        this.send(JSON.stringify({ type, status, data }));
      };
      const catchErrorAndNotify = (err) => {
        // TODO: Should there be a way to distinguish DOWN and ERR states?
        ws.sendPayload(err.name, "DOWN");
        if (err.exitCode) {
          console.log(`==> [err: ${err.exitCode}]`, err);
        }
        return err;
      };

      if (currentInterval !== null) {
        clearInterval(currentInterval);
      }

      currentInterval = setInterval(() => {
        promisifySpawn("docker", ["ps"], {})
          .then((data) => {
            ws.sendPayload("docker", "UP");
          })
          .catch(catchErrorAndNotify);

        getContainerName({ skipCache: true })
          .then((data) => {
            ws.sendPayload("server", "UP");
          })
          .catch(catchErrorAndNotify);
      }, 2000);

      ws.on('message', (data) => {
        if (data === "UP") {
          fs.unlink(path.join(process.cwd(), "tmp/pids/server.pid"), (err) => {
            promisifySpawn("docker-compose", ["up", "web"])
              .catch(console.log);
          });
        }
        if (data === "DOWN") {
          getContainerName().then((name) => {
            console.log("==> [info] Stopping container: ", name);
            return promisifySpawn("docker", ["stop", name]);
          }).then(() => {
            return getContainerName({
              searchPattern: "spring server",
              skipCache: true,
            });
          }).then((name) => {
            console.log("==> [info] Stopping container: ", name);
            return promisifySpawn("docker", ["stop", name]);
          }).catch(console.log);
        }
      });
      ws.on('close', () => {
        clearInterval(currentInterval);
      });
      wss.emit('connection', ws, request);
    });
  }
};
