const promisifySpawn = require('./promisify-spawn');
let containerName;

module.exports = function getContainerName (opts = {}) {
  let { skipCache, searchPattern } = opts;
  if (!opts.searchPattern) {
    searchPattern = "0.0.0.0"
  }
  return new Promise((resolve, reject) => {
    if (containerName && !skipCache) return resolve(containerName);
    return promisifySpawn("docker", ["ps"], {})
      .then((response) => {
        response.name = "server";
        // TODO: Is there a better way to check for the web process?
        if (response.exitCode !== 0 || !response.data) return reject(response);
        let serverContainer = response.data
          .split("\n")
          .filter(line => line.indexOf(searchPattern) > -1);
        if (serverContainer.length === 0) {
          reject(response);
        } else {
          containerName = serverContainer.shift().split(" ").pop();
          resolve(containerName);
        }
      })
  }); 
}
