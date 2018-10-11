#!/usr/bin/env node

const program = require("commander");
const spawn = require("cross-spawn");
const path = require("path");

let cmd;
program
  .usage("[command]")
  .action((command) => {
     cmd = process.argv.slice(2).join(" ");
  })
  .parse(process.argv);

if (cmd.length === 0) {
  cmd = `echo 'Started a Whales terminal!'`;
}

const proc = spawn(
  "docker-compose",
  ["run", "web", `bash -c "${cmd};bash"`],
  {
    shell: true,
    stdio: [process.stdin, process.stdout, process.stderr]
  }
);

proc.on("exit", () => {
  process.exit(0);
});
