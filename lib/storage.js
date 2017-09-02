/*
 * This file is part of PurrplingBot!
 */
const LOGGER = require("./logger.js");
const FS = require('fs');
const PKG = require("../package.json");

var logger = LOGGER.createLogger("Storage");

var Store = function(storageFile) {
  var data;
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

  this.storageFile = storageFile;
  this.data = data;
}

Store.prototype.storeScope = function(scopeName, data, autoFlush = false) {
  logger.log("Store data in scope: %s", scopeName);
  this.data.content[scopeName] = data;
  if (autoFlush === true) this.flush();
  return this;
}

Store.prototype.restoreScope = function(scopeName) {
  logger.log("Restore data from scope: %s", scopeName);
  return this.data.content[scopeName] || {};
}

Store.prototype.flush = function (storageFile) {
  if (!storageFile) storageFile = this.storageFile;
  var wrc = this.data.meta.writes_count++;
  this.data.meta.updated = new Date();
  logger.log("Save data to storage file: %s Writes count: %s", storageFile, wrc);
  writeDataFile(storageFile, this.data);
  return this;
}

Store.prototype.getMetadata = function() {
  logger.log("Get a meta of storage: %s", this.storageFile);
  return this.data.meta;
};

Store.prototype.addMetaField = function(field, value) {
  this.data.meta.fields[field] = value;
  return this;
};

Store.prototype.getField = function(field) {
  if (!field) return this.data.meta.fields;
  return this.data.meta.fields[field];
};

Store.prototype.getScopeList = function () {
  return Object.keys(this.data.content);
};

Store.prototype.countScopes = function() {
  return this.getScopeList().length;
};

Store.prototype.import = function(jsonFileName, scopeName) {
  if (!scopeName) return this.data.content = readDataFile(jsonFileName) || {};
  return this.data.content[scopeName] = readDataFile(jsonFileName) || {};
};

Store.prototype.export = function (jsonFileName, scopeName) {
  if (!scopeName) writeDataFile(jsonFileName, this.data.content);
  else writeDataFile(jsonFileName, this.data.content[scopeName]);
  return this;
};

function readDataFile(storageFile) {
  try {
    var json = FS.readFileSync(storageFile, 'utf8').toString();
    logger.log("Loaded config file: %s", storageFile);
    return JSON.parse(json);
  } catch(err) {
    logger.error("Failed while reading data file: " + storageFile + " - " + err);
    logger.log(err);
    return null;
  }
}

function writeDataFile(storageFile, data) {
  var json = JSON.stringify(data);
  FS.writeFile(storageFile, json, 'utf8', err => {
    if (err) {
      logger.error("Error while writing data file: %s - %s", storageFile, err);
      logger.log(err);
    } else {
      logger.log("Data file successfully written: %s", storageFile);
    }
  });
}

function storage(storageFile) {
  return new Store(storageFile);
}

module.exports = storage;
