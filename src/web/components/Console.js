import React from 'react';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';
import * as FontFaceObserver from 'fontfaceobserver';

import '../public/xterm.css';

export default class Console extends React.Component {
  componentDidMount() {
    const consoleFontRegular = new FontFaceObserver("Inconsolata", { weight: 400 }).load();
    const consoleFontBold = new FontFaceObserver("Inconsolata", { weight: 700 }).load();
    Promise.all([consoleFontRegular, consoleFontBold]).then(() => {
      Terminal.applyAddon(attach);
      Terminal.applyAddon(fullscreen);
      var term = new Terminal({
        fontFamily: "Inconsolata",
        fontSize: "16"
      });
      var socket = new WebSocket('ws://localhost:7331/console');

      term.attach(socket);
      term.open(document.querySelector('#terminal'));
    });
  }

  render() {
    return (<div id="terminal"></div>);
  }
}