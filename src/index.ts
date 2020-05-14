import run from "@purrplingbot/app/bootstrap";

if (require.main === module) {
  run();
}

export { default as types } from "@purrplingbot/types";

export default {
  version: "__BOT_VERSION__",
  codename: "__BOT_CODENAME__",
  run,
};
