const PurrplingBot = require("../../purrplingbot.js");
const SimpleCommand = require("../../common/commands/simpleCommand");
const CronCommand = require("./cronCommand");
const Discord = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment');
const registerDefaultActions = require("./actions.js");
const CONFIG = PurrplingBot.Configuration;
const FORMATS = [
  'cron',
  'datetime',
  'range'
];
var logger;

const cronConf = CONFIG.cron || {};
var actions = new Discord.Collection();
var schedules = new Discord.Collection();

exports.commands = [
  "cron"
];

function scheduleJob(name, plan) {
  if (!actions.has(plan.action)) {
    logger.error("Job '%s' not scheduled - Action %s not exists!", name, plan.action);
    PurrplingBot.logEvent(`Job '${name}' not scheduled - Action ${plan.action} not exists`, "Cron:ScheduleJob", "ERROR");
    return;
  }
  var planFormat = plan.format || "cron";
  if (!FORMATS.includes(planFormat)) {
    throw new Error(`Invalid plan format: ${planFormat}`);
  }
  var scheduled = plan.schedule;
  if (planFormat == "datetime") {
    scheduled = moment(plan.schedule, "YYYY-MM-DD HH:mm:ss");
  }
  if (planFormat == "range") {
    scheduled = {
      start: moment(plan.schedule.start, "YYYY-MM-DD HH:mm:ss"),
      end: moment(plan.schedule.end, "YYYY-MM-DD HH:mm:ss"),
      rule: plan.schedule.rule
    };
  } 
  var a = actions.get(plan.action);
  var j = schedule.scheduleJob(scheduled, execJob.bind(this, a, name, plan));
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
  try {
    if (!cronConf.enabled) return;
    logger.info("Scheduling cron jobs ...");
    const plan = cronConf.plan || {};
    for (var p in plan) {
      scheduleJob(p, plan[p]);
    }
    logger.info("Scheduling DONE!");
  } catch (err) {
    logger.error(err);
  }
});

exports.init = function(pluginName) {
  try {
    logger = PurrplingBot.createLogger(pluginName);
    registerDefaultActions(actions, logger);
    logger.info("Registered default actions!");
  } catch (err) {
    logger.error(err);
  }
}

exports.status = function() {
  return {
    "Planned jobs": schedules.keyArray().length,
    "Actions": actions.keyArray().length,
    "Action list": actions.keyArray().join(', ')
  };
}

exports.cron = new CronCommand(PurrplingBot.Commander, actions, schedules, cronConf.plan || {});
exports.execJob = execJob;

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
