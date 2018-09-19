import React from "react";
import blessed from "@calblueprint/blessed";
import { render } from "@calblueprint/react-blessed";
import App from "./components/App";

const path = require("path");
const spawn = require("cross-spawn");

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: "Ruby on Whales Server"
});

const main = (info) => {
  // Setup process cleanup on exit
  const { locationArgs } = info;
  screen.enableInput();
  screen.key(["C-x"], function(ch, key) {
    const down = spawn("docker-compose", [
      ...locationArgs,
      "down",
    ]);

    const msg = blessed.loading({
      border: "line",
      top: "center",
      left: "center",
      height: "shrink",
      width: "half",
      label: "Exiting Whales",
      align: "center",
      parent: screen
    });
    msg.load("Closing processes gracefully...");

    down.on("close", () => {
      return process.exit(0);
    });
  });

  // Render Dashboard
  const { proc: railsProc, publicUrl } = info;
  render(
    <App
      railsProc={railsProc}
      locationArgs={locationArgs}
      publicUrl={publicUrl}
    />,
    screen
  );
};

module.exports = main;
