const GroupCommand = require("../../common/commands/groupCommand");
const CronPlugin = require("./cron");

class CronCommand extends GroupCommand {
  constructor(commander, actions, plans) {
    super(commander);
    this._actions = actions;
    this._plans = plans;
    this.description = "Informations about cron jobs (Define cron jobs in your config file!)";
    //this.botAdminOnly = true;
    this.createSubcommand("list", this._execList.bind(this))
        .setDescription("List a cron jobs");
    this.createSubcommand("force", this._execForce.bind(this))
        .setDescription("Force execution of a cron job!")
        .setUsage("<jobName>");
  }

  _execList(message) {
    var text = "Scheduled crontab:\n\n"
    for (var planName in this._plans) {
      let plan = this._plans[planName];
      text += `${planName}  - \`${plan.schedule}\` - ${plan.action}(${plan.args.join(", ")})`;
    }
    message.channel.send(text)
    .then(this.logger.info("List printed to #%s by %s", message.channel.name, message.author.username))
    .catch(this.logger.error);
  }

  _execForce(message, tail) {
    if (!tail) {
      this.logger.info("No cron job name given in #%s by %s", message.channel.name, message.author.username);
      message.reply("Specify me a cron job name.");
      return;
    }
    var plan = this._plans[tail];
    if (!plan) {
      message.reply(`Job '${tail}'' not exists!`);
      this.logger.info("Job '%s' not exists in #%s by %s", tail, message.channel.name, message.author.username);
      return;
    }
    if (!this._actions.has(plan.action)) {
      this.logger.error("Job '%s' can't be executed - Action %s not exists!", tail, plan.action);
      message.reply(`Job ${tail} has invalid action - Can't execute it!`);
      return;
    }
    var a = actions.get(plan.action);
    CronPlugin.execJob(a, tail, plan);
  }
}

module.exports = CronCommand;
