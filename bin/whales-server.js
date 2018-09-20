#!/usr/bin/env node

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
