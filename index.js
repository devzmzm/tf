const Discord = require("discord.js-selfbot-v13");
const config = require("./config");
const handler = require("./src/commandHandler");
const { DisTube } = require("distube");
const client = new Discord.Client({
  checkUpdate: false,
});
const owner = [""];
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.emotes = require("./config.json").emoji;
client.distube = new DisTube(client, {
  leaveOnEmpty: false,
  leaveOnFinish: false,
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: true,
  emitAddListWhenCreatingQueue: true,
  youtubeDL: false,
  savePreviousSongs: true,
  youtubeCookie: process.env.cookie
});
client
  .on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({ status: "idle"})
    // Register all commands
    await handler(client);
  })
  .on("messageCreate", async (message) => {
  if (!owner.includes(message.author.id)) return;
    if (
      !message.guild ||
      message.author.bot ||
      !message.content?.startsWith(config.prefix)
    )
      return;
    const args = message.content.trim().slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      (await client.commands.get(commandName)) ||
      (await client.commands.get(await client.aliases.get(commandName)));
    if (!command) return;
    try {
      await command.run(client, message, args);
    } catch (e) {
      console.error(e);
    }
  })
  .login(process.env.token);

const status = (queue) =>
  `Volume: \`${queue.volume}%\` | Filter: \`${
    queue.filters.join(", ") || "Off"
  }\` | Loop: \`${
    queue.repeatMode
      ? queue.repeatMode === 2
        ? "All Queue"
        : "This Song"
      : "Off"
  }\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;
client.distube
  .on("playSong", (queue, song) =>
    queue.textChannel.send(
      `${client.emotes.play} | Playing \`${song.name}\` - \`${
        song.formattedDuration
      }\`\nRequested by: ${song.user}\n${status(queue)}`
    )
  )
  .on("addSong", (queue, song) =>
    queue.textChannel.send(
      `${client.emotes.success} | Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    )
  )
  .on("addList", (queue, playlist) =>
    queue.textChannel.send(
      `${client.emotes.success} | Added \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) to queue\n${status(queue)}`
    )
  )
  .on("error", (channel, e) => {
    channel.send(
      `${client.emotes.error} | An error encountered: ${e
        .toString()
        .slice(0, 1974)}`
    );
    console.error(e);
  })
  .on("empty", (channel) =>
    channel.send("Voice channel is empty! Leaving the channel...")
  )
  .on("searchNoResult", (message, query) =>
    message.channel.send(
      `${client.emotes.error} | No result found for \`${query}\`!`
    )
  )
  .on("finish", (queue) => queue.textChannel.send("Finished!"));
