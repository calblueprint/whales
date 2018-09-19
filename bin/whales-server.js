#!/usr/bin/env node

require("babel-register")({
  presets: [["env", {
    targets: {
      node: "current"
    }
  }], "react", "stage-0"]
});

const path = require("path");
const spawn = require("cross-spawn");
const ngrok = require("ngrok");

// For now, this is just the Rails server spin-up
const command = process.platform === "win32" ? "unbuffer" : "docker-compose";
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

const railsProc = spawn(command, args, {
});
railsProc.stderr.on("data", (data) => console.log(`err: ${data}`));

const runWhales = (ngrokUrl) => {
  require("../entry")({
    proc: railsProc,
    publicUrl: ngrokUrl || "OFFLINE",
    locationArgs
  });
}

const ngrokProc = ngrok.connect(PORT)
  .then(runWhales)
  .catch(() => runWhales());

// Process cleanup
process.on("exit", () => {
  try {
    process.kill(process.platform === "win32" ? railsProc.pid : -railsProc.pid);
  } catch (e) {
  }
});
