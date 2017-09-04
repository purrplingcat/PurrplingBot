/*
 * This file is part of PurrplingBot!
 */
const LOGGER = require("./logger.js");
const FS = require('fs');
const PKG = require("../package.json");

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

  function writeDataFile(storageFile, data) {
    var json = JSON.stringify(data);
    var success = true;
    FS.writeFile(storageFile, json, 'utf8', err => {
      if (err) {
        logger.error("Error while writing data file: %s - %s", storageFile, err);
        logger.log(err);
        success = false;
      } else {
        logger.log("Data file successfully written: %s", storageFile);
      }
    });
    return success;
  }

  Store.prototype.storeScope = function(scopeName, data, autoFlush = false) {
    logger.log("Store data in scope: %s", scopeName);
    data.content[scopeName] = data;
    dataChanged = true;
    if (autoFlush === true) this.flush();
    return this;
  }

  Store.prototype.restoreScope = function(scopeName) {
    logger.log("Restore data from scope: %s", scopeName);
    return data.content[scopeName] || {};
  }

  Store.prototype.scopeExists = function(scopeName) {
    if (scopeName in data.content) return true;
    return false;
  };

  Store.prototype.flush = function(storageFile) {
    if (dataChanged === false) {
      logger.log("Data has not changed! Nothing to save.");
      return; // Don't save data if not changed
    }
    if (!storageFile) storageFile = storageFile;
    var wrc = data.meta.writes_count++;
    data.meta.updated = new Date();
    logger.log("Save data to storage file: %s Writes count: %s", storageFile, wrc);
    writeDataFile(storageFile, data);
    logger.info("Data saved! File: %s", storageFile);
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
    if (!scopeName) return data.content = readDataFile(jsonFileName) || {};
    return data.content[scopeName] = readDataFile(jsonFileName) || {};
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
