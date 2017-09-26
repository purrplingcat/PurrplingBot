const Acl = require("../acl.js");

class CommandAuthority {
    constructor(acl, message) {
      // TODO: As it will possible, change message type to CommandMessage
      if (!acl) throw new ReferenceError("Acl undenfined or null!");
      if (!message) throw new ReferenceError("Message undenfined or null!");
      this.acl = acl;
      this.member = message.member;
      this.user = message.author;
      this.channel = message.channel;
    }

    hasPermission(permission) {
      if (!this.member) return this.acl.isBotAdmin(this.user);
      return this.acl.can(this.member, permission, this.channel);
    }

    get GuildOwner() {
      if (!this.member) return false;
      return this.acl.isGuildOwner(this.member);
    }

    get BotAdmin() {
      return this.acl.isBotAdmin(this.user);
    }

    get Member() {
      return this.member;
    }

    get User() {
      return this.user;
    }

    get Acl() {
      return this.acl;
    }

    get id () {
      return this.user.id;
    }

    get username() {
      return this.user.username;
    }

    get displayName() {
      if (!this.member) return this.username;
      return this.member.displayName;
    }

    get FLAGS() {
      return Acl.FLAGS;
    }

    get ALL() {
      return Acl.ALL;
    }

    get DEFAULT() {
      return Acl.DEFAULT;
    }
}

CommandAuthority.FLAGS = Acl.FLAGS;
CommandAuthority.ALL = Acl.ALL;
CommandAuthority.DEFAULT = Acl.DEFAULT;

module.exports = CommandAuthority;
