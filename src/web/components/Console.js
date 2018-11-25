import React from 'react';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';
import * as fit from 'xterm/lib/addons/fit/fit';
import FontFaceObserver from 'fontfaceobserver';

import '../public/xterm.css';

export default class Console extends React.Component {
  constructor(props) {
    super(props);
    this.termDiv = React.createRef();
  }

  componentDidMount() {
    const consoleFontRegular = new FontFaceObserver("Inconsolata", { weight: 400 }).load();
    const consoleFontBold = new FontFaceObserver("Inconsolata", { weight: 700 }).load();
    this.socket = new WebSocket(this.props.wsUrl);

    Promise.all([consoleFontRegular, consoleFontBold]).then(() => {
      Terminal.applyAddon(attach);
      Terminal.applyAddon(fullscreen);
      Terminal.applyAddon(fit);
      var term = new Terminal({
        fontFamily: "Inconsolata",
        fontSize: "16"
      });

      term.open(this.termDiv.current);
      term.fit();
      term.attach(this.socket);
      this.socket.addEventListener("open", () => {
        this.socket.send(JSON.stringify({
          resize: {
            cols: term.cols,
            rows: term.rows
          }
        }));
      });
    });
  }

  render() {
    return (<div className="terminal" ref={this.termDiv}></div>);
  }
}