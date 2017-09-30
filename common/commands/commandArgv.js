class CommandArgv {
  constructor(cmdLine, prefix = "!") {
    var args = this.constructor.parseArgs(cmdLine);
    var cmd = args.shift() || "";
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

  toString(withPrefix = false, quote = "'") {
    return (withPrefix ? this.prefix : "") + this.constructor.buildArgsString(this.toArray(), quote);
  }

  isEmpty() {
    return !this._command.length && !this._args.length;
  }

  hasArgs() {
    return this._args.length > 0;
  }

  get command() {
    return this._command;
  }

  get args() {
    return this._args;
  }

  get argsString() {
    return this.constructor.buildArgsString(this._args);
  }

  get prefix() {
    return this._prefix;
  }

  // 3rd party code. Thx Gawdl3x https://github.com/Gawdl3y/discord.js-commando/blob/master/src/commands/message.js#L487
  static parseArgs(argString, argCount, allowSingleQuote = true) {
		const re = allowSingleQuote ? /\s*(?:("|')([^]*?)\1|(\S+))\s*/g : /\s*(?:(")([^]*?)"|(\S+))\s*/g;
		const result = [];
		let match = [];
		// Large enough to get all items
		argCount = argCount || argString.length;
		// Get match and push the capture group that is not null to the result
		while(--argCount && (match = re.exec(argString))) result.push(match[2] || match[3]);
		// If text remains, push it to the array as-is (except for wrapping quotes, which are removed)
		if(match && re.lastIndex < argString.length) {
			const re2 = allowSingleQuote ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g;
			result.push(argString.substr(re.lastIndex).replace(re2, '$2'));
		}
		return result;
  }
  
  static buildArgsString(args, quote) {
    var _args = [];
    if (!quote) {
      quote = "'";
    }
    args.forEach(arg => {
      if (arg.split(' ').length > 1) {
        _args.push(quote + arg + quote);
      } else {
        _args.push(arg);
      }
    });
    return _args.join(' ');
  }
}

module.exports = CommandArgv;
