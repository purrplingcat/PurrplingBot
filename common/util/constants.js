module.exports = {
  DEBUG: process.env.DEBUG || 0,
  CMD_DIR: process.env.CMD_DIR || process.cwd() + "/common/Commands/",
  PKG: require("../../package.json"),
  PLUGIN_DIR: process.env.PLUGIN_DIR || process.cwd() + "/plugins",
}
