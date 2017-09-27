class Action {
  constructor(logger) {
    this.logger = logger.derive(this.constructor.name);
  }

  exec(name, args = []) {
    throw new Error('You have to implement the method exec()!');
  }
}

module.exports = Action;
