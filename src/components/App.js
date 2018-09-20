import _ from "lodash";
import events from "events";
import React, { Component } from "react";
import LogListener from "../utils/LogListener";
import Booting from "./Booting";
import ServerInfo from "./ServerInfo";
import RequestList from "./RequestList";
import RequestDetail from "./RequestDetail";
import Termbox from "./Termbox";

const eventEmitter = new events.EventEmitter();

const containerOptions = {
  scrollable: false,
  width: "100%"
};

const initialRow = process.stdout.rows - 3;
const initialState = {
  serverInfo: null,
  requests: [],
  selectedIndex: 0,
  showDetail: false,
  detailMode: "breakdown",
  currentRangeStart: 0,
  maxRow: initialRow,
  halfRow: initialRow,
  currentRow: initialRow,
  subviewScroll: null
};

const allRequests = [];

class App extends Component {
  constructor(props) {
    super(props);

    this.state = initialState;

    ["onRailsStarted", "onRailsRequested", "onKeypress", "setMaxRow"].forEach(
      func => (this[func] = this[func].bind(this))
    );

    eventEmitter.on("started", this.onRailsStarted);
    eventEmitter.on("requested", this.onRailsRequested);
    eventEmitter.on("error", this.onRailsError);
  }

  componentDidMount() {
    const listener = new LogListener(eventEmitter);
    this.props.railsProc.stdout.on("data", listener.stdout);
    this.props.railsProc.stderr.on("data", listener.stderr);
    this.setMaxRow();
  }

  onRailsStarted(serverInfo) {
    this.setState({ serverInfo });
  }

  onRailsRequested(data) {
    allRequests.push(data);
    const { selectedIndex, showDetail } = this.state;

    if (selectedIndex === allRequests.length - 2) {
      this.setState({ selectedIndex: allRequests.length - 1 });
    }
    this.setDisplayRange();
  }

  onRailsError(message) {
    process.emitWarning(message);
  }

  moveIndex(amount, key) {
    if (key.shift) {
      this.scrollSubview(amount);
    } else {
      this.move(this.state.selectedIndex + amount);
    }
  }

  move(nextIndex) {
    let maxIndex = allRequests.length - 1;

    if (nextIndex < 0) {
      nextIndex = 0;
    } else if (nextIndex > maxIndex) {
      nextIndex = maxIndex;
    }

    this.setState({ selectedIndex: nextIndex });
    this.setDisplayRange();
  }

  scrollSubview(amount) {
    let actualAmount;
    if (this.state.subviewScroll === amount) {
      actualAmount = amount;
    } else {
      this.setState({ subviewScroll: amount });
      actualAmount = (this.state.maxRow - this.state.halfRow - 2) * amount;
    }
    this.refs.detail.scroll(actualAmount);
  }

  moveToEdge(key) {
    this.move(key.shift ? allRequests.length - 1 : 0);
  }

  movePage(key) {
    const { selectedIndex, currentRow } = this.state;
    const amount = key.shift ? currentRow * -1 : currentRow;

    this.move(selectedIndex + amount);
  }

  changeMode(mode) {
    if (allRequests.length === 0) return;

    this.setState({ showDetail: true, detailMode: mode });
    this.setDisplayRange();
  }

  showDetail(enable) {
    this.setState({ showDetail: enable });
    this.setDisplayRange();
  }

  setMaxRow() {
    const maxRow = process.stdout.rows - 3;
    this.setState({ maxRow, halfRow: Math.floor(maxRow / 2) - 1 });
    this.setDisplayRange();
  }

  keyFunc(key) {
    if (!this._keyMap) {
      let up = _.partial(this.moveIndex, -1).bind(this);
      let down = _.partial(this.moveIndex, 1).bind(this);

      this._keyMap = {
        down,
        up,
        j: down,
        k: up,
        g: this.moveToEdge.bind(this),
        l: _.partial(this.changeMode, "log").bind(this),
        b: _.partial(this.changeMode, "breakdown").bind(this),
        p: _.partial(this.changeMode, "params").bind(this),
        a: _.partial(this.changeMode, "activerecord").bind(this),
        r: _.partial(this.changeMode, "rendering").bind(this),
        space: this.movePage.bind(this),
        enter: _.partial(this.showDetail, true).bind(this),
        escape: _.partial(this.showDetail, false).bind(this)
      };
    }
    return this._keyMap[key];
  }

  onKeypress(_char, key) {
    // disable ↑,↓ and mouse while show the detail
    if (this.state.showDetail && !_char) return;

    const func = this.keyFunc(key.name);
    if (func) func(key);
  }

  setDisplayRange() {
    const { selectedIndex, showDetail, maxRow, halfRow, currentRangeStart } = this.state;
    const currentRow = showDetail ? halfRow : maxRow;
    let nextRangeStart;

    if (selectedIndex < currentRangeStart) {
      nextRangeStart = selectedIndex;
    } else if (selectedIndex >= currentRangeStart + currentRow) {
      nextRangeStart = selectedIndex - currentRow + 1;
    } else {
      nextRangeStart = currentRangeStart;
    }
    const requests = allRequests.slice(nextRangeStart, nextRangeStart + currentRow);

    this.setState({ requests, currentRow, currentRangeStart: nextRangeStart, subviewScroll: null });
  }

  render() {
    const {
      serverInfo,
      requests,
      showDetail,
      detailMode,
      selectedIndex,
      currentRangeStart,
      currentRow,
      halfRow
    } = this.state;

    if (!serverInfo) return <Booting />;

    const selectedData = allRequests[selectedIndex] || {};
    const detailProps = {
      top: halfRow + 3,
      height: `100%-${halfRow + 3}`,
      data: selectedData,
      mode: detailMode
    };
    const focused = !showDetail;

    const { railsProc, mainProc } = this.props;
    railsProc.stdout.unpipe(mainProc.stdout);
    railsProc.stderr.unpipe(mainProc.stderr);
    return (
      <box width="100%" onResize={this.setMaxRow}>
        <ServerInfo
          top={0}
          height={1}
          publicUrl={this.props.publicUrl}
          {...serverInfo}
        />
        <Termbox
          locationArgs={this.props.locationArgs}
          positions={{ top: 1, height: "100%-1" }}
          label="Terminal"
        />
        <RequestList
          top={1}
          left="50%"
          height={currentRow}
          width="50%"
          onKeypress={this.onKeypress}
          showDetail={showDetail}
          data={requests}
          selectedNo={selectedIndex - currentRangeStart}
        />
        {
          showDetail &&
          <RequestDetail
            onKeypress={this.onKeypress}
            ref="detail"
            {...detailProps}
          />
        }
      </box>
    );
  }
}

export default App;
