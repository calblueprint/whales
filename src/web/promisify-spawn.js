const spawn = require('cross-spawn');
module.exports = function promisifySpawn(command, ...opts) {
  const spawnStream = spawn(command, ...opts);
  return new Promise((resolve, reject) => {
    const chunks = [];
    spawnStream.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });
    spawnStream.stderr.on('data', (chunk) => {
      chunks.push(chunk);
    });

    spawnStream.on('exit', (code) => {
      if (code === null) return;
      const finishInfo = {
        name: command,
        data: Buffer.concat(chunks).toString(),
        exitCode: code
      };

      if (code === 0) {
        resolve(finishInfo);
      } else {
        reject(finishInfo);
      }
    });
  });
};
