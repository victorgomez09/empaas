import { ServerIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/utils/api";
import { ShowEmpaasActions } from "./servers/actions/show-empaas-actions";
import { ShowStorageActions } from "./servers/actions/show-storage-actions";
import { ShowTraefikActions } from "./servers/actions/show-traefik-actions";
import { ToggleDockerCleanup } from "./servers/actions/toggle-docker-cleanup";
import { UpdateServer } from "./web-server/update-server";

export const WebServer = () => {
	const { t } = useTranslation("settings");
	const { data } = api.user.get.useQuery();

	const { data: empaasVersion } = api.settings.getEmpaasVersion.useQuery();

	return (
		<Card className="h-full w-full">
			<CardHeader className="">
				<CardTitle className="text-xl flex flex-row gap-2">
					<ServerIcon className="size-6 text-muted-foreground self-center" />
					{t("settings.server.webServer.title")}
				</CardTitle>
				<CardDescription>
					{t("settings.server.webServer.description")}
				</CardDescription>
			</CardHeader>
			{/* <CardHeader>
						<CardTitle className="text-xl">
							{t("settings.server.webServer.title")}
						</CardTitle>
						<CardDescription>
							{t("settings.server.webServer.description")}
						</CardDescription>
					</CardHeader> */}
			<CardContent className="space-y-6 py-6 border-t">
				<div className="grid md:grid-cols-2 gap-4">
					<ShowEmpaasActions />
					<ShowTraefikActions />
					<ShowStorageActions />

					<UpdateServer />
				</div>

				<div className="flex items-center flex-wrap justify-between gap-4">
					<span className="text-sm text-muted-foreground">
						Server IP: {data?.user.serverIp}
					</span>
					<span className="text-sm text-muted-foreground">
						Version: {empaasVersion}
					</span>

					<ToggleDockerCleanup />
				</div>
			</CardContent>
		</Card>
	);
};
