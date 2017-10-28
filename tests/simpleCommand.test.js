import test from 'ava';
import Core from "../common/core";
import SimpleCommand from "../common/commands/simpleCommand";
import CommandMessage from "../common/commands/commandMessage";
import CommandAuthority from "../common/commands/commandAuthority";
import Discord from 'discord.js';

var core = new Core({
  "discord": {"token": "abcd"},
}, null);
var commander = core.Commander;

test("Setup simple command", t => {
  var testCmd = new SimpleCommand(() => {}, commander)
    .setDescription("My test simple command")
    .setUsage("<arg1> <arg2> [<arg3>]")
    .setBotAdminOnly(true)
    .setGuildOwnerOnly(true)
    .setTag("test");

    t.is(testCmd.Description, "My test simple command");
    t.is(testCmd.Usage, "<arg1> <arg2> [<arg3>]");
    t.is(testCmd.Tag, "test");
    t.true(testCmd.botAdminOnly);
    t.true(testCmd.guildOwnerOnly);

  testCmd.setBotAdminOnly(true)
    .setGuildOwnerOnly(true);
});

test("Print command help", t => {
  var testCmd = new SimpleCommand(() => {}, commander)
    .setDescription("My test simple command")
    .setUsage("<arg1> <arg2> [<arg3>]")
    .setBotAdminOnly(true)
    .setGuildOwnerOnly(true)
    .setTag("test");

  t.is(testCmd.printHelp("testCmd"), "Help for command: **!testCmd** (RESTRICTED)\n\n"
      + "*My test simple command*\n\n"
      + "```\n"
      + "Usage:\n"
      + "!testCmd <arg1> <arg2> [<arg3>]\n"
      + "```");

  testCmd.setBotAdminOnly(false)
    .setGuildOwnerOnly(false);

  t.is(testCmd.printHelp("testCmd"), "Help for command: **!testCmd**\n\n"
      + "*My test simple command*\n\n"
      + "```\n"
      + "Usage:\n"
      + "!testCmd <arg1> <arg2> [<arg3>]\n"
      + "```");
});