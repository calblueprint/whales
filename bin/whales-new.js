#!/usr/bin/env node

const program = require("commander");
const spawn = require("cross-spawn");
const path = require("path");

let folder, template;

program
  .usage("<foldername> [username/gitrepo]")
  .arguments("<foldername> [username/gitrepo]")
  .action((folderName, templateName) => {
     folder = folderName;
     template = templateName;
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
cloneProc.stderr.pipe(process.stderr);

cloneProc.on("exit", (code) => {
  if (code === null) return;
  if (code === 0) {
    const buildImageProc = spawn("docker-compose", [
      "-f", `${folder}/docker-compose.yml`, "build", "web", "db", "spring"
    ], {});

    buildImageProc.stdout.pipe(process.stdout);
    buildImageProc.stderr.pipe(process.stderr);
    buildImageProc.on("exit", (code) => {
      if (code === null) return;

      const dbCreateProc = spawn("docker-compose", [
        "-f",
        `${folder}/docker-compose.yml`,
        "run",
        "web",
        "/bin/bash",
        "-c",
        `"sleep 5s && rails db:create"`
      ], { shell: true });
      dbCreateProc.stdout.pipe(process.stdout);
      dbCreateProc.stderr.pipe(process.stderr);
      dbCreateProc.on("exit", (code) => {
        if (code === null) return;
        console.log(`Created new Whales project from ${template} in ${folder}.`);
        console.log(`=> Run \`cd ${folder}\` to start your project with \`whales server\`.`);
        process.exit(0);
      });
    });
  } else {
    console.error(
      "There was an error creating this Whales project. See command output above."
    );
    process.exit(1);
  }
});
