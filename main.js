import React from "react";
import blessed from "blessed";
import { render } from "react-blessed";
import App from "./components/App";

const path = require("path");
const spawn = require("cross-spawn");

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: "Blue"
});

const main = (info) => {
  // Setup process cleanup on exit
  const workingDir = info.dir;
  screen.key(["C-c"], function(ch, key) {
    const down = spawn("docker-compose", [
      "-f",
      path.join(workingDir, "docker-compose.yml"),
      "down",
    ]);
    // TODO: Show some messaging about how processes are now closing
    down.on("close", () => {
      return process.exit(0);  
    });
  });

  // Render Dashboard
  const railsProc = info.proc;
  render(<App railsProc={railsProc} />, screen);
};

module.exports = main;
