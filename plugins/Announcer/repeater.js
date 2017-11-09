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

  processQueue(channel) {
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
      if (!announce.lastTry) {
        throw new EvalError(`Announce ${announceName} has not set lastTry!`);
      }
      let lastTry = new Date(announce.lastTry);
      if ((currentTime.getTime() - lastTry.getTime() < expires)) {
        if (announce.channel == channel.id) {
          queue.push(announce);
          this._queue.splice(this._queue.indexOf(announceName));
        }
        this._logger.log("Added %s to process queue", announce.name);
      } else {
         this._logger.log("%s expired - Not added to queue", announce.name);
         this._queue.splice(this._queue.indexOf(announceName));
       }
      this.emit('process', announce, queue);
    });
    setTimeout(_repeatAnnounce, durationParse(this.options.handleWait || "5m"), queue, this);
    this._logger.info("Repeater started! Announces in queue: ", queue.length);
    return queue;
  }

  isInQueue(announceName) {
    return this._queue[announceName] != null;
  }

  isEnabled() {
    return this.options.enabled ? true : false;
  }

  get options() {
    return this._options;
  }

  get queue() {
    return this._queue;
  }

}

// Call only as callback from instance of Repeater
function _repeatAnnounce(queue, _this) {
  if (!queue.length) {
    _this._logger.info("Repeater DONE! Queue is clear! ");
    return;
  }
  var announce = queue.pop();
  _this.emit('repeat', announce);
  _this._logger.log("Announce %s repeated!", announce.name);
  setTimeout(_repeatAnnounce, durationParse(_this.options.handleWait || "5m"), queue, _this);
}

module.exports = Repeater;
module.exports.logger = "sdfsdf";
