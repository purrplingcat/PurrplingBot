import test from 'ava';

const CommandArgv = require("../common/commands/commandArgv");

test('Get command&args', t => {
  var cmdArgv = new CommandArgv("!mumble ignore <@7896541230123456789>");
  t.is(cmdArgv.command, "mumble");
  t.deepEqual(cmdArgv.args, ["ignore", "<@7896541230123456789>"]);
  t.is(cmdArgv.argsString, "ignore <@7896541230123456789>");
});

test('Get prefix', t => {
  ['!', '+', '@', '&', ''].forEach(prefix => {
    var cmdArgv = new CommandArgv(prefix + "a b c", prefix);
    t.is(cmdArgv.command, "a");
    t.is(cmdArgv.prefix, prefix);
  });
});

test('Bad prefix in command', t => {
  var cmdArgv = new CommandArgv("+awesome", '!');
  t.is(cmdArgv.command, "+awesome");
  t.not(cmdArgv.prefix, '+');
  t.is(cmdArgv.prefix, '!');
});

test('Shift', t => {
  var cmdArgv = new CommandArgv("!aa bb cc dd");
  var cmdArgvShifted = cmdArgv.shift();
  t.is(cmdArgv.command, "aa");
  t.is(cmdArgv.argsString, "bb cc dd");
  t.deepEqual(cmdArgv.args, ["bb", "cc", "dd"]);
  t.is(cmdArgvShifted.command, "bb");
  t.is(cmdArgvShifted.argsString, "cc dd");
  t.deepEqual(cmdArgvShifted.args, ["cc", "dd"]);
});

test('toArray()', t => {
  var cmdArgv = new CommandArgv("!a b c");
  t.deepEqual(cmdArgv.toArray(), ['a', 'b', 'c']);
});

test('toString()', t => {
  var cmdArgv = new CommandArgv("!a b c");
  t.is(cmdArgv.toString(), "a b c");
  t.is(cmdArgv.toString(true), "!a b c");
});
