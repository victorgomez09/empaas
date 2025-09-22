import { db } from "@empaas/server/db";
import { notifications } from "@empaas/server/db/schema";
import EmpaasRestartEmail from "@empaas/server/emails/emails/empaas-restart";
import { renderAsync } from "@react-email/components";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
	sendDiscordNotification,
	sendEmailNotification,
	sendGotifyNotification,
	sendSlackNotification,
	sendTelegramNotification,
} from "./utils";

export const sendEmpaasRestartNotifications = async () => {
	const date = new Date();
	const unixDate = ~~(Number(date) / 1000);
	const notificationList = await db.query.notifications.findMany({
		where: eq(notifications.empaasRestart, true),
		with: {
			email: true,
			discord: true,
			telegram: true,
			slack: true,
			gotify: true,
		},
	});

	for (const notification of notificationList) {
		const { email, discord, telegram, slack, gotify } = notification;

		if (email) {
			const template = await renderAsync(
				EmpaasRestartEmail({ date: date.toLocaleString() }),
			).catch();
			await sendEmailNotification(email, "Empaas Server Restarted", template);
		}

		if (discord) {
			const decorate = (decoration: string, text: string) =>
				`${discord.decoration ? decoration : ""} ${text}`.trim();

			try {
				await sendDiscordNotification(discord, {
					title: decorate(">", "`✅` Empaas Server Restarted"),
					color: 0x57f287,
					fields: [
						{
							name: decorate("`📅`", "Date"),
							value: `<t:${unixDate}:D>`,
							inline: true,
						},
						{
							name: decorate("`⌚`", "Time"),
							value: `<t:${unixDate}:t>`,
							inline: true,
						},
						{
							name: decorate("`❓`", "Type"),
							value: "Successful",
							inline: true,
						},
					],
					timestamp: date.toISOString(),
					footer: {
						text: "Empaas Restart Notification",
					},
				});
			} catch (error) {
				console.log(error);
			}
		}

		if (gotify) {
			const decorate = (decoration: string, text: string) =>
				`${gotify.decoration ? decoration : ""} ${text}\n`;
			try {
				await sendGotifyNotification(
					gotify,
					decorate("✅", "Empaas Server Restarted"),
					`${decorate("🕒", `Date: ${date.toLocaleString()}`)}`,
				);
			} catch (error) {
				console.log(error);
			}
		}

		if (telegram) {
			try {
				await sendTelegramNotification(
					telegram,
					`<b>✅ Empaas Server Restarted</b>\n\n<b>Date:</b> ${format(date, "PP")}\n<b>Time:</b> ${format(date, "pp")}`,
				);
			} catch (error) {
				console.log(error);
			}
		}

		if (slack) {
			const { channel } = slack;
			try {
				await sendSlackNotification(slack, {
					channel: channel,
					attachments: [
						{
							color: "#00FF00",
							pretext: ":white_check_mark: *Empaas Server Restarted*",
							fields: [
								{
									title: "Time",
									value: date.toLocaleString(),
									short: true,
								},
							],
						},
					],
				});
			} catch (error) {
				console.log(error);
			}
		}
	}
};
