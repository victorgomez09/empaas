import { validateRequest } from "@empaas/server/lib/auth";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createServerSideHelpers } from "@trpc/react-query/server";
import copy from "copy-to-clipboard";
import {
	Ban,
	CheckCircle2,
	ChevronDown,
	HelpCircle,
	RefreshCcw,
	Rocket,
	ServerOff,
	Terminal,
} from "lucide-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { ShowEnvironment } from "@/components/dashboard/application/environment/show-enviroment";
import { ShowDockerLogs } from "@/components/dashboard/application/logs/show";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import {
	type LogLine,
	parseLogs,
} from "@/components/dashboard/docker/logs/utils";
import { ShowBottomlessReplication } from "@/components/dashboard/libsql/general/show-bottomless-replication";
import { ShowExternalLibsqlCredentials } from "@/components/dashboard/libsql/general/show-external-libsql-credentials";
import { ShowInternalLibsqlCredentials } from "@/components/dashboard/libsql/general/show-internal-libsql-credentials";
import { UpdateLibsql } from "@/components/dashboard/libsql/update-libsql";
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ContainerPaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-container-monitoring";
import { DockerTerminalModal } from "@/components/dashboard/settings/web-server/docker-terminal-modal";
import { ShowDatabaseAdvancedSettings } from "@/components/dashboard/shared/show-database-advanced-settings";
import { LibsqlIcon } from "@/components/icons/data-tools-icons";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DialogAction } from "@/components/shared/dialog-action";
import { DrawerLogs } from "@/components/shared/drawer-logs";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UseKeyboardNav } from "@/hooks/use-keyboard-nav";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";

type TabState = "projects" | "monitoring" | "settings" | "backups" | "advanced";

