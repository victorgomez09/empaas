import { validateRequest } from "@empaas/server/lib/auth";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createServerSideHelpers } from "@trpc/react-query/server";
import copy from "copy-to-clipboard";
import {
	Ban,
	CheckCircle2,
	ChevronDown,
	CircuitBoard,
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
import { type ReactElement, useEffect, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { ShowImport } from "@/components/dashboard/application/advanced/import/show-import";
import { ShowVolumes } from "@/components/dashboard/application/advanced/volumes/show-volumes";
import { ShowDeployments } from "@/components/dashboard/application/deployments/show-deployments";
import { ShowDomains } from "@/components/dashboard/application/domains/show-domains";
import { ShowEnvironment } from "@/components/dashboard/application/environment/show-enviroment";
import { ShowSchedules } from "@/components/dashboard/application/schedules/show-schedules";
import { ShowVolumeBackups } from "@/components/dashboard/application/volume-backups/show-volume-backups";
import { ShowWebhooks } from "@/components/dashboard/application/webhooks/show-webhooks";
import { AddCommandCompose } from "@/components/dashboard/compose/advanced/add-command";
import { IsolatedDeploymentTab } from "@/components/dashboard/compose/advanced/add-isolation";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import { ShowGeneralCompose } from "@/components/dashboard/compose/general/show";
import { ShowDockerLogsCompose } from "@/components/dashboard/compose/logs/show";
import { ShowDockerLogsStack } from "@/components/dashboard/compose/logs/show-stack";
import { UpdateCompose } from "@/components/dashboard/compose/update-compose";
import { ShowBackups } from "@/components/dashboard/database/backups/show-backups";
import { ComposeFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-compose-monitoring";
import { ComposePaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-compose-monitoring";
import { DockerTerminalModal } from "@/components/dashboard/settings/web-server/docker-terminal-modal";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DialogAction } from "@/components/shared/dialog-action";
// import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
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
import { Switch } from "@/components/ui/switch";
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

type TabState =
	| "projects"
	| "settings"
	| "advanced"
	| "deployments"
	| "domains"
	| "monitoring"
	| "volumeBackups"
	| "webhooks";

const Service = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const [_toggleMonitoring, _setToggleMonitoring] = useState(false);
	const { composeId, activeTab } = props;
	const router = useRouter();
	const { projectId, environmentId } = router.query;
	const [tab, setTab] = useState<TabState>(activeTab);

	useEffect(() => {
		if (router.query.tab) {
			setTab(router.query.tab as TabState);
		}
	}, [router.query.tab]);

	const { data, refetch } = api.compose.one.useQuery({ composeId });
	const { data: auth } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { mutateAsync: update } = api.compose.update.useMutation();
	const { mutateAsync: deploy } = api.compose.deploy.useMutation();
	const { mutateAsync: redeploy } = api.compose.redeploy.useMutation();
	const { mutateAsync: start, isLoading: isStarting } =
		api.compose.start.useMutation();
	const { mutateAsync: stop, isLoading: isStopping } =
		api.compose.stop.useMutation();

	return (
		<div className="pb-10">
			<UseKeyboardNav forPage="compose" />
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

			<Head>
				<title>
					Compose: {data?.name} - {data?.environment?.project?.name} | Empaas
				</title>
			</Head>

			<Card className="bg-background h-full w-full">
				<CardHeader className="flex flex-row justify-between items-center">
					<div className="flex flex-col">
						<CardTitle className="text-xl flex flex-row gap-2">
							<div className="relative flex flex-row gap-4">
								{/* <div className="absolute -right-1 -top-2">
												<StatusTooltip status={data?.composeStatus} />
											</div> */}

								<CircuitBoard className="h-6 w-6 text-muted-foreground" />
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
										<TooltipProvider>
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
														server is inactive, please upgrade your plan to add
														more servers.
													</span>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
								<span>{">"}</span>
								<StatusTooltip status={data?.composeStatus} />
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
						<div className="flex flex-row gap-2 justify-end">
							<TooltipProvider
								delayDuration={0}
								disableHoverableContent={false}
							>
								<DialogAction
									title="Deploy Compose"
									description="Are you sure you want to deploy this compose?"
									type="default"
									onClick={async () => {
										await deploy({
											composeId: composeId,
										})
											.then(() => {
												toast.success("Compose deployed successfully");
												refetch();
												router.push(
													`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/compose/${composeId}?tab=deployments`,
												);
											})
											.catch(() => {
												toast.error("Error deploying compose");
											});
									}}
								>
									<Button
										variant="default"
										size="sm"
										isLoading={data?.composeStatus === "running"}
										className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
													<p>
														Downloads the source code and performs a complete
														build
													</p>
												</TooltipContent>
											</TooltipPrimitive.Portal>
										</Tooltip>
									</Button>
								</DialogAction>

								{data?.composeType === "docker-compose" &&
								data?.composeStatus === "idle" ? (
									<DialogAction
										title="Start Compose"
										description="Are you sure you want to start this compose?"
										type="default"
										onClick={async () => {
											await start({
												composeId: composeId,
											})
												.then(() => {
													toast.success("Compose started successfully");
													refetch();
												})
												.catch(() => {
													toast.error("Error starting compose");
												});
										}}
									>
										<Button
											variant="secondary"
											size="sm"
											isLoading={isStarting}
											className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
															Start the compose (requires a previous successful
															build)
														</p>
													</TooltipContent>
												</TooltipPrimitive.Portal>
											</Tooltip>
										</Button>
									</DialogAction>
								) : (
									<DialogAction
										title="Stop Compose"
										description="Are you sure you want to stop this compose?"
										onClick={async () => {
											await stop({
												composeId: composeId,
											})
												.then(() => {
													toast.success("Compose stopped successfully");
													refetch();
												})
												.catch(() => {
													toast.error("Error stopping compose");
												});
										}}
									>
										<Button
											variant="destructive"
											size="sm"
											isLoading={isStopping}
											className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
														<p>Stop the currently running compose</p>
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
											title="Reload Compose"
											description="Are you sure you want to reload this compose?"
											type="default"
											onClick={async () => {
												await redeploy({
													composeId: composeId,
												})
													.then(() => {
														toast.success("Compose reloaded successfully");
														refetch();
													})
													.catch(() => {
														toast.error("Error reloading compose");
													});
											}}
										>
											<Button
												variant="ghost"
												isLoading={data?.composeStatus === "running"}
												className="flex items-center gap-1.5 group w-full"
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
															<p>Reload the compose without rebuilding it</p>
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
												<Terminal className="size-4 mr-1" />
												Terminal
											</Button>
										</DockerTerminalModal>

										<div className="flex flex-row items-center gap-2 px-4 py-2 w-full">
											<span className="text-sm font-medium">Autodeploy</span>
											<Switch
												aria-label="Toggle autodeploy"
												checked={data?.autoDeploy || false}
												onCheckedChange={async (enabled) => {
													await update({
														composeId,
														autoDeploy: enabled,
													})
														.then(async () => {
															toast.success("Auto Deploy Updated");
															await refetch();
														})
														.catch(() => {
															toast.error("Error updating Auto Deploy");
														});
												}}
												className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
											/>
										</div>

										<UpdateCompose composeId={composeId} />
										{(auth?.role === "owner" || auth?.canDeleteServices) && (
											<DeleteService id={composeId} type="compose" />
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</TooltipProvider>
						</div>
					</div>
				</CardHeader>

				<CardContent className="w-full h-full !p-0">
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
								setTab(e as TabState);
								const newPath = `/dashboard/project/${projectId}/environment/${environmentId}/services/compose/${composeId}?tab=${e}`;
								router.push(newPath);
							}}
						>
							<div className="flex justify-start col-span-2 h-full overflow-auto">
								<TabsList className="flex flex-col items-start justify-start h-full !bg-background">
									<TabsTrigger value="general">General</TabsTrigger>
									<TabsTrigger value="environment">Environment</TabsTrigger>
									<TabsTrigger value="domains">Domains</TabsTrigger>
									<TabsTrigger value="deployments">Deployments</TabsTrigger>
									<TabsTrigger value="logs">Logs</TabsTrigger>
									<TabsTrigger value="backups">Backups</TabsTrigger>
									<TabsTrigger value="schedules">Schedules</TabsTrigger>
									<TabsTrigger value="volumeBackups">
										Volume Backups
									</TabsTrigger>
									<TabsTrigger value="webhooks">Webhooks</TabsTrigger>
									{((data?.serverId && isCloud) || !data?.server) && (
										<TabsTrigger value="monitoring">Monitoring</TabsTrigger>
									)}
									<TabsTrigger value="advanced">Advanced</TabsTrigger>
								</TabsList>
							</div>

							<div className="col-span-10 w-full h-full">
								<TabsContent
									value="general"
									className="flex flex-col gap-2 w-full"
								>
									<ShowGeneralCompose composeId={composeId} />
								</TabsContent>

								<TabsContent
									value="environment"
									className="flex flex-col gap-2 w-full"
								>
									<ShowEnvironment id={composeId} type="compose" />
								</TabsContent>

								<TabsContent
									value="backups"
									className="flex flex-col gap-2 w-full"
								>
									<ShowBackups id={composeId} backupType="compose" />
								</TabsContent>

								<TabsContent
									value="schedules"
									className="flex flex-col gap-2 w-full"
								>
									<ShowSchedules id={composeId} scheduleType="compose" />
								</TabsContent>

								<TabsContent
									value="volumeBackups"
									className="flex flex-col gap-2 w-full"
								>
									<ShowVolumeBackups
										id={composeId}
										type="compose"
										serverId={data?.serverId || ""}
									/>
								</TabsContent>

								<TabsContent
									value="monitoring"
									className="flex flex-col gap-2 w-full"
								>
									{data?.serverId && isCloud ? (
										<ComposePaidMonitoring
											serverId={data?.serverId || ""}
											baseUrl={`${data?.serverId ? `http://${data?.server?.ipAddress}:${data?.server?.metricsConfig?.server?.port}` : "http://localhost:4500"}`}
											appName={data?.appName || ""}
											token={data?.server?.metricsConfig?.server?.token || ""}
											appType={data?.composeType || "docker-compose"}
										/>
									) : (
										<>
											{/* {monitoring?.enabledFeatures &&
															isCloud &&
															data?.serverId && (
																<div className="flex flex-row border w-fit p-4 rounded-lg items-center gap-2 m-4">
																	<Label className="text-muted-foreground">
																		Change Monitoring
																	</Label>
																	<Switch
																		checked={toggleMonitoring}
																		onCheckedChange={setToggleMonitoring}
																	/>
																</div>
															)}

														{toggleMonitoring ? (
															<ComposePaidMonitoring
																appName={data?.appName || ""}
																baseUrl={`http://${monitoring?.serverIp}:${monitoring?.metricsConfig?.server?.port}`}
																token={
																	monitoring?.metricsConfig?.server?.token || ""
																}
																appType={data?.composeType || "docker-compose"}
															/>
														) : ( */}
											{/* <div> */}
											<ComposeFreeMonitoring
												serverId={data?.serverId || ""}
												appName={data?.appName || ""}
												appType={data?.composeType || "docker-compose"}
											/>
											{/* </div> */}
											{/* )} */}
										</>
									)}
								</TabsContent>

								<TabsContent
									value="logs"
									className="flex flex-col gap-2 w-full"
								>
									{data?.composeType === "docker-compose" ? (
										<ShowDockerLogsCompose
											serverId={data?.serverId || ""}
											appName={data?.appName || ""}
											appType={data?.composeType || "docker-compose"}
										/>
									) : (
										<ShowDockerLogsStack
											serverId={data?.serverId || ""}
											appName={data?.appName || ""}
										/>
									)}
								</TabsContent>

								<TabsContent
									value="deployments"
									className="flex flex-col gap-2 w-full"
								>
									<ShowDeployments
										id={composeId}
										type="compose"
										serverId={data?.serverId || ""}
										refreshToken={data?.refreshToken || ""}
									/>
								</TabsContent>

								<TabsContent
									value="domains"
									className="flex flex-col gap-2 w-full"
								>
									<ShowDomains id={composeId} type="compose" />
								</TabsContent>

								<TabsContent
									value="advanced"
									className="flex flex-col gap-2 w-full"
								>
									<AddCommandCompose composeId={composeId} />
									<ShowVolumes id={composeId} type="compose" />
									<ShowImport composeId={composeId} />
									<IsolatedDeploymentTab composeId={composeId} />
								</TabsContent>

								<TabsContent
									value="webhooks"
									className="flex flex-col gap-2 w-full"
								>
									<ShowWebhooks composeId={composeId} />
								</TabsContent>
							</div>
						</Tabs>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default Service;
Service.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{
		composeId: string;
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

	// Valid project, if not return to initial homepage....
	if (typeof params?.composeId === "string") {
		try {
			await helpers.compose.one.fetch({
				composeId: params?.composeId,
			});
			await helpers.settings.isCloud.prefetch();
			return {
				props: {
					trpcState: helpers.dehydrate(),
					composeId: params?.composeId,
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
