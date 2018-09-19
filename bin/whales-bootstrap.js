#!/usr/bin/env node

const path = require("path");
const spawn = require("cross-spawn");

const workingDir = path.resolve(".");

const command = "docker-compose";
const locationArgs = [
  "-f",
  path.join(workingDir, "docker-compose.yml")
];

const args = [...locationArgs, "build", "web"];

console.log(`Running ${command} ${args.join(" ")}`);
console.log("Bootstrap might take a while the first time it is run. Please be patient.");

const child = spawn(command, args, {});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
