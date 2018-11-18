#!/usr/bin/env node

const program = require("commander");

program
  .version("0.2.0")
  .command("server", "start a Whales server for the project in this directory")
    .alias("s")
  .command("new", "create a new Whales project in this directory")
  .command("bootstrap", "rebuild the Docker image used for this project")
  .command("setup", "(macOS only) install tool dependencies - this gets run automatically")
  .command("run", "run a command in your Whales server and get back an interactive terminal")
  .command("check", "run all checks for Whales runtime requirements")
  .parse(process.argv);
