#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");
const ngrok = require("@calblueprint/ngrok");

// For now, this is just the Rails server spin-up

let command = process.platform === "win32" ? "docker-compose" : "unbuffer";
const workingDir = path.resolve(".");
const projVersion = path.join(workingDir, ".whales-version");

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

// Whales project version >= 0.1.7
if (fs.existsSync(projVersion)) {
  // For 0.2, only allow versioned projects and
  // offer migration instructions
  command = "docker-compose";
  args.splice(args.indexOf("web") + 1, 0, "unbuffer");
}

if (command === "unbuffer") {
  args.unshift("docker-compose");
}

console.log(`Running ${command} ${args.join(" ")}`);

const railsProc = spawn(command, args, {});

const runWhales = (ngrokUrl) => {
  console.log(`ngrok URL: ${ngrokUrl}`);
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
