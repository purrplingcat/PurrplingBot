/*
 * This file is part of PurrplingBot!
 */
const LOGGER = require("./logger.js");
const FS = require('fs');
const PKG = require("../package.json");

const DEBUG = process.env.DEBUG || 0;

var logger = LOGGER.createLogger("Storage");

const Store = function(storageFile) {
  var data;
  var dataChanged = false;

  if (FS.existsSync(storageFile)) {
    logger.log("Open storage file: %s", storageFile);
    data = readDataFile(storageFile);
  } else {
    logger.log("Storage file don't exists: %s - Create new", storageFile);
    data = {
      "meta": {
        "created": new Date(),
        "updated": new Date(),
        "pb_version": PKG.version,
        "pb_codename": PKG.codename,
        "writes_count": 0,
        "fields": {}
      },
      "content": {}
    };
    writeDataFile(storageFile, data);
  }
  logger.info("Storage open! File: %s", storageFile);
  if (DEBUG > 2) logger.dir(_data);

  function readDataFile(storageFile) {
    try {
      var json = FS.readFileSync(storageFile, 'utf8').toString();
      logger.log("Loaded data file: %s", storageFile);
      return JSON.parse(json);
    } catch(err) {
      logger.error("Failed while reading data file: " + storageFile + " - " + err);
      logger.log(err);
      return null;
    }
  }

  function writeDataFile(storageFile, _data) {
    var json = JSON.stringify(_data);
    var success = true;
    FS.writeFile(storageFile, json, 'utf8', err => {
      if (err) {
        logger.error("Error while writing data file: %s - %s", storageFile, err);
        logger.log(err);
        success = false;
      } else {
        logger.log("Data file successfully written: %s", storageFile);
        // Verify saved data - avoid save invalid JSON file
        FS.readFile(storageFile, 'utf8', (err, data) => {
          try {
            JSON.parse(data.toString());
            logger.info("Data verify check OK!");
          } catch (_err) {
            logger.error("Data verify check FAILED: %s", _err);
            logger.log(_err);
            logger.info("Try to save again ...");
            writeDataFile(storageFile, _data);
          }
        });
      }
    });
    return success;
  }

  Store.prototype.storeScope = function(scopeName, _data, autoFlush = false) {
    logger.log("Store data in scope: %s", scopeName);
    if (DEBUG > 2) logger.dir(_data);
    data.content[scopeName] = _data;
    dataChanged = true;
    if (autoFlush === true) this.flush();
    return this;
  }

  Store.prototype.restoreScope = function(scopeName, defaults) {
    logger.log("Restore data from scope: %s", scopeName);
    if (!defaults) defaults = {};
    var content = data.content[scopeName] || defaults;
    if (DEBUG > 2) logger.dir(content);
    return content;
  }

  Store.prototype.scopeExists = function(scopeName) {
    if (scopeName in data.content) return true;
    return false;
  };

  Store.prototype.flush = function(_storageFile) {
    if (dataChanged === false) {
      logger.log("Data has not changed! Nothing to save.");
      return; // Don't save data if not changed
    }
    if (!_storageFile) _storageFile = storageFile;
    var _storageFileBk = _storageFile + ".bk";
    var wrc = data.meta.writes_count++;
    data.meta.updated = new Date();
    logger.log("Save data to storage file: %s Writes count: %s", _storageFile, wrc);
    if (FS.existsSync(_storageFile)) {
      logger.log("Creating backup of %s to %s", _storageFileBk);
      // Create backup - Avoid a problems with invalid JSON file save
      fs.rename(_storageFile, _storageFileBk, err => {
        if (err) {
          logger.error("Error while creating backup! %s", err);
          logger.log(err);
        } else {
          logger.info("Backup file created: %s", _storageFileBk);
        }
        writeDataFile(_storageFile, data);
      });
    } else {
      writeDataFile(_storageFile, data);
    }
    dataChanged = false;
    logger.info("Data saved! File: %s", _storageFile);
    return this;
  }

  Store.prototype.getMetadata = function() {
    logger.log("Get a meta of storage: %s", storageFile);
    return data.meta;
  };

  Store.prototype.addMetaField = function(field, value) {
    data.meta.fields[field] = value;
    dataChanged = true;
    return this;
  };

  Store.prototype.getField = function(field) {
    if (!field) return data.meta.fields;
    return data.meta.fields[field];
  };

  Store.prototype.getScopeList = function() {
    return Object.keys(data.content);
  };

  Store.prototype.countScopes = function() {
    if (!this.getScopeList()) return 0;
    return this.getScopeList().length;
  };

  Store.prototype.import = function(jsonFileName, scopeName) {
    if (!scopeName)  {
      var content = readDataFile(jsonFileName);
      if (!content) {
        logger.warn("No content imported from: %s", jsonFileName);
        return;
      }
      data.content = content;
      dataChanged = true;
      logger.log("Content imported from: %s", jsonFileName);
      if (DEBUG > 2) logger.dir(_data);
      return content;
    }
    var content = readDataFile(jsonFileName);
    if (!content) {
      logger.warn("No content imported to scope: %s from: %s", scopeName, jsonFileName);
      return;
    }
    data.content[scopeName] = content;
    dataChanged = true;
    logger.info("Content imported to scope: %s from: %s", scopeName, jsonFileName);
    if (DEBUG > 2) logger.dir(_data);
    return content;
  };

  Store.prototype.export = function (jsonFileName, scopeName) {
    if (!scopeName) writeDataFile(jsonFileName, data.content);
    else writeDataFile(jsonFileName, data.content[scopeName]);
    return this;
  };

  Store.prototype.isDataChanged = function() {
    return dataChanged;
  };

  Store.prototype.getStorageFile = function() {
    return storageFile;
  };

  Store.prototype.close = function() {
    let _storageFile = storageFile;
    data = {};
    dataChanged = false;
    storageFile = null;
    logger.info("Storage closed! File: %s", _storageFile);
  };
}

function storage(storageFile) {
  return new Store(storageFile);
}

module.exports = storage;
