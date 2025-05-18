import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "./config.js";

const commands = [
	new SlashCommandBuilder()
		.setName("channel")
		.setDescription("Set default channel announcement")
		.addChannelOption((o) => o.setName("channel").setDescription("Channel teks").setRequired(true)),
	new SlashCommandBuilder()
		.setName("role")
		.setDescription("Set default tagged role")
		.addRoleOption((o) => o.setName("role").setDescription("Role untuk di-mention").setRequired(true)),
	new SlashCommandBuilder()
		.setName("add")
		.setDescription("Tambah reminder")
		.addStringOption((o) => o.setName("label").setDescription("Label reminder").setRequired(true))
		.addStringOption((o) => o.setName("text").setDescription("Isi reminder").setRequired(true)),
	new SlashCommandBuilder().setName("list").setDescription("Lihat semua reminder"),
	new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Hapus reminder")
		.addIntegerOption((o) => o.setName("index").setDescription("Nomor reminder (lihat /list)").setRequired(true)),
	new SlashCommandBuilder().setName("run").setDescription("Eksekusi semua reminder sekarang"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: commands });
console.log("✅ Slash commands registered");
