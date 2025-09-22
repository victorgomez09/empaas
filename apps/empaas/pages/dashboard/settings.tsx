import { IS_CLOUD } from "@empaas/server/constants";
import { validateRequest } from "@empaas/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { useState, type ReactElement } from "react";
import superjson from "superjson";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { appRouter } from "@/server/api/root";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import router from "next/router";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import { ShowBackups } from "@/components/dashboard/database/backups/show-backups";
import { AiForm } from "@/components/dashboard/settings/ai-form";
import { ShowApiKeys } from "@/components/dashboard/settings/api/show-api-keys";
import { ShowBilling } from "@/components/dashboard/settings/billing/show-billing";
import { ShowCertificates } from "@/components/dashboard/settings/certificates/show-certificates";
import { ShowNodes } from "@/components/dashboard/settings/cluster/nodes/show-nodes";
import { ShowRegistry } from "@/components/dashboard/settings/cluster/registry/show-registry";
import { ShowDestinations } from "@/components/dashboard/settings/destination/show-destinations";
import { ShowGitProviders } from "@/components/dashboard/settings/git/show-git-providers";
import { ShowNotifications } from "@/components/dashboard/settings/notifications/show-notifications";
import { ProfileForm } from "@/components/dashboard/settings/profile/profile-form";
import { ShowServers } from "@/components/dashboard/settings/servers/show-servers";
import { WebDomain } from "@/components/dashboard/settings/web-domain";
import { WebServer } from "@/components/dashboard/settings/web-server";
import { api } from "@/utils/api";
import { Settings as SettingsIcon } from "lucide-react";
import { ShowInvitations } from "@/components/dashboard/settings/users/show-invitations";
import { ShowUsers } from "@/components/dashboard/settings/users/show-users";

type TabState = "ai" | "billing" | "certificate" | "cluster" | "destinations" | "git-providers" | "notifications" | "profile" | "registry" | "server" | "servers" | "ssh-keys" | "users";

const Settings = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const { activeTab } = props;
	const [tab, setSab] = useState<TabState>(activeTab);

	const { data } = api.user.get.useQuery();
	const { data: user } = api.user.get.useQuery();

	return (
		<Card className="w-full h-full !bg-transparent">
			<CardHeader>
				<CardTitle className="text-xl flex flex-row gap-2">
					<SettingsIcon className="size-6 text-muted-foreground self-center" />
					Settings
				</CardTitle>
				<CardDescription>
					Manage all system options from here.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs
					value={tab}
					defaultValue="profile"
					className="grid grid-cols-12 gap-4 w-full h-full"
					orientation="vertical"
					onValueChange={(e) => {
						setSab(e as TabState);
						const newPath = `/dashboard/settings?tab=${e}`;

						router.push(newPath, undefined, { shallow: true });
					}}
				>
					<div className="flex justify-start col-span-2 h-full overflow-auto">
						<TabsList
							className="flex flex-col items-start justify-start h-full !bg-background"
						>
							<TabsTrigger value="ai">Ai</TabsTrigger>
							<TabsTrigger value="billing">Billing</TabsTrigger>
							<TabsTrigger value="certificate">Certificate</TabsTrigger>
							<TabsTrigger value="cluster">Cluster</TabsTrigger>
							<TabsTrigger value="destinations">Destinations</TabsTrigger>
							<TabsTrigger value="git-providers">Git providers</TabsTrigger>
							<TabsTrigger value="notifications">Notifications</TabsTrigger>
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="registry">Registry</TabsTrigger>
							<TabsTrigger value="server">Server</TabsTrigger>
							<TabsTrigger value="servers">Servers</TabsTrigger>
							<TabsTrigger value="ssh-keys">SSH keys</TabsTrigger>
							<TabsTrigger value="users">Users</TabsTrigger>
						</TabsList>
					</div>

					<div className="col-span-10 w-full h-full">
						<TabsContent value="ai" className="flex flex-col gap-2 w-full">
							<AiForm />
						</TabsContent>

						<TabsContent value="billing" className="flex flex-col gap-2 w-full">
							<ShowBilling />
						</TabsContent>

						<TabsContent value="certificate" className="flex flex-col gap-2 w-full">
							<ShowCertificates />
						</TabsContent>

						<TabsContent value="cluster" className="flex flex-col gap-2 w-full">
							<ShowNodes />
						</TabsContent>

						<TabsContent value="destinations" className="flex flex-col gap-2 w-full">
							<ShowDestinations />
						</TabsContent>

						<TabsContent value="git-providers" className="flex flex-col gap-2 w-full">
							<ShowGitProviders />
						</TabsContent>

						<TabsContent value="notifications" className="flex flex-col gap-2 w-full">
							<ShowNotifications />
						</TabsContent>

						<TabsContent value="profile" className="flex flex-col gap-2 w-full">
							<div className="flex flex-col gap-2 w-full h-full">
								<ProfileForm />
								{(data?.canAccessToAPI || data?.role === "owner") && <ShowApiKeys />}

								{/* {isCloud && <RemoveSelfAccount />} */}
							</div>
						</TabsContent>

						<TabsContent value="registry" className="flex flex-col gap-2 w-full">
							<ShowRegistry />
						</TabsContent>

						<TabsContent value="server" className="flex flex-col gap-2 w-full">
							<div className="h-full flex flex-col gap-4">
								<WebDomain />
								<WebServer />
								<div className="w-full flex flex-col gap-4">
									<Card className="h-full bg-sidebar  p-2.5 rounded-xl  mx-auto w-full">
										<ShowBackups
											id={user?.userId ?? ""}
											databaseType="web-server"
											backupType="database"
										/>
									</Card>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="servers" className="flex flex-col gap-2 w-full">
							<ShowServers />
						</TabsContent>

						<TabsContent value="ssh-keys" className="flex flex-col gap-2 w-full">
							<ShowDestinations />
						</TabsContent>

						<TabsContent value="users" className="flex flex-col gap-2 w-full">
							<div className="flex flex-col gap-4 w-full">
								<ShowUsers />
								<ShowInvitations />
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</CardContent>
		</Card>
	)
};

export default Settings;
Settings.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{
		activeTab: TabState;
	}>,
) {
	const { query, req, res } = ctx;
	const activeTab = query.tab;

	const { user, session } = await validateRequest(req);
	if (!user) {
		return {
			redirect: {
				permanent: true,
				destination: "/",
			},
		};
	}
	// Fetch data from external API
	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session as any,
			user: user as any,
		},
		transformer: superjson,
	});
	try {
		await helpers.settings.isCloud.prefetch();
		return {
			props: {
				trpcState: helpers.dehydrate(),
				activeTab: (activeTab || "profile") as TabState,
			},
		};
	} catch {
		return {
			redirect: {
				permanent: false,
				destination: "/dashboard/projects",
			},
		};
	}
}
