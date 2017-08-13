function parseChannelID(channelSlug) {
  if (channelSlug.startsWith("<#")) {
    return channelSlug.substr(2, channelSlug.length - 3);
  }
  return channelSlug;
}

exports.parseChannelID = parseChannelID;
