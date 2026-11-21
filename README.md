# JumpStart Trilogy Help Bot

Members can use `/support` for game or server issues and `/feedback` for ideas and suggestions. Both commands open a form with a subject and details. The bot sends the submission and the member’s Discord identity to the configured staff inbox and gives the member a private receipt with a reference ID. The reference is the Discord message ID of the staff inbox post. Staff can use the sender listed on the submission to follow up manually.

## Discord setup

1. Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications). On the **Bot** page, obtain the bot token. Keep it in your local `.env` file or your hosting provider’s secret environment variables.
2. In **Installation**, configure **Guild Install** with the `bot` and `applications.commands` scopes. Install the app in your JumpStart Trilogy server using the installation link.
3. Create two text channels, such as `#support-inbox` and `#feedback-inbox`, in your private Staff category. Deny **View Channel** for `@everyone`, allow access for your staff roles, and allow the bot **View Channel**, **Send Messages**, and **Embed Links** in both channels. Verify that regular member roles have no access.
4. Enable Discord **Developer Mode** under **User Settings → Advanced**. Right-click your server and each inbox channel and copy their IDs.

| Variable | Value |
|---|---|
| `DISCORD_TOKEN` | Bot token from the Developer Portal |
| `DISCORD_GUILD_ID` | JumpStart Trilogy server ID |
| `SUPPORT_CHANNEL_ID` | Private support inbox channel ID |
| `FEEDBACK_CHANNEL_ID` | Private feedback inbox channel ID |

You can use the same private channel ID for both inboxes. The commands are registered only in the configured server. The bot uses no privileged gateway intents.

## Run locally

Install Node.js 24. Copy `.env.example` to `.env`, fill in all four values, and run:

```sh
npm ci
npm start
```

## Run on Render

Upload the extracted files to the root of your GitHub repository and create a Render Blueprint from that repository. The included `render.yaml` creates a paid Starter background worker. Enter the four environment variables when prompted. It uses `npm ci` to install dependencies and `npm start` to run the bot.

## Check the bot in Discord

After the log says both commands registered, submit a sample with each command from a regular member account. Check that the member sees a private receipt, each submission appears in the correct staff inbox, and the regular member cannot open either inbox.

## Message to pin in your help channel

> **Need help or want to share an idea?** 🐾
>
> Use **/support** for problems with JumpStart, Math Blaster, downloads, or the Discord server. Use **/feedback** to suggest a change or tell us what you’d like to see.
>
> Your submission goes to the JumpStart Trilogy staff. Keep the reference ID from your private confirmation if you need to follow up. Please leave out passwords and personal contact details.
