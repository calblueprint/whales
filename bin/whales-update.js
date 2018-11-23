#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const IS_DEV = process.env.BABEL_ENV === "development";
const BASE_PATH = IS_DEV ? "../src" : "../dist";

const spawn = require(`${BASE_PATH}/web/promisify-spawn`);
const crossSpawn = require("cross-spawn");
const checkIfWhalesProj = require(`${BASE_PATH}/checkForDocker`).checkIfWhalesProj;
console.log("Making sure we're in a Whales project...");
checkIfWhalesProj();

const workingDir = path.resolve(".");
const versionFile = path.join(workingDir, ".whales-version");
let versionStr;
let latestVersion;
let needsRemoteUpdate;

const updateRemote = () => {
  return spawn("git", ["remote", "rm", "upstream"])
  .then(() => {}) // No-op for removing the upstream (it could fail)
  .catch(() => {})
  .finally(() => spawn("git", [
    "remote",
    "add",
    "upstream",
    "https://github.com/calblueprint/whales-snap.git"
  ]));
};

if (fs.existsSync(versionFile)) {
  versionStr = fs.readFileSync(versionFile).toString();
} else {
  versionStr = "0.1.0";
}

fetch("https://raw.githubusercontent.com/calblueprint/whales-snap/master/.whales-version")
.then(resp => resp.text())
.then((resp) => {
  latestVersion = resp;
  if (latestVersion === versionStr) {
    console.log("This Whales project is already up-to-date. ✨");
    return process.exit(0);
  }
  console.log(
    "We'll try to automatically update this project from",
    versionStr,
    "to",
    latestVersion
  );
  console.log("Verifying your remote is set...");
  return spawn("git", ["remote", "-v"]);
})
.then((remoteInfo) => {
  const remotes = remoteInfo.data;
  if (remotes.indexOf("upstream") === -1) {
    console.log("Your upstream remote wasn't found. We'll set it now.");
    return updateRemote();
  }
  console.log("Upstream remote is present!");
  if (remotes.indexOf("https://github.com/calblueprint/whales-docker.git")) {
    needsRemoteUpdate = true;
    console.log("Your upstream remote will be updated to Whales Snap.");
  }
})
.then(() => {
  return spawn("git", ["status"]);
})
.then((statusInfo) => {
  const status = statusInfo.data;
  if (status.indexOf("nothing to commit, working tree clean") === -1) {
    return Promise.reject("ERR: Please commit your work before updating!");
  }
})
.then(() => {
  if (versionStr.indexOf("0.1") > -1) {
    console.log("Unshallowing project...");
    return spawn("git", ["fetch", "--unshallow", "upstream"])
    .catch((errInfo) => {
      const resp = errInfo.data;
      if (resp.indexOf("does not make sense") > -1) {
        console.log("Your project was already unshallowed.");
        return;
      }
      return Promise.reject(errInfo);
    });
  }
})
.then(() => {
  if (needsRemoteUpdate) {
    return updateRemote().then(() => {
      console.log("Your upstream remote now points to Whales Snap!");
    });
  }
})
.then(() => {
  console.log("Pulling in upstream changes...");
  const pullCmd = crossSpawn("git", ["pull", "-Xtheirs", "upstream", "master"]);
  pullCmd.stdout.pipe(process.stdout);
  pullCmd.stderr.pipe(process.stderr);
})
.catch((err) => {
  console.log("There was an error updating this Whales project:\n");
  console.log(err, "\n");
  process.exit(1);
});
