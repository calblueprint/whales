#!/usr/bin/env node

const spawn = require("cross-spawn");
const path = require("path");
const os = require("os");

if (os.type().toLowerCase() === "darwin") {
  console.log("macOS system detected. "
    + "We're going to try to install your dependencies automatically!");
  const majorVer = +os.release().split(".").shift();
  let command;
  if (majorVer < 15) {
    console.log("Looks like your macOS version is <= 10.10. "
      + "You will have to run whales in their provided Docker "
      + "Quickstart Terminal instead of Terminal.app. ");
    console.log("We strongly suggest you upgrade your macOS and "
      + "run `whales setup` to reinstall.");
    command = path.join(__dirname, "../installers/install-macos-1010.sh");
  } else {
    command = path.join(__dirname, "../installers/install-macos.sh");
  }
  const installer = spawn(command, [], {});
  installer.stdout.pipe(process.stdout);
  installer.stderr.pipe(process.stderr);
  installer.on("exit", (code) => {
    if (code === null) return;
    process.exit(code);
  });
} else {
  console.log("We can't automatically install your dependencies. "
    + "Please follow additional setup instructions for your platform at:");
  console.log("https://www.notion.so/calblueprint/Getting-up-"
    + "and-running-with-Whales-b9b8b49c27c64d7095649916108fd085");
  process.exit(0);
}
