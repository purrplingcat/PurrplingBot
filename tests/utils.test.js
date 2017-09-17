import test from 'ava';

const UTILS = require("../lib/utils.js");

test('utils:parseUserlID', t => {
  t.is(UTILS.parseUserlID("<@1234567890987654321>"), "1234567890987654321");
  t.is(UTILS.parseUserlID("1234567890987654321"), "1234567890987654321");
  t.is(UTILS.parseUserlID("PurrplingCat"), "PurrplingCat");
  //t.is(UTILS.parseUserlID("<@1234567890987654321"), "1234567890987654321");
});

test('utils:parseChannellID', t => {
  t.is(UTILS.parseChannelID("<#1234567890987654321>"), "1234567890987654321");
  t.is(UTILS.parseChannelID("1234567890987654321"), "1234567890987654321");
  t.is(UTILS.parseChannelID("#general"), "#general");
  t.is(UTILS.parseChannelID("general"), "general");
  //t.is(UTILS.parseChannelID("<#1234567890987654321"), "1234567890987654321");
});

test('utils:printHelp', t => {
  var cmds = ["help", "ping", "plugins", "version", "!+@."];
  t.is(UTILS.printHelp(cmds, '!'), "Availaible commands: ```\n!help, !ping, !plugins, !version, !!+@.\n```\nFor more information type '!help <command>'");
  t.is(UTILS.printHelp(cmds, '+'), "Availaible commands: ```\n+help, +ping, +plugins, +version, +!+@.\n```\nFor more information type '+help <command>'");
  t.is(UTILS.printHelp(cmds, '@'), "Availaible commands: ```\n@help, @ping, @plugins, @version, @!+@.\n```\nFor more information type '@help <command>'");
  t.is(UTILS.printHelp(cmds, '.'), "Availaible commands: ```\n.help, .ping, .plugins, .version, .!+@.\n```\nFor more information type '.help <command>'");
  t.is(UTILS.printHelp(cmds, ''), "Availaible commands: ```\nhelp, ping, plugins, version, !+@.\n```\nFor more information type 'help <command>'");
});

test('utils:printCmdHelp', t => {
  var cmds = {
    "ping": {
      "description": "Ping the bot and get pong."
    },
    "plugins": {
      "description": "Get list of loaded plugins",
      "usage": "[<pluginName>]"
    },
    "!@+.": {
      "description": "A getmad test command"
    },
    "empty": {}
  };
  ['!', '@', '+', '.', ''].forEach(prefix => {
    t.is(UTILS.printCmdHelp("ping", cmds, prefix), `Command: ${prefix}ping\nDescription: Ping the bot and get pong.`);
    t.is(UTILS.printCmdHelp("plugins", cmds, prefix), `Command: ${prefix}plugins\nDescription: Get list of loaded plugins\nUsage: ${prefix}plugins [<pluginName>]`);
    //t.is(UTILS.printCmdHelp("!@+.", cmds, prefix), `Command: ${prefix}!@+.\nDescription: A getmad test command`);
    t.is(UTILS.printCmdHelp("empty", cmds, prefix), `Command: ${prefix}empty`);
    t.is(UTILS.printCmdHelp("unknown", cmds, prefix), `Unknown command: ${prefix}unknown. Type ${prefix}help to list availaible commands.`);
  });
});
