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

// For now, this is just the Rails server spin-up
const command = "docker-compose";
const workingDir = path.resolve("../onboarding-docker");
const args = [
  "-f",
  path.join(workingDir, "docker-compose.yml"),
  "run",
  "-v",
  `${workingDir}:/app`,
  "-p",
  "1337:1337",
  "web",
  "bundle",
  "exec",
  "rails",
  "server",
  "-p",
  "1337",
  "-b",
  "0.0.0.0",
];

const child = spawn(command, args, {
  detached: true
});

// child.stdout.on("data", (data) => console.log(`=> ${data}`));
// child.stderr.on("data", (data) => console.log(`=> ! ${data}`));

require("./main")({
  proc: child,
  dir: workingDir
});

// Process cleanup
process.on("exit", () => {
  try {
    process.kill(process.platform === "win32" ? child.pid : -child.pid);
  } catch (e) {
    console.log("Could not kill Rails process. Did it already exit?");
  }
});
