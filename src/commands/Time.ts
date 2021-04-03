import { Command } from "@purrplingbot/core/Commander";
import { Message } from "discord.js";
import { format, isWeekend, getHours } from "date-fns";
import { error } from "@purrplingbot/utils/logger";

export default class TimeCommand implements Command {
  name = "time";  
  visible = true;
  description = "What is current time in our Ms. Catwoman's country?";
  private readonly uid: string;

  constructor(catwomanUid: string) {
      this.uid = catwomanUid;
  }

  async execute(message: Message): Promise<void> {
    const currentTime = new Date();
    let chance = "only saint kitten knowns";

    if (isWeekend(currentTime) && getHours(currentTime) > 7 && getHours(currentTime) < 22) {
        // Is weekend day => cat responnds soon
        chance = "probably soon";
    } else if (!isWeekend(currentTime) && getHours(currentTime) > 7 && getHours(currentTime) < 17) {
        // In workdays between 7am and 5pm cat respons rarely
        chance = "rarely";
    } else if (!isWeekend(currentTime) && getHours(currentTime) < 22) {
        // In workdays after 5pm cat responds soon
        chance = "probably soon";
    } else if (getHours(currentTime) >= 22) {
        // In night cat responds very rarely
        chance = "very rarely";
    }

    try {
        // Get chance by catwoman's presence status
        const catwoman = await message.client.users.fetch(this.uid);

        if (catwoman != null) {
            switch (catwoman.presence.status) {
                case "online":
                    chance = "soon, because she is online! You can ping her";
                    break;
                case "dnd":
                    chance = "as much as she can. Please do not disturb her now"
            }
            
            const stream = catwoman.presence.activities.find(a => a.type === "STREAMING");

            if (stream != null) {
                chance = `lately, because she is streaming right now. Watch her stream on ${stream.url}`
            }
        }
    } catch (e) {
        error(`An error occured while fetching catwoman: ${e}`);
    }

    message.channel.send(
        `Current time in Ms. Catwoman's country is **${format(currentTime, "EEEE d.M.yyyy h:m a (O)")}**\n` +
        `In this time Ms. Catwoman usually responds *${chance}*.`
    );
  }
}