const Libsql = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { libsqlId, activeTab } = props;
	const router = useRouter();
	const { projectId, environmentId } = router.query;

	const [_toggleMonitoring, _setToggleMonitoring] = useState(false);
	const [tab, setSab] = useState<TabState>(activeTab);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
	const [isDeploying, setIsDeploying] = useState(false);

	const { data, refetch } = api.libsql.one.useQuery({ libsqlId });
	const { data: auth } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { mutateAsync: reload, isLoading: isReloading } =
		api.libsql.reload.useMutation();
	const { mutateAsync: start, isLoading: isStarting } =
		api.libsql.start.useMutation();
	const { mutateAsync: stop, isLoading: isStopping } =
		api.libsql.stop.useMutation();

	api.libsql.deployWithLogs.useSubscription(
		{
			libsqlId: libsqlId,
		},
		{
			enabled: isDeploying,
			onData(log) {
				if (!isDrawerOpen) {
					setIsDrawerOpen(true);
				}

				if (log === "Deployment completed successfully!") {
					setIsDeploying(false);
				}
				const parsedLogs = parseLogs(log);
				setFilteredLogs((prev) => [...prev, ...parsedLogs]);
			},
			onError(error) {
				console.error("Deployment logs error:", error);
				setIsDeploying(false);
			},
		},
	);

	return (
		<div className="pb-10">
			<UseKeyboardNav forPage="libsql" />
			{/* <BreadcrumbSidebar
				list={[
					{ name: "Projects", href: "/dashboard/projects" },
					{
						name: data?.environment?.project?.name || "",
					},
					{
						name: data?.environment?.name || "",
						href: `/dashboard/project/${projectId}/environment/${environmentId}`,
					},
					{
						name: data?.name || "",
					},
				]}
			/> */}
			<div className="flex flex-col gap-4">
				<Head>
					<title>
						Database: {data?.name} - {data?.environment?.project?.name} | Empaas
					</title>
				</Head>
				<Card className="h-ful w-full !bg-transparent">
					<CardHeader className="flex flex-row justify-between items-center">
						<div className="flex flex-col">
							<CardTitle className="text-xl flex flex-row gap-2">
								<div className="relative flex flex-row gap-4">
									{/* <div className="absolute -right-1  -top-2">
											<StatusTooltip status={data?.applicationStatus} />
										</div> */}

									<LibsqlIcon className="h-6 w-6 text-muted-foreground" />
								</div>
								<div className="flex items-center gap-2">
									<span>{data?.name}</span>
									<span>{">"}</span>
									<div className="flex flex-row h-fit w-fit gap-2">
										<span
											className={`text-base cursor-pointer ${
												!data?.serverId
													? "text-default"
													: data?.server?.serverStatus === "active"
														? "text-default"
														: "text-destructive"
											}`}
											onClick={() => {
												if (data?.server?.ipAddress) {
													copy(data.server.ipAddress);
													toast.success("IP Address Copied!");
												}
											}}
										>
											{data?.server?.name || "Empaas Server"}
										</span>
										{data?.server?.serverStatus === "inactive" && (
											<TooltipProvider delayDuration={0}>
												<Tooltip>
													<TooltipTrigger asChild>
														<Label className="break-all w-fit flex flex-row gap-1 items-center">
															<HelpCircle className="size-4 text-muted-foreground" />
														</Label>
													</TooltipTrigger>
													<TooltipContent
														className="z-[999] w-[300px]"
														align="start"
														side="top"
													>
														<span>
															You cannot, deploy this application because the
															server is inactive, please upgrade your plan to
															add more servers.
														</span>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
									</div>
									<span>{">"}</span>
									<StatusTooltip status={data?.applicationStatus} />
								</div>
							</CardTitle>
							{data?.description && (
								<CardDescription>{data?.description}</CardDescription>
							)}

							<span className="text-sm text-muted-foreground">
								{data?.appName}
							</span>
						</div>
						<div className="flex flex-col h-fit w-fit gap-2">
							<div className="flex flex-row h-fit w-fit gap-2">
								<TooltipProvider
									delayDuration={0}
									disableHoverableContent={false}
								>
									<DialogAction
										title="Deploy LibSQL"
										description="Are you sure you want to deploy this libsql?"
										type="default"
										onClick={async () => {
											setIsDeploying(true);
											await new Promise((resolve) => setTimeout(resolve, 1000));
											refetch();
										}}
									>
										<Button
											variant="default"
											size="sm"
											isLoading={data?.applicationStatus === "running"}
											className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
										>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center">
														<Rocket className="size-4 mr-1" />
														Deploy
													</div>
												</TooltipTrigger>
												<TooltipPrimitive.Portal>
													<TooltipContent sideOffset={5} className="z-[60]">
														<p>Downloads and sets up the LibSQL database</p>
													</TooltipContent>
												</TooltipPrimitive.Portal>
											</Tooltip>
										</Button>
									</DialogAction>

									{data?.applicationStatus === "idle" ? (
										<DialogAction
											title="Start LibSQL"
											description="Are you sure you want to start this libsql?"
											type="default"
											onClick={async () => {
												await start({
													libsqlId: libsqlId,
												})
													.then(() => {
														toast.success("LibSQL started successfully");
														refetch();
													})
													.catch(() => {
														toast.error("Error starting LibSQL");
													});
											}}
										>
											<Button
												variant="secondary"
												size="sm"
												isLoading={isStarting}
												className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
											>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="flex items-center">
															<CheckCircle2 className="size-4 mr-1" />
															Start
														</div>
													</TooltipTrigger>
													<TooltipPrimitive.Portal>
														<TooltipContent sideOffset={5} className="z-[60]">
															<p>
																Start the LibSQL database (requires a previous
																successful setup)
															</p>
														</TooltipContent>
													</TooltipPrimitive.Portal>
												</Tooltip>
											</Button>
										</DialogAction>
									) : (
										<DialogAction
											title="Stop LibSQL"
											description="Are you sure you want to stop this libsql?"
											onClick={async () => {
												await stop({
													libsqlId: libsqlId,
												})
													.then(() => {
														toast.success("LibSQL stopped successfully");
														refetch();
													})
													.catch(() => {
														toast.error("Error stopping LibSQL");
													});
											}}
										>
											<Button
												variant="destructive"
												size="sm"
												isLoading={isStopping}
												className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
											>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="flex items-center">
															<Ban className="size-4 mr-1" />
															Stop
														</div>
													</TooltipTrigger>
													<TooltipPrimitive.Portal>
														<TooltipContent sideOffset={5} className="z-[60]">
															<p>Stop the currently running LibSQL database</p>
														</TooltipContent>
													</TooltipPrimitive.Portal>
												</Tooltip>
											</Button>
										</DialogAction>
									)}

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="secondary"
												size="sm"
												className="sm:ml-auto max-sm:w-full"
											>
												Actions <ChevronDown className="ml-2 h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="flex flex-col gap-2"
										>
											<DialogAction
												title="Reload LibSQL"
												description="Are you sure you want to reload this libsql?"
												type="default"
												onClick={async () => {
													await reload({
														libsqlId: libsqlId,
														appName: data?.appName || "",
													})
														.then(() => {
															toast.success("LibSQL reloaded successfully");
															refetch();
														})
														.catch(() => {
															toast.error("Error reloading LibSQL");
														});
												}}
											>
												<Button
													variant="ghost"
													isLoading={isReloading}
													className="flex items-center gap-1.5 w-full"
												>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="flex items-center">
																<RefreshCcw className="size-4 mr-1" />
																Reload
															</div>
														</TooltipTrigger>
														<TooltipPrimitive.Portal>
															<TooltipContent sideOffset={5} className="z-[60]">
																<p>
																	Restart the LibSQL service without rebuilding
																</p>
															</TooltipContent>
														</TooltipPrimitive.Portal>
													</Tooltip>
												</Button>
											</DialogAction>

											<DockerTerminalModal
												appName={data?.appName || ""}
												serverId={data?.serverId || ""}
											>
												<Button
													variant="ghost"
													className="flex items-center gap-1.5 w-full"
												>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="flex items-center">
																<Terminal className="size-4 mr-1" />
																Terminal
															</div>
														</TooltipTrigger>
														<TooltipPrimitive.Portal>
															<TooltipContent sideOffset={5} className="z-[60]">
																<p>Open a terminal to the LibSQL container</p>
															</TooltipContent>
														</TooltipPrimitive.Portal>
													</Tooltip>
												</Button>
											</DockerTerminalModal>

											<UpdateLibsql libsqlId={libsqlId} />
											{(auth?.role === "owner" || auth?.canDeleteServices) && (
												<DeleteService id={libsqlId} type="libsql" />
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</TooltipProvider>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{data?.server?.serverStatus === "inactive" ? (
							<div className="flex h-[55vh] border-2 rounded-xl border-dashed p-4">
								<div className="max-w-3xl mx-auto flex flex-col items-center justify-center self-center gap-3">
									<ServerOff className="size-10 text-muted-foreground self-center" />
									<span className="text-center text-base text-muted-foreground">
										This service is hosted on the server {data.server.name}, but
										this server has been disabled because your current plan
										doesn't include enough servers. Please purchase more servers
										to regain access to this application.
									</span>
									<span className="text-center text-base text-muted-foreground">
										Go to{" "}
										<Link
											href="/dashboard/settings/billing"
											className="text-primary"
										>
											Billing
										</Link>
									</span>
								</div>
							</div>
						) : (
							<Tabs
								value={tab}
								defaultValue="general"
								className="grid grid-cols-12 gap-4 w-full h-full"
								orientation="vertical"
								onValueChange={(e) => {
									setSab(e as TabState);
									const newPath = `/dashboard/project/${projectId}/environment/${environmentId}/services/libsql/${libsqlId}?tab=${e}`;

									router.push(newPath, undefined, { shallow: true });
								}}
							>
								<div className="flex justify-start col-span-2 h-full overflow-auto">
									<TabsList className="flex flex-col items-start justify-start h-full !bg-background">
										<TabsTrigger value="general">General</TabsTrigger>
										<TabsTrigger value="environment">Environment</TabsTrigger>
										<TabsTrigger value="logs">Logs</TabsTrigger>
										{((data?.serverId && isCloud) || !data?.server) && (
											<TabsTrigger value="monitoring">Monitoring</TabsTrigger>
										)}
										<TabsTrigger value="backups">Backups</TabsTrigger>
										<TabsTrigger value="advanced">Advanced</TabsTrigger>
									</TabsList>
								</div>

								<div className="col-span-10 w-full h-full">
									<TabsContent value="general">
										<div className="flex flex-col gap-4 pt-2.5">
											<DrawerLogs
												isOpen={isDrawerOpen}
												onClose={() => {
													setIsDrawerOpen(false);
													setFilteredLogs([]);
													setIsDeploying(false);
													refetch();
												}}
												filteredLogs={filteredLogs}
											/>
											<ShowInternalLibsqlCredentials libsqlId={libsqlId} />
											<ShowExternalLibsqlCredentials libsqlId={libsqlId} />
										</div>
									</TabsContent>

									<TabsContent
										value="environment"
										className="flex flex-col gap-2 w-full"
									>
										<ShowEnvironment id={libsqlId} type="libsql" />
									</TabsContent>

									<TabsContent
										value="monitoring"
										className="flex flex-col gap-2 w-full"
									>
										{data?.serverId && isCloud ? (
											<ContainerPaidMonitoring
												appName={data?.appName || ""}
												baseUrl={`${data?.serverId ? `http://${data?.server?.ipAddress}:${data?.server?.metricsConfig?.server?.port}` : "http://localhost:4500"}`}
												token={data?.server?.metricsConfig?.server?.token || ""}
											/>
										) : (
											<ContainerFreeMonitoring appName={data?.appName || ""} />
										)}
									</TabsContent>

									<TabsContent
										value="logs"
										className="flex flex-col gap-2 w-full"
									>
										<ShowDockerLogs
											serverId={data?.serverId || ""}
											appName={data?.appName || ""}
										/>
									</TabsContent>

									<TabsContent
										value="backups"
										className="flex flex-col gap-2 w-full"
									>
										<ShowBottomlessReplication
											libsqlId={libsqlId}
											enableBottomlessReplication={
												data?.enableBottomlessReplication || false
											}
											bottomlessReplicationDestinationId={
												data?.bottomlessReplicationDestinationId
											}
										/>
									</TabsContent>

									<TabsContent
										value="advanced"
										className="flex flex-col gap-2 w-full"
									>
										<ShowDatabaseAdvancedSettings id={libsqlId} type="libsql" />
									</TabsContent>
								</div>
							</Tabs>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Libsql;
Libsql.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{
		libsqlId: string;
		activeTab: TabState;
		environmentId: string;
	}>,
) {
	const { query, params, req, res } = ctx;
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

	if (typeof params?.libsqlId === "string") {
		try {
			await helpers.libsql.one.fetch({
				libsqlId: params?.libsqlId,
			});
			await helpers.settings.isCloud.prefetch();
			return {
				props: {
					trpcState: helpers.dehydrate(),
					libsqlId: params?.libsqlId,
					activeTab: (activeTab || "general") as TabState,
					environmentId: params?.environmentId,
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

	return {
		redirect: {
			permanent: false,
			destination: "/",
		},
	};
}
