import React from 'react';
import Console from '../components/Console';
import Status from '../components/Status';
import RequestRow from '../components/RequestRow';

import '../public/reset.css';
import '../public/main.css';
import '../public/fonts.css';

const IS_WIN = process.platform === "win32";
const pwd = process.cwd();

export default class Index extends React.Component {
  static getInitialProps() {
    return {
      projectPath: pwd,
      projectName: IS_WIN ? pwd.split("\\").pop() : pwd.split("/").pop(),
      buttonDisabled: false,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      dockerStatus: "",
      serverStatus: "",
      logsHidden: true,
      requests: [],
      currentRequest: null,
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

    this.requestsSocket = new WebSocket("ws://localhost:7331/requests");
    this.requestsSocket.addEventListener("message", (event) => {
      const { data } = event;
      const payload = JSON.parse(data);
      this.setState({ requests: [...this.state.requests, payload] });
    });
  }

  toggleServerState() {
    const { buttonText, serverStatus } = this.state;
    this.socket.send(serverStatus === "DOWN" ? "UP" : "DOWN");
    this.setState({ buttonDisabled: true });
  }

  render() {
    const { projectPath, projectName } = this.props;
    const { currentRequest: req } = this.state;

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
              <button
                onClick={() => this.setState({ logsHidden: false })}
              >
                View logs
              </button>
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
            <Console wsUrl="ws://localhost:7331/console" />
            <div className={`logs ${this.state.logsHidden ? "hide" : ""}`}>
              <Console wsUrl="ws://localhost:7331/logs" />
              <button
                style={{ marginTop: "10px" }}
                onClick={() => this.setState({ logsHidden: true })}
              >
                Close logs
              </button>
            </div>
          </div>
        </div>
        <div className="column">
          <div>
            <h4>Requests Log</h4>
            {
              this.state.requests.length === 0
              ? <h3 className="message--info">
                  See your requests by visiting:&nbsp;
                  <a
                    href="http://localhost:1337"
                    target="_blank"
                  >
                    http://localhost:1337
                  </a>
                </h3>
              : null
            }
            <div className="request__list_container">
            {this.state.requests.map((req, index) => {
              return (
                <RequestRow
                  onClick={() => this.setState({ currentRequest: req })}
                  selected={this.state.currentRequest === req}
                  key={req.date}
                  {...req}
                />
              );
            })}
            </div>
            {
              req
              ? <div className="request__container">
                  <div className="request__status">
                    <div
                      className={`status__circle ${Number(req.status) >= 400 
                        ? "status__circle--error" : "status__circle--success"}`}
                      style={{ marginRight: "5px" }}
                    />
                    <span style={{ fontWeight: 700 }}>
                      {req.status}
                    </span>
                  </div>
                  <h2>
                    <span
                      style={{ fontWeight: 700 }}
                    >
                      {req.method}
                    </span>
                    &nbsp;{req.url}
                  </h2>
                  <div className="request__breakdown">
                    <div className="request__block">
                      <h3>Response Time</h3>
                      <p>{req.respTime}ms</p>
                    </div>
                    <div className="request__block">
                      <h3>Controller</h3>
                      <p>{req.processor.split("#").shift()}</p>
                    </div>
                    <div className="request__block">
                      <h3>Method</h3>
                      <p>{req.processor.split("#").pop()}</p>
                    </div>
                  </div>
                  <h3>Params</h3>
                  {
                    req.params.length === 0
                    ? <p
                      style={{
                        color: "rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      No params for this request
                    </p>
                    : req.params.map((param) => {
                        return <div className="param__row">
                          <span className="param__key">
                            {param.name}
                          </span>
                          <span className="param__val">
                            {param.value}
                          </span>
                        </div>
                      })
                  }
                  <h3 style={{ marginTop: "10px" }}>Full Log</h3>
                  <div className="request__log">
                    {req.logs.map(log => <div>{log}</div>)}
                  </div>
                </div>
              : null
            }
          </div>
        </div>
      </div>
    </div>);
  }
}
