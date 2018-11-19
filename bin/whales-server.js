#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");
const ngrok = require("ngrok");
const BASE_PATH = process.env.BABEL_ENV === "development" ? "../src" : "../dist";
const startServer = require(`${BASE_PATH}/web/server`);

// For now, this is just the Rails server spin-up

let command = process.platform === "win32" ? "docker-compose" : "unbuffer";
const workingDir = path.resolve(".");
const versionFile = path.join(workingDir, ".whales-version");
let versionStr;

const locationArgs = [
  "-f",
  path.join(workingDir, "docker-compose.yml")
];

const PORT = process.env.PORT || 1337;
const args = [...locationArgs, "up", "web"];

// Whales project version >= 0.1.7
if (fs.existsSync(versionFile)) {
  // For 0.2, only allow versioned projects and
  // offer migration instructions
  versionStr = fs.readFileSync(versionFile).toString();
  console.log("This project is versioned at", versionStr);
  command = "docker-compose";
  if (versionStr !== "0.2.0") {
    args.splice(args.indexOf("web") + 1, 0, "unbuffer");  
  }
}

if (command === "unbuffer") {
  args.unshift("docker-compose");
}

console.log(`Running ${command} ${args.join(" ")}`);

const runWhales = (ngrokUrl) => {
  const railsProc = spawn(command, args, {});
  console.log(`ngrok URL: ${ngrokUrl}`);
  let entrypoint = `${BASE_PATH}/entry`;
  startServer(locationArgs, railsProc);

  // Process cleanup
  process.on("exit", () => {
    try {
      process.kill(process.platform === "win32" ? railsProc.pid : -railsProc.pid);
    } catch (e) {
    }
  });
}

const cleanup = () => {
  const down = spawn("docker-compose", [
    ...locationArgs,
    "down",
  ]);
  return new Promise((resolve, reject) => {
    down.on("close", () => {
      console.log("Successfully cleaned up.");
      fs.unlink(path.join(workingDir, "tmp/pids/server.pid"), (err) => {
        resolve();
      });
    });
  });
};

cleanup()
  .then(() => ngrok.connect(PORT))
  .then(runWhales)
  .catch((e) => {
    console.log("Starting Whales in offline mode...");
    console.log(e);
    runWhales();
  });

const SIGNALS = [
  'SIGHUP', 'SIGINT', 'SIGQUIT',
  'SIGILL', 'SIGTRAP', 'SIGABRT',
  'SIGBUS', 'SIGFPE', 'SIGUSR1',
  'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];
SIGNALS.forEach((sig) => {
  process.on(sig, function () {
    console.log("Whales is exiting gracefully... please be patient.");
    cleanup(sig).then(() => process.exit(0));
  });
});
