import React, { Component } from "react";

class Termbox extends Component {
  componentDidMount() {
    this.refs.term.focus();
    this.refs.term.on("click", () => {
      if (this.refs.term.screen.focused !== this.refs.term) {
        this.refs.term.focus();
      }
    });
    if (this.props.ref) {
      this.props.ref(this);
    }
  }

  focus() {
    this.refs.term.focus();
  }

  render() {
    return (
      <box
        mouse={true}
        ref="termbox"
        label="Terminal"
        {...this.props.positions}
      >
        <terminal
          width="50%"
          height="100%"
          shell={process.platform === "win32" ? "docker-compose.exe" : "docker-compose"}
          args={[...this.props.locationArgs, "run", "web", "/bin/bash"]}
          keys={true}
          border={{ type: "line" }}
          style={{ border: { fg: "white" }, focus: { border: { fg: "green" } }}}
          ref="term"
        />
      </box>
    );
  }
}

export default Termbox;
