import React from "react";

const STATUS_CLASS_NAME = {
  UP: "status__circle--success",
  DOWN: "status__circle--error",
};

const STATUS_MESSAGE  = {
  UP: "running",
  DOWN: "not running",
  ERR: "encountered an error. Try restarting Whales.",
  "": "loading...",
};

export default class Status extends React.Component {
  render() {
    const { serviceName, serviceStatus } = this.props;
    return (
      <div className="status">
        <div
          className={`status__circle ${STATUS_CLASS_NAME[serviceStatus]}`}
        />
        <p>{serviceName} is {STATUS_MESSAGE[serviceStatus]}</p>
        {this.props.children}
      </div>
    );
  }
}