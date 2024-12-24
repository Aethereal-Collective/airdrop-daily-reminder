import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";
import { config } from "./config";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

const NEW_CHANNEL_ID = "1320949418647879680"; // Replace with the announcement channel ID
const UPDATE_CHANNEL_ID = "1320977152421793802"; // Replace with the announcement channel ID

client.once("ready", () => {
	console.log("Discord bot is ready! 🤖");
});

// Listen for new messages in forums or threads
client.on("messageCreate", async (message) => {
	if (message.channel.isThread() && message.mentions.roles.size > 0) {
		handleForumMessage(message);
	}
});

// Handle messages mentioning specific roles
async function handleForumMessage(message: any) {
	const newChannel = client.channels.cache.get(NEW_CHANNEL_ID) as TextChannel;
	const updateChannel = client.channels.cache.get(UPDATE_CHANNEL_ID) as TextChannel;

	if (!newChannel && !updateChannel) return;

	const forumTitle = message.channel.name; // Get thread (forum) title
	const forumLink = message.channel.url; // Get thread URL
	const mentionedRoles = message.mentions.roles.map((role: any) => role.name);

	// Check for specific role mentions
	if (mentionedRoles.includes("Update Garapan") || mentionedRoles.includes("New Garapan")) {
		const roleType = mentionedRoles.includes("Update Garapan") ? "Update Garapan" : "New Garapan";

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle(`${forumLink}`)
			.addFields({ name: "Deskripsi", value: message.content || "No message content", inline: false }, { name: "Posted By", value: `<@${message.author.id}>`, inline: true })
			.setColor(roleType === "Update Garapan" ? 0x00ff00 : 0xffa500); // Green for update, orange for new

		// Send the announcement
		if (roleType === "New Garapan") {
			newChannel.send({ content: `<@&1201643245319495791>, Garapan Baru 📢 dari **${forumTitle}**`, embeds: [embed] });
		} else {
			updateChannel.send({ content: `<@&1201643245319495791>, Update Garapan 📢 dari **${forumTitle}**`, embeds: [embed] });
		}
	}
}

client.login(config.DISCORD_TOKEN);
