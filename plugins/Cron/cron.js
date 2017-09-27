const PurrplingBot = require("../../purrplingbot.js");
const Discord = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment');
const registerDefaultActions = require("./actions.js");
const CONFIG = PurrplingBot.Configuration;
const FORMATS = [
  'Cron',
  'DateTime'
];
var logger;

const cronConf = CONFIG.cron || {};
var actions = new Discord.Collection();
var schedules = new Discord.Collection();

function scheduleJob(name, plan) {
  if (!actions.has(plan.action)) {
    logger.error("Job '%s' not scheduled - Action %s not exists!", plan.action);
    PurrplingBot.logEvent(`Job '${name}' not scheduled - Action ${plan.action} not exists`, "Cron:ScheduleJob", "ERROR");
    return;
  }
  var planFormat = plan.format || "Cron"
  if (!FORMATS.includes(planFormat)) throw new Error(`Invalid plan format: ${planFormat}`);
  if (planFormat == "DateTime") {
    plan.schedule = moment(plan.schedule, "YYYY-MM-DD HH:mm:ss");
  }
  var a = actions.get(plan.action);
  var j = schedule.scheduleJob(plan.schedule, execJob.bind(this, a, name, plan));
  schedules.set(name, plan);
  logger.info("Job '%s' scheduled at '%s'", name, plan.schedule);
  PurrplingBot.logEvent(`Job '${name}' scheduled at '${plan.schedule}'`, "Cron:ScheduleJob", "INFO");
}

function execJob(action, jobName, plan) {
  action.exec(jobName, plan.args || []);
  logger.info("Job '%s' executed! Action: %s", jobName, plan.action);
  PurrplingBot.logEvent(`Job '${jobName}' executed! Action: ${plan.action}`, "Cron:ExecJob", "INFO");
}

PurrplingBot.on('ready', function(){
  logger.info("Scheduling cron jobs ...");
  const plan = cronConf.plan || {};
  for (var p in plan) {
    scheduleJob(p, plan[p]);
  }
  logger.info("Scheduling DONE!");
});

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  registerDefaultActions(actions, logger);
  logger.info("Registered default actions!");
}

exports.status = function() {
  return {
    "Planned jobs": schedules.keyArray().length,
    "Actions": actions.keyArray().length,
    "Action list": actions.keyArray().join(', ')
  };
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
