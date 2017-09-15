const LOGGER = require("./logger.js");

var logger = LOGGER.createLogger("Configurator");

var path = [];

function readConfigFile(fileName) {
  try {
    const fs = require('fs');
    const path = require('path');
    let type = path.extname(fileName);
    var configContent = fs.readFileSync(fileName, 'utf8').toString();
    logger.log("Loaded config file: %s", fileName);
    return parseConfig(configContent, type);
  } catch(err) {
    logger.log("Failed while reading %s - %s", fileName, err);
    logger.log(err);
    return null;
  }
}

function parseConfig(configContent, type = ".yaml") {
  const YAML = require('js-yaml');
  let nativeObject;
  if (!configContent) {
    logger.error("Empty or NULL configuration!");
    return;
  }
  if (type == ".yaml" || type == ".yml") {
    try {
      logger.log("Parsing YAML configuration");
      nativeObject = YAML.safeLoad(configContent);
    } catch (err) {
      logger.error("Cannot parse YAML config: %s", err);
      logger.log(err);
    }
  } else if (type == ".json") {
    try {
      logger.log("Parsing JSON configuration");
      nativeObject = JSON.parse(configContent);
    } catch (err) {
      logger.error("Cannot parse JSON config: %s", err);
      logger.log(err);
    }
  } else {
    logger.error("Unknown configuration format: %s", type);
  }
  return nativeObject;
}

function loadImports(root, imports) {
  for (nodeToImport in imports) {
    path.push(nodeToImport);
    var file = imports[nodeToImport];
    logger.info("Importing node '/%s' from: %s", path.join('/'), file);
    var data = loadConfigFile(file);
    if (!data) {
      throw new Error("Can't import node '" + nodeToImport + "' from: " + file);
    }
    root[nodeToImport] = data;
    path.slice(nodeToImport);
    logger.log("Node '/%s' imported from: %s", path.join('/'), file);
  }
}

function loadConfigFile(configFile) {
  logger.log("Trying to load configuration file: %s", configFile);
  var _config = readConfigFile(configFile);
  if (!_config) {
    throw new Error("Configuration can't be loaded! File: " + configFile);
  }
  if (_config["@imports"]) {
    logger.log("Trying to import config files from @imports in /%s", path.join('/'));
    logger.dir(_config["@imports"]);
    loadImports(_config, _config["@imports"]);
    delete _config["@imports"]
  }
  //logger.dir(_config);
  logger.log("Configuration loaded! Config file: %s, @imports: %s", configFile, (_config["@imports"] ? Object.keys(_config["@imports"]).length : 0));
  return _config;
}

function loadConfiguration(configFile) {
  const fs = require('fs');
  const configFileNameVariants = [
    configFile + ".yaml",
    configFile + ".yml",
    configFile + ".json",
  ];
  let _configFile;
  configFileNameVariants.every(cfile => {
    if (fs.existsSync(cfile)) {
      _configFile = cfile;
      logger.log("Config file %s exists - Using it!", cfile);
      return false;
    }
    logger.log("Config file %s not exists - Try next", cfile);
    return true;
  });
  if (!_configFile) {
    _configFile = configFile;
    logger.log("Using config filename from param: %s", configFile);
  }
  logger.info("Loading configuration from: %s ...", _configFile);
  path = []; // Force reset path
  return loadConfigFile(_configFile);
}

function loadConfigurationMerged() {
  var conf;
  for (var i = 0; i < arguments.length; i++) {
    conf = mergeConfigurations(conf, loadConfiguration(arguments[i]));
    logger.log("Config file %s loaded and merged!", arguments[i]);
  };
  return conf;
}

function mergeConfigurations(whatObj, withObj) {
  const merge = require('merge');
  return merge.recursive(false, whatObj, withObj);
}

module.exports = {
  loadConfiguration: loadConfiguration,
  loadConfigurationMerged: loadConfigurationMerged,
  readConfigFile: readConfigFile,
  mergeConfigurations: mergeConfigurations,
}
