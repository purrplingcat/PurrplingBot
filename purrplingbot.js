const PurrplingBot = require("./common/core");

module.exports = PurrplingBot;

// Start bot runtime - ONLY if was called as main file
if (require.main === module) {
  PurrplingBot.init();
}
