'use strict';

const {
  ChannelType, Client, EmbedBuilder, Events, GatewayIntentBits, LabelBuilder,
  MessageFlags, ModalBuilder, PermissionFlagsBits, SlashCommandBuilder,
  TextInputBuilder, TextInputStyle,
} = require('discord.js');

const formTypes = {
  support: {
    title: 'Request support',
    description: 'Send a private support request to the JumpStart Trilogy staff',
    details: 'What happened? Include the game and error.',
    channelKey: 'SUPPORT_CHANNEL_ID',
    color: 0x5865f2,
  },
  feedback: {
    title: 'Share feedback',
    description: 'Send a suggestion or feedback to the JumpStart Trilogy staff',
    details: 'What would you like us to know?',
    channelKey: 'FEEDBACK_CHANNEL_ID',
    color: 0x57f287,
  },
};
const commands = Object.entries(formTypes).map(([name, form]) =>
  new SlashCommandBuilder().setName(name).setDescription(form.description).toJSON(),
);
const prefix = 'jumpstart-help:';

function buildModal(name, form) {
  return new ModalBuilder()
    .setCustomId(prefix + name)
    .setTitle(form.title)
    .addLabelComponents(
      new LabelBuilder().setLabel('Subject').setTextInputComponent(
        new TextInputBuilder().setCustomId('subject').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setRequired(true),
      ),
      new LabelBuilder().setLabel(form.details)
        .setDescription('Leave out passwords and private contact details.')
        .setTextInputComponent(
          new TextInputBuilder().setCustomId('details').setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1500).setRequired(true),
        ),
    );
}

async function getInbox(guild, channelId) {
  const channel = await guild.channels.fetch(channelId, { force: true });
  if (channel?.type !== ChannelType.GuildText) {
    throw new Error('The inbox must be a text channel in the configured server.');
  }
  if (channel.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel)) {
    throw new Error('Deny View Channel for @everyone on the staff inbox.');
  }
  const bot = await guild.members.fetchMe();
  const required = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];
  if (!channel.permissionsFor(bot)?.has(required)) {
    throw new Error('The bot needs View Channel, Send Messages, and Embed Links in the staff inbox.');
  }
  return channel;
}

async function handleInteraction(interaction, config) {
  if (interaction.guildId !== config.DISCORD_GUILD_ID) return;

  if (interaction.isChatInputCommand() && Object.hasOwn(formTypes, interaction.commandName)) {
    await interaction.showModal(buildModal(interaction.commandName, formTypes[interaction.commandName]));
    return;
  }
  if (!interaction.isModalSubmit() || !interaction.customId.startsWith(prefix)) return;

  const name = interaction.customId.slice(prefix.length);
  if (!Object.hasOwn(formTypes, name)) return;

  const form = formTypes[name];
  const subject = interaction.fields.getTextInputValue('subject').trim();
  const details = interaction.fields.getTextInputValue('details').trim();
  if (!subject || !details) {
    await interaction.reply({
      content: 'Please enter a subject and details, then submit again.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let message;
  try {
    const inbox = await getInbox(interaction.guild, config[form.channelKey]);
    const embed = new EmbedBuilder()
      .setTitle(subject)
      .setDescription(details)
      .setColor(form.color)
      .addFields({ name: 'Submitted by', value: '<@' + interaction.user.id + '> (' + interaction.user.id + ')' })
      .setFooter({ text: name === 'support' ? 'Support request' : 'Feedback' })
      .setTimestamp();
    message = await inbox.send({
      embeds: [embed],
      allowedMentions: { parse: [] },
      nonce: interaction.id,
      enforceNonce: true,
    });
  } catch (error) {
    console.error('Could not deliver', name, error.code ?? error.message);
    await interaction.editReply('Delivery could not be confirmed. Please contact a moderator if the problem continues.');
    return;
  }
  await interaction.editReply('Sent to the JumpStart Trilogy staff. Your reference ID is `' + message.id + '`.');
}

async function start(config) {
  if (!config.DISCORD_TOKEN?.trim()) throw new Error('Set DISCORD_TOKEN.');
  for (const key of ['DISCORD_GUILD_ID', 'SUPPORT_CHANNEL_ID', 'FEEDBACK_CHANNEL_ID']) {
    if (!/^\d{17,20}$/.test(config[key] ?? '')) throw new Error('Set ' + key + ' to a Discord ID.');
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.on(Events.Error, error => console.error('Discord client error:', error.code ?? error.name));
  client.on(Events.InteractionCreate, interaction => {
    handleInteraction(interaction, config).catch(error => {
      console.error('Could not handle interaction:', error.code ?? error.name);
    });
  });
  client.once(Events.ClientReady, async () => {
    try {
      const guild = await client.guilds.fetch(config.DISCORD_GUILD_ID);
      await Promise.all([...new Set([config.SUPPORT_CHANNEL_ID, config.FEEDBACK_CHANNEL_ID])]
        .map(id => getInbox(guild, id)));
      for (const command of commands) await guild.commands.create(command);
      console.log('Ready as ' + client.user.tag + '. /support and /feedback registered.');
    } catch (error) {
      console.error('Bot setup failed:', error.code ?? error.message);
      client.destroy();
      process.exitCode = 1;
    }
  });
  await client.login(config.DISCORD_TOKEN);
}

if (require.main === module) {
  start(process.env).catch(error => {
    console.error('Bot startup failed:', error.code ?? error.message);
    process.exitCode = 1;
  });
}

module.exports = { handleInteraction };
