#!/usr/bin/env node

const allChecks = require("../dist/checkForDocker").all;
allChecks.forEach((check) => check());
console.log("Whales is good to go!");
