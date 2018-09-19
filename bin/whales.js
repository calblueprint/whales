#!/usr/bin/env node

const program = require("commander");

program
  .version("0.1.0")
  .command("server", "start a Whales server for the project in this directory")
  .command("new", "create a new Whales project in this directory")
  .parse(process.argv);
