#!/usr/bin/env node
const IS_DEV = process.env.BABEL_ENV === "development";
const BASE_PATH = IS_DEV ? "../src" : "../dist";
const spawn = require(`${BASE_PATH}/web/promisify-spawn`);

spawn("docker", ["ps", "-q"])
.then((procInfo) => {
  let containerIds = procInfo.data.split("\n").filter(id => id.trim());
  if (containerIds.length === 0) {
    return;
  }
  return spawn("docker", ["kill", ...containerIds]);
})
.then(() => {
  console.log("Successfully brought down all containers.");
})
.catch((err) => {
  console.log("Whales encountered an error.");
  console.log(err);
  process.exit(err.exitCode);
});
