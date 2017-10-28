const GroupCommand = require("../../common/commands/groupCommand");
const CronPlugin = require("./cron");

class CronCommand extends GroupCommand {
  constructor(commander, actions, schedules, plans) {
    super(commander);
    this._actions = actions;
    this._plans = plans;
    this._schedules = schedules;
    this.description = "Informations about cron jobs (Define cron jobs in your config file!)";
    this.botAdminOnly = true;
    this.createSubcommand("list", this._execList.bind(this))
        .setDescription("List a cron jobs");
    this.createSubcommand("force", this._execForce.bind(this))
        .setDescription("Force execution of a cron job!")
        .setUsage("<jobName>");
  }

  _execList(cmdMessage) {
    var text = "Scheduled crontab:\n\n"
    if (!Object.keys(this._plans).length) {
      text += "*No cron jobs is planned!*\n";
    } else {
      for (var planName in this._plans) {
        let plan = this._plans[planName];
        text += `${planName}  - \`${JSON.stringify(plan.schedule)}\` - ${plan.action}`;
        text += (this._schedules.keyArray().includes(planName) ? " ACTIVE" : " INACTIVE") + "\n";
        text += "```\n" + plan.args.join(", ") + "\n```\n";
      }
    }
    cmdMessage.channel.send(text)
    .then(this.logger.info("List printed to #%s by %s", cmdMessage.channel.name, cmdMessage.caller.username))
    .catch(this.logger.error);
  }

  _execForce(cmdMessage, tail) {
    if (!tail) {
      this.logger.info("No cron job name given in #%s by %s", cmdMessage.channel.name, cmdMessage.caller.username);
      cmdMessage.reply("Specify me a cron job name.");
      return;
    }
    var plan = this._plans[tail];
    if (!plan) {
      cmdMessage.reply(`Job '${tail}' not exists!`);
      this.logger.info("Job '%s' not exists in #%s by %s", tail, cmdMessage.channel.name, cmdMessage.caller.username);
      return;
    }
    if (!this._actions.has(plan.action)) {
      this.logger.error("Job '%s' can't be executed - Action %s not exists!", tail, plan.action);
      cmdMessage.reply(`Job ${tail} has invalid action - Can't execute it!`);
      return;
    }
    var a = this._actions.get(plan.action);
    CronPlugin.execJob(a, tail, plan);
  }
}

module.exports = CronCommand;