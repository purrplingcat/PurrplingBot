const EventEmiter = require('events');
const durationParse = require("duration-parser");
const LOGGER = require("../../lib/logger.js");

class Repeater extends EventEmiter {
  constructor(announces, options, logger) {
    if (!logger) {
      logger = LOGGER.createLogger("Repeater");
    }
    super();
    this._options = options || {};
    this._logger = logger;
    this._queue = [];
    if (this.options.enabled) {
      this.announces = announces;
      this._logger.info("Repeater is ENABLED!");
    }
    else {
      this.announces = null;
    }
    this._logger.log("Initalized!");
  }

  addToQueue(announce) {
    if (!this.options.enabled) {
      this._logger.log("Repeater is DISABLED!");
      return;
    }
    if (!announce) throw new Error("Empty announces can't be added to queue!");
    if (!announce.name && !announce.name.lengh) throw new Error("Can't add anonymous announce to queue!");
    if (this._queue.indexOf(announce.name) > -1) {
      this._logger.log("Announce %s already added to queue", announce.name);
      return this;
    }
    this._queue.push(announce.name);
    this._logger.log("Added announce %s to queue", announce.name);
    return this;
  }

  processQueue() {
    if (!this.options.enabled) {
      this._logger.log("Repeater is DISABLED!");
      return;
    }
    if (!this._queue.length) {
      this._logger.log("Queue is EMPTY!");
      return;
    }
    var queue = [];
    var currentTime = new Date();
    this._logger.info("Processing announces queue for repeat ...");
    this._queue.forEach( announceName => {
      let announce = this.announces[announceName];
      let expires = durationParse(announce.interval) * this.options.expirePercentTime || 0.25;
      if ((currentTime.getTime() - announce.lastTry.getTime() < expires)) {
        queue.push(announce);
        this._logger.log("Added %s to process queue", announce.name);
      } else this._logger.log("%s expired - Not added to queue", announce.name);
      this.emit('process', announce, queue);
    });
    setTimeout(this._repeatAnnounce, durationParse(this.options.handleWait || "5m"), queue);
    this._logger.info("Repeater started! Announces in queue: ", queue.length);
    return queue;
  }

  _repeatAnnounce(queue) {
    if (!queue.length) {
      this._queue = [];
      this._logger.info("Repeater DONE! Queue is clear! ");
      return;
    }
    var announce = queue.pop();
    this.emit('repeat', announce);
    this._logger.log("Announce %s repeated!", announce.name);
    setTimeout(this._repeatAnnounce, durationParse(this.options.handleWait || "5m"), queue);
  }

  get options() {
    return this._options;
  }

  get queue() {
    return this._queue;
  }
}

module.exports = Repeater;
