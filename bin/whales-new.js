#!/usr/bin/env node

const program = require("commander");
const spawn = require("cross-spawn");

let folder, template;

program
  .usage("<foldername> [template]")
  .arguments("<foldername> [template]")
  .action((folderName, template) => {
     folder = folderName;
     template = template;
  })
  .parse(process.argv);

if (!folder) {
  console.error("Destination folder name is required");
  process.exit(1);
}

if (!template) {
  template = "calblueprint/whales-docker";
}

const cloneProc = spawn("git", [
  "clone", `https://github.com/${template}.git`, folder
], {});
cloneProc.stdout.pipe(process.stdout);

cloneProc.on("close", (code) => {
  if (code === 0) {
    console.log(`Created new Whales project from ${template} in ${folder}.`);
    console.log(`=> Run \`cd ${folder}\` to start your project with \`whales server\`.`);
    process.exit(0);
  } else {
    console.error(
      "There was an error creating this Whales project. See command output above."
    );
    process.exit(1);
  }
});
