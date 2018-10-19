const spawn = require("cross-spawn");
const fs = require("fs");
const os = require("os");
const path = require("path");
const platform = os.platform();
const majorVer = +os.release().split(".").shift();
const whereCmd = platform === "win32" ? "where" : "whereis";
const stdioOpts = { stdio: [process.stdin, process.stdout, process.stderr] };
const usingToolbox =
  process.env.DOCKER_HOST
  && process.env.DOCKER_MACHINE_NAME
  && process.env.DOCKER_TLS_VERIFY
  && process.env.DOCKER_CERT_PATH;

function checkCompose() {
  console.log("Checking for docker-compose...");
  let composeCheck = spawn.sync(whereCmd, ["docker-compose"], stdioOpts);
  if (composeCheck.error || composeCheck.status != 0) {
    console.log(composeCheck.error, composeCheck.status);
    console.log("Whales couldn't find docker-compose installed on your system.");
    if (platform !== "win32" && platform !== "darwin") {
      console.log("If you're on Linux, you may need to install the separate docker-compose package.");
      console.log("See https://docs.docker.com/compose/install/#install-compose for information.");
    } else {
      console.log("Make sure Docker is installed correctly.");
    }
    process.exit(1);
  } else {
    console.log("docker-compose found!");
  }
}

function checkDaemon() {
  console.log("Checking if Docker daemon is running...");
  let daemonCheck = spawn.sync("docker", ["ps"], stdioOpts);
  if (daemonCheck.error || daemonCheck.status != 0) {
    console.log("Whales couldn't connect to the Docker daemon.");
    if (platform === "darwin" && majorVer >= 15) {
      console.log("Trying to open Docker for Mac for you automatically...");
      let dockerMacOpen = spawn.sync("open", ["-a", "/Applications/Docker.app"]);
      if (dockerMacOpen.error || dockerMacOpen.status != 0) {
        console.log("Whales couldn't open Docker for Mac. "
          + "Check your Applications folder to make sure it's installed.");
        process.exit(1);
      } else {
        console.log("Whales opened Docker for Mac.");
        console.log("Wait for the whale in your menubar to stop fizzling, and then try again!");
        process.exit(0);
      }
    }

    if (platform === "win32") {
      if (usingToolbox) {
        console.log("Please open Docker Quickstart Terminal and wait for it to load before running Whales.");
        process.exit(1);
      } else {
        console.log("Trying to open Docker for Windows for you automatically...");
        let dockerWinOpen = spawn.sync("start", [`"C:\Program Files\Docker\Docker\Docker for Windows.exe"`]);
        if (dockerWinOpen.error || dockerWinOpen.status != 0) {
          console.log("Whales couldn't start Docker for Windows.");
          console.log("Is Docker installed? Try running it from your Desktop.");
          process.exit(1);
        } else {
          console.log("Whales opened Docker for Windows.");
          console.log("Wait for the whale in your menubar to stop fizzling, and then try again!");
          process.exit(0);
        }
      }
    }

    console.log("Whales couldn't automatically start your Docker engine.");
    console.log("If you're on Linux, you may need to start the Docker service before running Whales.");
  } else {
    console.log("Docker daemon is running!");
  }
}

function checkIfWhalesProj() {
  if (!fs.existsSync(path.join(process.cwd(), "docker-compose.yml"))) {
    console.log("It doesn't look like you're running inside of a Whales project.");
    console.log("If you've just created a project, `cd` into the new folder to run Whales.");
    return process.exit(1);
  }
  console.log("Whales project found!");
}

module.exports = {
  checkCompose,
  checkDaemon,
  checkIfWhalesProj,
  all: [checkCompose, checkDaemon, checkIfWhalesProj]
};
