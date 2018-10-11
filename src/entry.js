if (process.env.BABEL_ENV === "development") {
  console.log("Loading from source!");
}

import React from "react";
import blessed from "@calblueprint/blessed";
import { render } from "@calblueprint/react-blessed";
import App from "./components/App";

const path = require("path");
const spawn = require("cross-spawn");
const startServer = require("./web/server");

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: "Ruby on Whales Server"
});

let closing = false;

const main = (info) => {
  // Setup process cleanup on exit
  const { locationArgs } = info;
  screen.enableInput();
  screen.key(["C-x"], quitWhales);
  function quitWhales() {
    closing = true;
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
  }

  // Render Dashboard
  const { proc: railsProc, publicUrl, port } = info;
  railsProc.stdout.pipe(process.stdout);
  railsProc.stderr.pipe(process.stderr);
  railsProc.on("exit", (code) => {
    if (code === null) return;
    if (code !== 0 && !closing) {
      const exitingPrompt = blessed.loading({
        border: "line",
        top: "center",
        left: "center",
        height: "half",
        width: "half",
        label: "Whales encountered a startup error",
        align: "center",
        parent: screen
      });
      exitingPrompt.load(
        `\n\n\n\n(ERR: ${code}) There was an error starting Whales.\n\n`
        + "Make sure you're running this inside a Whales project!\n\n"
        + "Closing in 5 seconds..."
      );
      setTimeout(() => process.exit(code), 5000);
    }
  });

  try {
    startServer(locationArgs);
  } catch (e) {
    // It's okay if the console server quits for now
  }

  render(
    <App
      railsProc={railsProc}
      mainProc={process}
      locationArgs={locationArgs}
      publicUrl={publicUrl}
      quitFunc={quitWhales}
      port={port}
    />,
    screen
  );
};

module.exports = main;
