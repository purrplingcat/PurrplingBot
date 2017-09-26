class CommandArgv {
  constructor(cmdLine, prefix = "!") {
    var args = cmdLine.split(' ');
    var cmd = args.shift();
    if (cmd.startsWith(prefix)) {
      cmd = cmd.substring(prefix.length);
    }
    this._command = cmd;
    this._args = args;
    this._prefix = prefix;
  }

  shift() {
    return new CommandArgv(this.argsString, this.prefix);
  }

  toArray() {
    return [ this.command ].concat(this.args);
  }

  toString(withPrefix = false) {
    return (withPrefix ? this.prefix : "") + this.toArray().join(' ');
  }

  get command() {
    return this._command;
  }

  get args() {
    return this._args;
  }

  get argsString() {
    return this._args.join(' ');
  }

  get prefix() {
    return this._prefix;
  }
}

module.exports = CommandArgv;
