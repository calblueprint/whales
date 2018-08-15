import React, { Component } from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';

class AppTest extends Component {
  componentDidMount() {
    this.refs.box.setContent("{bold}asdf{/bold}");
  }

  render() {
    return (
      <element>
        <box
          width="100%"
          height="50"
          bg="blue"
          align="center"
          ref="box"
        >
          test
        </box>
        <box
          top="center"
          left="center"
          width="70%"
          height="50%"
          border={{ type: "line" }}
          style={{ border: { fg: "blue" } }}
          align="center"
        >
          
        </box>
      </element>
    );
  }
};

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'react-blessed hello world'
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

const component = render(<App />, screen);