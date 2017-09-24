const Discord = require('discord.js');
const BOT_ADMIN = "BOT_ADMINISTRATOR";

class Acl {
  constructor(core, botAdmins) {
    this.core = core;
    this._botAdmins = botAdmins || [];
  }

  isBotAdmin(user) {
    if (!user) throw new Error("User not specified!");
    return this._botAdmins.includes(user.id);
  }

  isGuildOwner(member, guild) {
    if (!member) throw new Error("Member not specified!");
    if (typeof member != Discord.GuildMember) throw new Error("Member is not GuildMember!");
    return member.id == guild.ownerID;
  }

  can(member, permission, channel = null, checkBotAdmin = true) {
    if (!member) throw new Error("Member not specified!");
    if (typeof member != Discord.GuildMember) throw new Error("Member is not GuildMember!");
    if (checkBotAdmin && isBotAdmin(member)) return true;
    if (channel && channel.permissionsFor(member).has(permission)) return true;
    return member.hasPermission(permission);
  }

  hasRole(member, role) {
    if (!member) throw new Error("Member not specified!");
    if (typeof member != Discord.GuildMember) throw new Error("Member is not GuildMember!");
    if (typeof role == Discord.Role) role = role.id;
    if (member.roles.find('id', role)) return true;
    return false;
  }

  get Core() {
    return this.core;
  }

  get BotAdmins() {
    return this._botAdmins;
  }
}

Acl.BOT_ADMIN = BOT_ADMIN;
Acl.ALL = Discord.Permissions.ALL;
Acl.DEFAULT = Discord.Permissions.DEFAULT;
Acl.FLAGS = Discord.Permissions.FLAGS;

module.exports = Acl;
