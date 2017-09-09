function print_cmd_help(cmd, cmds, prefix) {
  if (cmd.startsWith(prefix)) {
    cmd = cmd.substring(prefix.length); //Strip a prefix for command, if was set in arg
  }
  if (!cmds.hasOwnProperty(cmd)) {
    return "Unknown command: " + prefix + cmd + ". Type " + prefix + "help to list availaible commands.";
  }
  var help_text = "Command: " + prefix + cmd;
  var cmd_context = cmds[cmd];
  if ("description" in cmd_context) {
    help_text += "\nDescription: " + cmd_context["description"];
  }
  if ("usage" in cmd_context) {
    help_text += "\nUsage: " + prefix + cmd + " " + cmd_context["usage"];
  }
  return help_text;
}

function print_help(cmds, prefix) {
  //TODO: Rewrite to StringBuilder
  var help_text = "Availaible commands: ```\n";
  var iteration = 0;
  help_text += cmds.map(c => { return prefix + c}).join(', ');
  help_text += `\n\`\`\`\nFor more information type '${prefix}help <command>'`;
  return help_text;
}

function parseChannelID(channelSlug) {
  if (channelSlug.startsWith("<#")) {
    return channelSlug.substr(2, channelSlug.length - 3);
  }
  return channelSlug;
}

function parseUserlID(userSlug) {
  if (userSlug.startsWith("<@")) {
    return userSlug.substr(2, userSlug.length - 3);
  }
  return userSlug;
}

exports.parseUserlID = parseUserlID;
exports.parseChannelID = parseChannelID;
exports.printHelp = print_help;
exports.printCmdHelp = print_cmd_help;
