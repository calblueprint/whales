#!/usr/bin/env node

const program = require("commander");
const spawn = require("cross-spawn");
const path = require("path");
const rm = require("rimraf");

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

const gitRemote = `https://github.com/${template}.git`;
const cloneProc = spawn("git", [
  "clone", "--depth=1", gitRemote, folder
], {});
cloneProc.stdout.pipe(process.stdout);
cloneProc.stderr.pipe(process.stderr);

cloneProc.on("exit", (code) => {
  if (code === null) return;
  if (code === 0) {
    const gitProcOpts = {
      cwd: path.join(process.cwd(), folder)
    };
    const rmOrigin = spawn.sync("git", ["remote", "rm", "origin"], gitProcOpts);
    const addUpstream = spawn.sync("git", ["remote", "add", "upstream", gitRemote], gitProcOpts);

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
        `"sleep 10s && rails db:create"`
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
