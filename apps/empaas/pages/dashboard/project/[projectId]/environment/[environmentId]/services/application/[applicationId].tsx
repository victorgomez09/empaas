import { validateRequest } from "@empaas/server/lib/auth";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createServerSideHelpers } from "@trpc/react-query/server";
import copy from "copy-to-clipboard";
import {
	Ban,
	CheckCircle2,
	ChevronDown,
	GlobeIcon,
	Hammer,
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
import { ShowClusterSettings } from "@/components/dashboard/application/advanced/cluster/show-cluster-settings";
import { AddCommand } from "@/components/dashboard/application/advanced/general/add-command";
import { ShowPorts } from "@/components/dashboard/application/advanced/ports/show-port";
import { ShowRedirects } from "@/components/dashboard/application/advanced/redirects/show-redirects";
import { ShowSecurity } from "@/components/dashboard/application/advanced/security/show-security";
import { ShowResources } from "@/components/dashboard/application/advanced/show-resources";
import { ShowTraefikConfig } from "@/components/dashboard/application/advanced/traefik/show-traefik-config";
import { ShowVolumes } from "@/components/dashboard/application/advanced/volumes/show-volumes";
import { ShowDeployments } from "@/components/dashboard/application/deployments/show-deployments";
import { ShowDomains } from "@/components/dashboard/application/domains/show-domains";
import { ShowEnvironment } from "@/components/dashboard/application/environment/show";
import { ShowGeneralApplication } from "@/components/dashboard/application/general/show";
import { ShowDockerLogs } from "@/components/dashboard/application/logs/show";
import { ShowPreviewDeployments } from "@/components/dashboard/application/preview-deployments/show-preview-deployments";
import { ShowSchedules } from "@/components/dashboard/application/schedules/show-schedules";
import { UpdateApplication } from "@/components/dashboard/application/update-application";
import { ShowVolumeBackups } from "@/components/dashboard/application/volume-backups/show-volume-backups";
import { ShowWebhooks } from "@/components/dashboard/application/webhooks/show-webhooks";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ContainerPaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-container-monitoring";
import { DockerTerminalModal } from "@/components/dashboard/settings/web-server/docker-terminal-modal";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
// import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
import { DialogAction } from "@/components/shared/dialog-action";
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
	| "deployments"
	| "preview-deployments"
	| "domains"
	| "monitoring"
	| "volume-backups"
	| "advanced"
	| "webhooks";

const Service = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const [_toggleMonitoring, _setToggleMonitoring] = useState(false);
	const { applicationId, activeTab } = props;
	const router = useRouter();
	const { projectId, environmentId } = router.query;
	const [tab, setTab] = useState<TabState>(activeTab);

	useEffect(() => {
		if (router.query.tab) {
			setTab(router.query.tab as TabState);
		}
	}, [router.query.tab]);

	const { data, refetch } = api.application.one.useQuery(
		{ applicationId },
		{
			refetchInterval: 5000,
		},
	);

	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: auth } = api.user.get.useQuery();

	const { mutateAsync: update } = api.application.update.useMutation();
	const { mutateAsync: deploy } = api.application.deploy.useMutation();
	const { mutateAsync: reload, isLoading: isReloading } =
		api.application.reload.useMutation();
	const { mutateAsync: redeploy } = api.application.redeploy.useMutation();
	const { mutateAsync: start, isLoading: isStarting } =
		api.application.start.useMutation();
	const { mutateAsync: stop, isLoading: isStopping } =
		api.application.stop.useMutation();

	return (
		<div className="pb-10">
			<UseKeyboardNav forPage="application" />
			{/* <BreadcrumbSidebar
				list={[
					{ name: "Projects", href: "/dashboard/projects" },
					{
						name: data?.environment.project.name || "",
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
					Application: {data?.name} - {data?.environment.project.name} | Empaas
				</title>
			</Head>

			<Card className="bg-background h-full w-full">
				<CardHeader className="flex flex-row justify-between items-center">
					<div className="flex flex-col">
						<CardTitle className="text-xl flex flex-row gap-2">
							<div className="relative flex flex-row gap-4">
								{/* <div className="absolute -right-1 -top-2">
									<StatusTooltip status={data?.applicationStatus} />
								</div> */}

								<GlobeIcon className="h-6 w-6 text-muted-foreground" />
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
														server is inactive, please upgrade your plan to add
														more servers.
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
						<div className="flex flex-row gap-2 items-center justify-end">
							<TooltipProvider
								delayDuration={0}
								disableHoverableContent={false}
							>
								<DialogAction
									title="Deploy Application"
									description="Are you sure you want to deploy this application?"
									type="default"
									onClick={async () => {
										await deploy({
											applicationId: applicationId,
										})
											.then(() => {
												toast.success("Application deployed successfully");
												refetch();
												router.push(
													`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/application/${applicationId}?tab=deployments`,
												);
											})
											.catch(() => {
												toast.error("Error deploying application");
											});
									}}
								>
									<Button
										variant="default"
										size="sm"
										isLoading={data?.applicationStatus === "running"}
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

								{data?.applicationStatus === "idle" ? (
									<DialogAction
										title="Start Application"
										description="Are you sure you want to start this application?"
										type="default"
										onClick={async () => {
											await start({
												applicationId: applicationId,
											})
												.then(() => {
													toast.success("Application started successfully");
													refetch();
												})
												.catch(() => {
													toast.error("Error starting application");
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
															Start the application (requires a previous
															successful build)
														</p>
													</TooltipContent>
												</TooltipPrimitive.Portal>
											</Tooltip>
										</Button>
									</DialogAction>
								) : (
									<DialogAction
										title="Stop Application"
										description="Are you sure you want to stop this application?"
										onClick={async () => {
											await stop({
												applicationId: applicationId,
											})
												.then(() => {
													toast.success("Application stopped successfully");
													refetch();
												})
												.catch(() => {
													toast.error("Error stopping application");
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
														<p>Stop the currently running application</p>
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
											title="Reload Application"
											description="Are you sure you want to reload this application?"
											type="default"
											onClick={async () => {
												await reload({
													applicationId: applicationId,
													appName: data?.appName || "",
												})
													.then(() => {
														toast.success("Application reloaded successfully");
														refetch();
													})
													.catch(() => {
														toast.error("Error reloading application");
													});
											}}
										>
											<Button
												variant="ghost"
												size="sm"
												isLoading={isReloading}
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
															<p>
																Reload the application without rebuilding it
															</p>
														</TooltipContent>
													</TooltipPrimitive.Portal>
												</Tooltip>
											</Button>
										</DialogAction>

										<DialogAction
											title="Rebuild Application"
											description="Are you sure you want to rebuild this application?"
											type="default"
											onClick={async () => {
												await redeploy({
													applicationId: applicationId,
												})
													.then(() => {
														toast.success("Application rebuilt successfully");
														refetch();
													})
													.catch(() => {
														toast.error("Error rebuilding application");
													});
											}}
										>
											<Button
												variant="ghost"
												size="sm"
												isLoading={data?.applicationStatus === "running"}
												className="flex items-center gap-1.5 group w-full"
											>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="flex items-center">
															<Hammer className="size-4 mr-1" />
															Rebuild
														</div>
													</TooltipTrigger>
													<TooltipPrimitive.Portal>
														<TooltipContent sideOffset={5} className="z-[60]">
															<p>
																Only rebuilds the application without
																downloading new code
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
												<Terminal className="size-4 mr-1" />
												Open Terminal
											</Button>
										</DockerTerminalModal>

										<div className="flex flex-row items-center gap-2 px-4 py-2 w-full">
											<span className="text-sm font-medium">Autodeploy</span>
											<Switch
												aria-label="Toggle autodeploy"
												checked={data?.autoDeploy || false}
												onCheckedChange={async (enabled) => {
													await update({
														applicationId,
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

										<div className="flex flex-row items-center gap-2 px-4 py-2 w-full">
											<span className="text-sm font-medium">Clean Cache</span>
											<Switch
												aria-label="Toggle clean cache"
												checked={data?.cleanCache || false}
												onCheckedChange={async (enabled) => {
													await update({
														applicationId,
														cleanCache: enabled,
													})
														.then(async () => {
															toast.success("Clean Cache Updated");
															await refetch();
														})
														.catch(() => {
															toast.error("Error updating Clean Cache");
														});
												}}
												className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
											/>
										</div>

										<UpdateApplication applicationId={applicationId} />
										{(auth?.role === "owner" || auth?.canDeleteServices) && (
											<DeleteService id={applicationId} type="application" />
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
								const newPath = `/dashboard/project/${projectId}/environment/${environmentId}/services/application/${applicationId}?tab=${e}`;
								router.push(newPath);
							}}
						>
							<div className="flex justify-start col-span-2 h-full overflow-auto">
								<TabsList className="flex flex-col items-start justify-start h-full !bg-background">
									<TabsTrigger value="general">General</TabsTrigger>
									<TabsTrigger value="environment">Environment</TabsTrigger>
									<TabsTrigger value="domains">Domains</TabsTrigger>
									<TabsTrigger value="deployments">Deployments</TabsTrigger>
									<TabsTrigger value="preview-deployments">
										Preview Deployments
									</TabsTrigger>
									<TabsTrigger value="logs">Logs</TabsTrigger>
									<TabsTrigger value="schedules">Schedules</TabsTrigger>
									<TabsTrigger value="volume-backups">
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
									<ShowGeneralApplication applicationId={applicationId} />
								</TabsContent>

								<TabsContent
									value="environment"
									className="flex flex-col gap-2 w-full"
								>
									<ShowEnvironment applicationId={applicationId} />
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
										<>
											{/* {monitoring?.enabledFeatures &&
															isCloud &&
															data?.serverId && (
																<div className="flex flex-row border w-fit p-4 rounded-lg items-center gap-2">
																	<Label className="text-muted-foreground">
																		Change Monitoring
																	</Label>
																	<Switch
																		checked={toggleMonitoring}
																		onCheckedChange={setToggleMonitoring}
																	/>
																</div>
															)} */}

											{/* {toggleMonitoring ? (
															<ContainerPaidMonitoring
																appName={data?.appName || ""}
																baseUrl={`http://${monitoring?.serverIp}:${monitoring?.metricsConfig?.server?.port}`}
																token={
																	monitoring?.metricsConfig?.server?.token || ""
																}
															/>
														) : ( */}
											<ContainerFreeMonitoring appName={data?.appName || ""} />
											{/* )} */}
										</>
									)}
								</TabsContent>

								<TabsContent
									value="logs"
									className="flex flex-col gap-2 w-full"
								>
									<ShowDockerLogs
										appName={data?.appName || ""}
										serverId={data?.serverId || ""}
									/>
								</TabsContent>

								<TabsContent
									value="schedules"
									className="flex flex-col gap-2 w-full"
								>
									<ShowSchedules
										id={applicationId}
										scheduleType="application"
									/>
								</TabsContent>

								<TabsContent
									value="deployments"
									className="flex flex-col gap-2 w-full"
								>
									<ShowDeployments
										id={applicationId}
										type="application"
										serverId={data?.serverId || ""}
										refreshToken={data?.refreshToken || ""}
									/>
								</TabsContent>

								<TabsContent
									value="volume-backups"
									className="flex flex-col gap-2 w-full"
								>
									<ShowVolumeBackups
										id={applicationId}
										type="application"
										serverId={data?.serverId || ""}
									/>
								</TabsContent>

								<TabsContent
									value="preview-deployments"
									className="flex flex-col gap-2 w-full"
								>
									<ShowPreviewDeployments applicationId={applicationId} />
								</TabsContent>

								<TabsContent
									value="domains"
									className="flex flex-col gap-2 w-full"
								>
									<ShowDomains id={applicationId} type="application" />
								</TabsContent>

								<TabsContent
									value="advanced"
									className="flex flex-col gap-2 w-full"
								>
									<div className="flex flex-col gap-4">
										<AddCommand applicationId={applicationId} />
										<ShowClusterSettings
											id={applicationId}
											type="application"
										/>

										<ShowResources id={applicationId} type="application" />
										<ShowVolumes id={applicationId} type="application" />
										<ShowRedirects applicationId={applicationId} />
										<ShowSecurity applicationId={applicationId} />
										<ShowPorts applicationId={applicationId} />
										<ShowTraefikConfig applicationId={applicationId} />
									</div>
								</TabsContent>

								<TabsContent
									value="webhooks"
									className="flex flex-col gap-2 w-full"
								>
									<ShowWebhooks applicationId={applicationId} />
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
		applicationId: string;
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
	if (typeof params?.applicationId === "string") {
		try {
			await helpers.application.one.fetch({
				applicationId: params?.applicationId,
			});

			await helpers.settings.isCloud.prefetch();

			return {
				props: {
					trpcState: helpers.dehydrate(),
					applicationId: params?.applicationId,
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
