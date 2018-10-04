#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");
const ngrok = require("@calblueprint/ngrok");

// For now, this is just the Rails server spin-up
const command = process.platform === "win32" ? "docker-compose" : "unbuffer";
const workingDir = path.resolve(".");

const locationArgs = [
  "-f",
  path.join(workingDir, "docker-compose.yml")
];

const PORT = process.env.PORT || 1337;

const args = [
  ...locationArgs,
  "run",
  "-v",
  `${workingDir}:/app`,
  "-p",
  `${PORT}:${PORT}`,
  "web",
  "bundle",
  "exec",
  "rails",
  "server",
  "-p",
  PORT,
  "-b",
  "0.0.0.0",
];

if (command === "unbuffer") {
  args.unshift("docker-compose");
}

console.log(`Running ${command} ${args.join(" ")}`);

const railsProc = spawn(command, args, {});

const runWhales = (ngrokUrl) => {
  let entrypoint;
  if (process.env.BABEL_ENV === "development") {
    require("babel-register")({
      presets: [["env", {
        targets: {
          node: "current"
        }
      }], "react", "stage-0"]
    });
    entrypoint = "../src/entry";
  } else {
    entrypoint = "../dist/entry";
  }

  require(entrypoint)({
    proc: railsProc,
    publicUrl: ngrokUrl || "OFFLINE",
    port: PORT,
    locationArgs
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
  .then(ngrok.connect(PORT))
  .then(runWhales)
  .catch(() => runWhales());

const SIGNALS = [
  'SIGHUP', 'SIGINT', 'SIGQUIT',
  'SIGILL', 'SIGTRAP', 'SIGABRT',
  'SIGBUS', 'SIGFPE', 'SIGUSR1',
  'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];
SIGNALS.forEach((sig) => {
  process.on(sig, function () {
    cleanup(sig).then(() => process.exit(0));
  });
});

// Process cleanup
process.on("exit", () => {
  try {
    process.kill(process.platform === "win32" ? railsProc.pid : -railsProc.pid);
  } catch (e) {
  }
});
