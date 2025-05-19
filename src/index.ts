import { Client, GatewayIntentBits, Events, ChatInputCommandInteraction } from "discord.js";
// @ts-ignore
import Database from "better-sqlite3";
import cron from "node-cron";
import { config } from "./config.js";

const db = new Database("reminders.db");
db.exec(`CREATE TABLE IF NOT EXISTS guild_configs (
  guildId TEXT PRIMARY KEY,
  defaultChannelId TEXT,
  defaultRoleId TEXT
)`);
db.exec(`CREATE TABLE IF NOT EXISTS reminders (
  guildId TEXT NOT NULL,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
	console.log(`✅ Logged in as ${c.user.tag}`);
	cron.schedule(
		"0 0 0 * * *",
		() => {
			console.log("Cron job running... at" + new Date().toISOString());
			sendReminders();
		},
		{ timezone: "UTC" }
	);
});

client.on(Events.InteractionCreate, async (i) => {
	if (!i.isChatInputCommand()) return;
	try {
		await handleSlash(i);
	} catch (e) {
		console.error(e);
		if (i.deferred || i.replied) i.editReply("❌ Terjadi error.");
		else i.reply({ content: "❌ Terjadi error.", ephemeral: true });
	}
});

async function handleSlash(inter: ChatInputCommandInteraction) {
	const gId = inter.guildId!;
	switch (inter.commandName) {
		// /channel
		case "channel": {
			const ch = inter.options.getChannel("channel", true);
			// Type guard to ensure ch is a GuildChannel or TextBasedChannel
			if (!("isTextBased" in ch) || typeof ch.isTextBased !== "function" || !ch.isTextBased()) {
				return inter.reply({ content: "Channel harus teks.", ephemeral: true });
			}
			upsertConfig(gId, { defaultChannelId: ch.id });
			return inter.reply(`✅ Default channel di-set ke ${ch}`);
		}
		// /role
		case "role": {
			const role = inter.options.getRole("role", true);
			upsertConfig(gId, { defaultRoleId: role.id });
			return inter.reply(`✅ Default role di-set ke ${role}`);
		}
		// /add
		case "add": {
			const text = inter.options.getString("text", true);
			const label = inter.options.getString("label", true);
			const gId = inter.guildId!;
			db.prepare("INSERT INTO reminders (guildId, label, text) VALUES (?,?,?)").run(gId, label, text);

			const { count } = db.prepare("SELECT COUNT(*) count FROM reminders WHERE guildId=?").get(gId);
			return inter.reply(`✅ Reminder ditambah (total ${count}).`);
		}

		// /list
		case "list": {
			await inter.deferReply({ ephemeral: true }); // kasih tahu Discord "tunggu ya"
			const rows = db.prepare("SELECT rowid id, text, created FROM reminders WHERE guildId=?").all(gId);
			if (!rows.length) return inter.editReply("Belum ada reminder.");
			const message = "**Daftar Reminder**\n" + rows.map((r: any, idx: number) => `\`${idx + 1}\` • ${r.text} — ${r.created}`).join("\n");
			return inter.editReply(message); // editReply menggantikan reply setelah deferReply
		}

		// /delete
		case "delete": {
			const idx = inter.options.getInteger("index", true) - 1;
			const row = db.prepare("SELECT rowid FROM reminders WHERE guildId=? LIMIT 1 OFFSET ?").get(gId, idx);
			if (!row) return inter.reply({ content: "Index tidak valid.", ephemeral: true });
			db.prepare("DELETE FROM reminders WHERE rowid=?").run(row.rowid);
			return inter.reply("🗑️ Reminder dihapus.");
		}
		// /run
		case "run": {
			await inter.deferReply({ ephemeral: true });
			await sendReminders();
			return inter.editReply("✅ Reminder dikirim.");
		}
	}
}

// ---------- helper ----------
function upsertConfig(guildId: string, obj: Partial<{ defaultChannelId: string; defaultRoleId: string }>) {
	const col = Object.keys(obj)[0];
	const val = Object.values(obj)[0];
	db.prepare(
		`
    INSERT INTO guild_configs (guildId, ${col}) VALUES (?,?)
    ON CONFLICT(guildId) DO UPDATE SET ${col}=excluded.${col}
  `
	).run(guildId, val);
}

function getConfig(guildId: string) {
	return db.prepare("SELECT * FROM guild_configs WHERE guildId=?").get(guildId);
}

async function sendReminders() {
	// Ambil semua reminder
	const rows = db.prepare("SELECT guildId, label, text FROM reminders").all();

	// Group reminder per guildId
	const grouped = new Map<string, { reminders: { label: string; text: string }[] }>();

	for (const r of rows) {
		if (!grouped.has(r.guildId)) grouped.set(r.guildId, { reminders: [] });
		grouped.get(r.guildId)!.reminders.push({ label: r.label, text: r.text });
	}

	for (const [guildId, group] of grouped.entries()) {
		const guild = await client.guilds.fetch(guildId).catch(() => null);
		if (!guild) continue;

		// Ambil config channel & role dari guild_configs
		const cfg = getConfig(guildId);
		if (!cfg?.defaultChannelId || !cfg?.defaultRoleId) continue;

		const ch = guild.channels.cache.get(cfg.defaultChannelId);
		if (!ch?.isTextBased()) continue;

		const description = group.reminders.map((r, i) => `${i + 1}. **${r.label}**\n${r.text}`).join("\n\n");

		await ch.send({
			content: `<@&${cfg.defaultRoleId}> Reminder Daily Task 🚨`,
			embeds: [{ description, color: 0x2f3136 }],
		});
	}
}

client.login(config.DISCORD_TOKEN);
