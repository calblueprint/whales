import React from 'react';
import Console from '../components/Console';
import Status from '../components/Status';

import '../public/reset.css';
import '../public/main.css';

const pwd = process.env.PWD;

export default class Index extends React.Component {
  static getInitialProps() {
    return {
      projectPath: pwd,
      projectName: pwd.split("/").pop(),
      buttonDisabled: false
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      dockerStatus: "",
      serverStatus: "",
    };
  }

  componentDidMount() {
    this.socket = new WebSocket("ws://localhost:7331/status");
    this.socket.addEventListener("message", (event) => {
      const { data } = event;
      const payload = JSON.parse(data);
      if (
        payload.type === "server"
        && payload.status !== this.state.serverStatus
      ) {
        // State has flipped, re-enable button
        this.setState({ buttonDisabled: false });
      }
      this.setState({
        [`${payload.type}Status`]: payload.status
      });
    });
  }

  toggleServerState() {
    const { buttonText, serverStatus } = this.state;
    this.socket.send(serverStatus === "DOWN" ? "UP" : "DOWN");
    this.setState({ buttonDisabled: true });
  }

  render() {
    const { projectPath, projectName } = this.props;
    return (<div className="container">
      <div className="header">
        <h3>🐳 <code>Whales</code></h3>
        <h1>{projectName}</h1>
        <p>In <code>{projectPath}</code></p>
      </div>
      <div className="column__container">
        <div className="column">
          <div className="section">
            <h4>Status</h4>
            <Status
              serviceName="Docker"
              serviceStatus={this.state.dockerStatus}
            />
            <Status
              serviceName="Your Rails server"
              serviceStatus={this.state.serverStatus}
            >
              <button>View logs</button>
              <button
                disabled={this.state.buttonDisabled}
                onClick={() => this.toggleServerState()}
              >
                {
                  (this.state.serverStatus === "DOWN"
                  ? `Start${this.state.buttonDisabled ? "ing" : ""} server`
                  : `Stop${this.state.buttonDisabled ? "ping" : ""} server`)
                  + `${this.state.buttonDisabled ? "..." : ""}`
                }
              </button>
            </Status>
          </div>
          <div className="console section">
            <h4>Terminal</h4>
            <Console />
          </div>
        </div>
        {/*<div className="column">
          <div>
            <h4>Requests Log</h4>
          </div>
        </div>*/}
      </div>
    </div>);
  }
}
