const parse = require("./parser");

class LogListener {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.stdout = this.stdout.bind(this);
    this.stderr = this.stderr.bind(this);
  }

  stdout(data) {
    const ret = parse(data);
    if (ret) this.eventEmitter.emit(ret.type, ret.data);
  }

  stderr(data) {
    this.eventEmitter.emit("error", data.toString().trim());
    const ret = parse(data);
    if (ret) this.eventEmitter.emit(ret.type, ret.data);
  }
}

module.exports = LogListener;
