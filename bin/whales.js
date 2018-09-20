#!/usr/bin/env node

const program = require("commander");

program
  .version("0.1.0")
  .command("server", "start a Whales server for the project in this directory")
  .command("new", "create a new Whales project in this directory")
  .command("bootstrap", "rebuild the Docker image used for this project")
  .command("setup", "(macOS only) install tool dependencies - this gets run automatically")
  .parse(process.argv);
