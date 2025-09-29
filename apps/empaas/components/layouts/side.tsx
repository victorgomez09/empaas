"use client";
import type { inferRouterOutputs } from "@trpc/server";
import {
	BarChartHorizontalBigIcon,
	Bell,
	BlocksIcon,
	Clock,
	Folder,
	Forward,
	GalleryVerticalEnd,
	Loader2,
	type LucideIcon,
	Menu,
	PieChart,
	Settings,
	Trash2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn, getFallbackAvatarInitials } from "@/lib/utils";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/utils/api";
import { AddOrganization } from "../dashboard/organization/handle-organization";
import { DialogAction } from "../shared/dialog-action";
import { Accordion } from "../ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "../ui/navigation-menu";
import { UserNav } from "./user-nav";

// Menu items
// Consists of unfiltered home, settings, and help items
// The items are filtered based on the user's role and permissions
// The `isEnabled` function is called to determine if the item should be displayed
const MENU: NavItem[] = [
	{
		isSingle: true,
		title: "Projects",
		url: "/dashboard/projects",
		icon: Folder,
	},
	{
		isSingle: true,
		title: "Monitoring",
		url: "/dashboard/monitoring",
		icon: BarChartHorizontalBigIcon,
		// Only enabled in non-cloud environments
		isEnabled: ({ isCloud }) => !isCloud,
	},
	{
		isSingle: true,
		title: "Schedules",
		url: "/dashboard/schedules",
		icon: Clock,
		// Only enabled in non-cloud environments
		isEnabled: ({ isCloud, auth }) => !isCloud && auth?.role === "owner",
	},
	{
		isSingle: true,
		title: "Traefik File System",
		url: "/dashboard/traefik",
		icon: GalleryVerticalEnd,
		// Only enabled for admins and users with access to Traefik files in non-cloud environments
		isEnabled: ({ auth, isCloud }) =>
			!!((auth?.role === "owner" || auth?.canAccessToTraefikFiles) && !isCloud),
	},
	{
		isSingle: true,
		title: "Docker",
		url: "/dashboard/docker",
		icon: BlocksIcon,
		// Only enabled for admins and users with access to Docker in non-cloud environments
		isEnabled: ({ auth, isCloud }) =>
			!!((auth?.role === "owner" || auth?.canAccessToDocker) && !isCloud),
	},
	{
		isSingle: true,
		title: "Swarm",
		url: "/dashboard/swarm",
		icon: PieChart,
		// Only enabled for admins and users with access to Docker in non-cloud environments
		isEnabled: ({ auth, isCloud }) =>
			!!((auth?.role === "owner" || auth?.canAccessToDocker) && !isCloud),
	},
	{
		isSingle: true,
		title: "Requests",
		url: "/dashboard/requests",
		icon: Forward,
		// Only enabled for admins and users with access to Docker in non-cloud environments
		isEnabled: ({ auth, isCloud }) =>
			!!((auth?.role === "owner" || auth?.canAccessToDocker) && !isCloud),
	},
	{
		isSingle: true,
		title: "Settings",
		url: "/dashboard/settings",
		icon: Settings,
		// Only enabled for admins and users with access to Docker in non-cloud environments
		isEnabled: ({ auth, isCloud }) =>
			!!((auth?.role === "owner" || auth?.canAccessToDocker) && !isCloud),
	},

	// settings: [
	// 	{
	// 		isSingle: true,
	// 		title: "Web Server",
	// 		url: "/dashboard/settings/server",
	// 		icon: Activity,
	// 		// Only enabled for admins in non-cloud environments
	// 		isEnabled: ({ auth, isCloud }) => !!(auth?.role === "owner" && !isCloud),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Profile",
	// 		url: "/dashboard/settings/profile",
	// 		icon: User,
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Remote Servers",
	// 		url: "/dashboard/settings/servers",
	// 		icon: Server,
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Users",
	// 		icon: Users,
	// 		url: "/dashboard/settings/users",
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "SSH Keys",
	// 		icon: KeyRound,
	// 		url: "/dashboard/settings/ssh-keys",
	// 		// Only enabled for admins and users with access to SSH keys
	// 		isEnabled: ({ auth }) =>
	// 			!!(auth?.role === "owner" || auth?.canAccessToSSHKeys),
	// 	},
	// 	{
	// 		title: "AI",
	// 		icon: BotIcon,
	// 		url: "/dashboard/settings/ai",
	// 		isSingle: true,
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Git",
	// 		url: "/dashboard/settings/git-providers",
	// 		icon: GitBranch,
	// 		// Only enabled for admins and users with access to Git providers
	// 		isEnabled: ({ auth }) =>
	// 			!!(auth?.role === "owner" || auth?.canAccessToGitProviders),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Registry",
	// 		url: "/dashboard/settings/registry",
	// 		icon: Package,
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "S3 Destinations",
	// 		url: "/dashboard/settings/destinations",
	// 		icon: Database,
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},

	// 	{
	// 		isSingle: true,
	// 		title: "Certificates",
	// 		url: "/dashboard/settings/certificates",
	// 		icon: ShieldCheck,
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Cluster",
	// 		url: "/dashboard/settings/cluster",
	// 		icon: Boxes,
	// 		// Only enabled for admins in non-cloud environments
	// 		isEnabled: ({ auth, isCloud }) => !!(auth?.role === "owner" && !isCloud),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Notifications",
	// 		url: "/dashboard/settings/notifications",
	// 		icon: Bell,
	// 		// Only enabled for admins
	// 		isEnabled: ({ auth }) => !!(auth?.role === "owner"),
	// 	},
	// 	{
	// 		isSingle: true,
	// 		title: "Billing",
	// 		url: "/dashboard/settings/billing",
	// 		icon: CreditCard,
	// 		// Only enabled for admins in cloud environments
	// 		isEnabled: ({ auth, isCloud }) => !!(auth?.role === "owner" && isCloud),
	// 	},
	// ],
	// {
	// 	title: "Documentation",
	// 	url: "https://docs-empaas.esmosolutions.com/docs/core",
	// 	icon: BookIcon,
	// }
] as const;

/**
 * Creates a menu based on the current user's role and permissions
 * @returns a menu object with the home, settings, and help items
 */
// function createMenuForAuthUser(opts: {
// 	auth?: AuthQueryOutput;
// 	isCloud: boolean;
// }): Menu {
// 	return {
// 		// Filter the home items based on the user's role and permissions
// 		// Calls the `isEnabled` function if it exists to determine if the item should be displayed
// 		home: MENU.home.filter((item) =>
// 			!item.isEnabled
// 				? true
// 				: item.isEnabled({
// 					auth: opts.auth,
// 					isCloud: opts.isCloud,
// 				}),
// 		),
// 		// Filter the settings items based on the user's role and permissions
// 		// Calls the `isEnabled` function if it exists to determine if the item should be displayed
// 		settings: MENU.settings.filter((item) =>
// 			!item.isEnabled
// 				? true
// 				: item.isEnabled({
// 					auth: opts.auth,
// 					isCloud: opts.isCloud,
// 				}),
// 		),
// 		// Filter the help items based on the user's role and permissions
// 		// Calls the `isEnabled` function if it exists to determine if the item should be displayed
// 		help: MENU.help.filter((item) =>
// 			!item.isEnabled
// 				? true
// 				: item.isEnabled({
// 					auth: opts.auth,
// 					isCloud: opts.isCloud,
// 				}),
// 		),
// 	};
// }

/**
 * Determines if an item url is active based on the current pathname
 * @returns true if the item url is active, false otherwise
 */
function isActiveRoute(opts: {
	/** The url of the item. Usually obtained from `item.url` */
	itemUrl: string;
	/** The current pathname. Usually obtained from `usePathname()` */
	pathname: string;
}): boolean {
	const normalizedItemUrl = opts.itemUrl?.replace("/projects", "/project");
	const normalizedPathname = opts.pathname?.replace("/projects", "/project");

	if (!normalizedPathname) return false;

	if (normalizedPathname === normalizedItemUrl) return true;

	if (normalizedPathname.startsWith(normalizedItemUrl)) {
		const nextChar = normalizedPathname.charAt(normalizedItemUrl.length);
		return nextChar === "/";
	}

	return false;
}

/**
 * Finds the active nav item based on the current pathname
 * @returns the active nav item with `SingleNavItem` type or undefined if none is active
 */
// function findActiveNavItem(
// 	navItems: NavItem[],
// 	pathname: string,
// ): NavItem | undefined {
// 	const found = navItems.find((item) =>
// 		item.isSingle !== false
// 			? // The current item is single, so check if the item url is active
// 			isActiveRoute({ itemUrl: item.url, pathname })
// 			: // The current item is not single, so check if any of the sub items are active
// 			item.some((item) =>
// 				isActiveRoute({ itemUrl: item.url, pathname }),
// 			),
// 	);

// 	if (found?.isSingle !== false) {
// 		// The found item is single, so return it
// 		return found;
// 	}

// 	// The found item is not single, so find the active sub item
// 	return found?.items.find((item) =>
// 		isActiveRoute({ itemUrl: item.url, pathname }),
// 	);
// }

interface Props {
	children: React.ReactNode;
}

export default function Page({ children }: Props) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [_activeTeam, setActiveTeam] = useState<
		typeof activeOrganization | null
	>(null);

	const pathname = usePathname();
	const includesProjects = pathname?.includes("/dashboard/project");

	const { data: session } = authClient.useSession();
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const { data: empaasVersion } = api.settings.getEmpaasVersion.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: user } = api.user.get.useQuery();
	const { data: invitations, refetch: refetchInvitations } =
		api.user.getInvitations.useQuery();
	const {
		data: organizations,
		refetch,
		isLoading,
	} = api.organization.all.useQuery();

	const { mutateAsync: deleteOrganization, isLoading: isRemoving } =
		api.organization.delete.useMutation();

	// const {
	// 	home: filteredHome,
	// 	settings: filteredSettings,
	// 	help,
	// } = createMenuForAuthUser({ auth, isCloud: !!isCloud });

	// const activeItem = findActiveNavItem(
	// 	[...filteredHome, ...filteredSettings],
	// 	pathname,
	// );

	useEffect(() => {
		if (activeOrganization) {
			setActiveTeam(activeOrganization);
		}
	}, [activeOrganization]);

	useEffect(() => {
		setIsLoaded(true);
	}, []);

	if (!isLoaded) {
		return <div className="w-full h-screen bg-background" />; // Placeholder mientras se carga
	}

	return (
		<div className="flex flex-col flex-1 w-full h-full">
			<section className="bg-card py-4 w-full">
				<div className="flex items-center justify-between px-4 w-full">
					{/* Desktop Menu */}
					<nav className="hidden justify-between lg:flex w-full">
						<div className="flex items-center">
							{/* Logo */}
							{/* <a href={logo.url} className="flex items-center gap-2">
			  <img
				src={logo.src}
				className="max-h-8 dark:invert"
				alt={logo.alt}
			  />
			  <span className="text-lg font-semibold tracking-tighter">
				{logo.title}
			  </span>
			</a> */}
							<span>EMPAAS</span>
						</div>

						<div className="flex items-center">
							<NavigationMenu>
								<NavigationMenuList>
									{MENU?.map((item) => renderMenuItem(item, pathname))}
								</NavigationMenuList>
							</NavigationMenu>
						</div>

						<div className="flex gap-2">
							<>
								{isLoading ? (
									<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[5vh] pt-4">
										<Loader2 className="animate-spin size-4" />
									</div>
								) : (
									<>
										{/* Notification Bell */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className={cn(
														"relative",
														"h-8 w-8 p-1.5 mx-auto",
														"!focus:ring-none",
													)}
												>
													<Bell className="size-4" />
													{invitations && invitations.length > 0 && (
														<span className="absolute -top-0 -right-0 flex size-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
															{invitations.length}
														</span>
													)}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												side="bottom"
												align="end"
												sideOffset={4}
												className="w-80"
											>
												<DropdownMenuLabel>
													Pending Invitations
												</DropdownMenuLabel>
												<div className="flex flex-col gap-2">
													{invitations && invitations.length > 0 ? (
														invitations.map((invitation) => (
															<div
																key={invitation.id}
																className="flex flex-col gap-2"
															>
																<DropdownMenuItem
																	className="flex flex-col items-start gap-1 p-3"
																	onSelect={(e) => e.preventDefault()}
																>
																	<div className="font-medium">
																		{invitation?.organization?.name}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		Expires:{" "}
																		{new Date(
																			invitation.expiresAt,
																		).toLocaleString()}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		Role: {invitation.role}
																	</div>
																</DropdownMenuItem>
																<DialogAction
																	title="Accept Invitation"
																	description="Are you sure you want to accept this invitation?"
																	type="default"
																	onClick={async () => {
																		const { error } =
																			await authClient.organization.acceptInvitation(
																				{
																					invitationId: invitation.id,
																				},
																			);

																		if (error) {
																			toast.error(
																				error.message ||
																					"Error accepting invitation",
																			);
																		} else {
																			toast.success(
																				"Invitation accepted successfully",
																			);
																			await refetchInvitations();
																			await refetch();
																		}
																	}}
																>
																	<Button size="sm" variant="secondary">
																		Accept Invitation
																	</Button>
																</DialogAction>
															</div>
														))
													) : (
														<DropdownMenuItem disabled>
															No pending invitations
														</DropdownMenuItem>
													)}
												</div>
											</DropdownMenuContent>
										</DropdownMenu>

										{/* Organization Logo and Selector */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Avatar className="h-8 w-8 rounded-lg cursor-pointer hover:ring-1 hover:ring-primary">
													<AvatarImage
														src={activeOrganization?.logo || ""}
														alt={activeOrganization?.logo || ""}
													/>
													<AvatarFallback className="rounded-lg">
														{getFallbackAvatarInitials(
															activeOrganization?.name,
														)}
													</AvatarFallback>
												</Avatar>
												{/* <Button
									size={"sm"}
									className={cn(
										"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
										// state === "collapsed" &&
										"flex justify-center items-center p-2 h-10 w-10 mx-auto",
									)}
								> */}
												{/* <div
										className={cn(
											"flex items-center gap-2",
											// state === "collapsed" && "justify-center",
										)}
									>
										<div
											className={cn(
												"flex items-center justify-center rounded-sm border",
												"size-6",
											)}
										>
											<Logo
												className={cn(
													"transition-all",
													// state === "collapsed" ? "size-4" : "size-5",
												)}
												logoUrl={activeOrganization?.logo || undefined}
											/>
										</div>
										<div
																className={cn(
												"flex flex-col items-start",
												// state === "collapsed" && "hidden",
											)}
										>
											<p className="text-sm font-medium leading-none">
												{/* {activeOrganization?.name ?? "Select Organization"} */}
												{/* {getFallbackAvatarInitials(activeOrganization?.name)} */}
												{/* </p>
										</div>
									</div>
									<ChevronsUpDown
										className={cn("ml-auto")}
									/> */}
												{/* </Button> */}
											</DropdownMenuTrigger>
											<DropdownMenuContent
												className="rounded-lg"
												side="bottom"
												align="end"
												sideOffset={4}
											>
												<DropdownMenuLabel className="text-xs text-muted-foreground">
													Organizations
												</DropdownMenuLabel>
												{organizations?.map((org) => (
													<div
														className="flex flex-row justify-between"
														key={org.name}
													>
														<DropdownMenuItem
															onClick={async () => {
																await authClient.organization.setActive({
																	organizationId: org.id,
																});
																window.location.reload();
															}}
															className="w-full gap-2 p-2 cursor-pointer"
														>
															<div className="flex flex-col gap-4">
																{org.name}
															</div>
															<div className="flex size-6 items-center justify-center rounded-sm border">
																{/* <Logo
																	className={cn(
																		"transition-all",
																		// state === "collapsed" ? "size-6" : "size-10",
																	)}
																	logoUrl={org.logo ?? undefined}
																/> */}
																<Avatar className="h-8 w-8 rounded-lg">
																	<AvatarImage
																	// src={activeOrganization?.logo || ""}
																	// alt={activeOrganization?.logo || ""}
																	/>
																	<AvatarFallback className="rounded-lg">
																		{getFallbackAvatarInitials(org.name)}
																	</AvatarFallback>
																</Avatar>
															</div>
														</DropdownMenuItem>
														{org.ownerId === session?.user?.id && (
															<div className="flex items-center gap-2">
																<AddOrganization organizationId={org.id} />
																<DialogAction
																	title="Delete Organization"
																	description="Are you sure you want to delete this organization?"
																	type="destructive"
																	onClick={async () => {
																		await deleteOrganization({
																			organizationId: org.id,
																		})
																			.then(() => {
																				refetch();
																				toast.success(
																					"Organization deleted successfully",
																				);
																			})
																			.catch((error) => {
																				toast.error(
																					error?.message ||
																						"Error deleting organization",
																				);
																			});
																	}}
																>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="group hover:bg-red-500/10"
																		isLoading={isRemoving}
																	>
																		<Trash2 className="size-4 text-primary group-hover:text-red-500" />
																	</Button>
																</DialogAction>
															</div>
														)}
													</div>
												))}
												{(user?.role === "owner" || isCloud) && (
													<>
														<DropdownMenuSeparator />
														<AddOrganization />
													</>
												)}
											</DropdownMenuContent>
										</DropdownMenu>

										<UserNav />
									</>
								)}
							</>
						</div>
					</nav>

					{/* Mobile Menu */}
					<div className="block lg:hidden">
						<div className="flex items-center justify-between">
							{/* Logo */}
							{/* <a href={logo.url} className="flex items-center gap-2">
			  <img
				src={logo.src}
				className="max-h-8 dark:invert"
				alt={logo.alt}
			  />
			</a> */}
							<span>EMPAAS</span>
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="outline" size="icon">
										<Menu className="size-4" />
									</Button>
								</SheetTrigger>
								<SheetContent className="overflow-y-auto">
									<SheetHeader>
										<SheetTitle>
											{/* <a href={logo.url} className="flex items-center gap-2">
					  <img
						src={logo.src}
						className="max-h-8 dark:invert"
						alt={logo.alt}
					  />
					</a> */}
											<span>EMPAAS</span>
										</SheetTitle>
									</SheetHeader>
									<div className="flex flex-col gap-6 p-4">
										<Accordion
											type="single"
											collapsible
											className="flex w-full flex-col gap-4"
										>
											{MENU?.map((item) => renderMobileMenuItem(item))}
										</Accordion>

										{/* <div className="flex flex-col gap-3">
					<Button asChild variant="outline">
					  <a href={auth.login.url}>{auth.login.title}</a>
					</Button>
					<Button asChild>
					  <a href={auth.signup.url}>{auth.signup.title}</a>
					</Button>
				  </div> */}
									</div>
								</SheetContent>
							</Sheet>
						</div>
					</div>
				</div>
			</section>
			<div className="p-2 w-full h-full">{children}</div>
		</div>
		// <SidebarProvider
		// 	defaultOpen={defaultOpen}
		// 	open={defaultOpen}
		// 	onOpenChange={(open) => {
		// 		setDefaultOpen(open);

		// 		document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}`;
		// 	}}
		// 	style={
		// 		{
		// 			"--sidebar-width": "19.5rem",
		// 			"--sidebar-width-mobile": "19.5rem",
		// 		} as React.CSSProperties
		// 	}
		// >
		// 	<Sidebar collapsible="icon" variant="floating">
		// 		<SidebarHeader>
		// 			{/* <SidebarMenuButton
		// 				className="group-data-[collapsible=icon]:!p-0"
		// 				size="lg"
		// 			> */}
		// 			<LogoWrapper />
		// 			{/* </SidebarMenuButton> */}
		// 		</SidebarHeader>
		// 		<SidebarContent>
		// 			<SidebarGroup>
		// 				<SidebarGroupLabel>Home</SidebarGroupLabel>
		// 				<SidebarMenu>
		// 					{filteredHome.map((item) => {
		// 						const isSingle = item.isSingle !== false;
		// 						const isActive = isSingle
		// 							? isActiveRoute({ itemUrl: item.url, pathname })
		// 							: item.items.some((item) =>
		// 								isActiveRoute({ itemUrl: item.url, pathname }),
		// 							);

		// 						return (
		// 							<Collapsible
		// 								key={item.title}
		// 								asChild
		// 								defaultOpen={isActive}
		// 								className="group/collapsible"
		// 							>
		// 								<SidebarMenuItem>
		// 									{isSingle ? (
		// 										<SidebarMenuButton
		// 											asChild
		// 											tooltip={item.title}
		// 											className={cn(isActive && "bg-border")}
		// 										>
		// 											<Link
		// 												href={item.url}
		// 												className="flex w-full items-center gap-2"
		// 											>
		// 												{item.icon && (
		// 													<item.icon
		// 														className={cn(isActive && "text-primary")}
		// 													/>
		// 												)}
		// 												<span>{item.title}</span>
		// 											</Link>
		// 										</SidebarMenuButton>
		// 									) : (
		// 										<>
		// 											<CollapsibleTrigger asChild>
		// 												<SidebarMenuButton
		// 													tooltip={item.title}
		// 													isActive={isActive}
		// 												>
		// 													{item.icon && <item.icon />}

		// 													<span>{item.title}</span>
		// 													{item.items?.length && (
		// 														<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
		// 													)}
		// 												</SidebarMenuButton>
		// 											</CollapsibleTrigger>
		// 											<CollapsibleContent>
		// 												<SidebarMenuSub>
		// 													{item.items?.map((subItem) => (
		// 														<SidebarMenuSubItem key={subItem.title}>
		// 															<SidebarMenuSubButton
		// 																asChild
		// 																className={cn(isActive && "bg-border")}
		// 															>
		// 																<Link
		// 																	href={subItem.url}
		// 																	className="flex w-full items-center"
		// 																>
		// 																	{subItem.icon && (
		// 																		<span className="mr-2">
		// 																			<subItem.icon
		// 																				className={cn(
		// 																					"h-4 w-4 text-muted-foreground",
		// 																					isActive && "text-primary",
		// 																				)}
		// 																			/>
		// 																		</span>
		// 																	)}
		// 																	<span>{subItem.title}</span>
		// 																</Link>
		// 															</SidebarMenuSubButton>
		// 														</SidebarMenuSubItem>
		// 													))}
		// 												</SidebarMenuSub>
		// 											</CollapsibleContent>
		// 										</>
		// 									)}
		// 								</SidebarMenuItem>
		// 							</Collapsible>
		// 						);
		// 					})}
		// 				</SidebarMenu>
		// 			</SidebarGroup>
		// 			<SidebarGroup>
		// 				<SidebarGroupLabel>Settings</SidebarGroupLabel>
		// 				<SidebarMenu className="gap-1">
		// 					{filteredSettings.map((item) => {
		// 						const isSingle = item.isSingle !== false;
		// 						const isActive = isSingle
		// 							? isActiveRoute({ itemUrl: item.url, pathname })
		// 							: item.items.some((item) =>
		// 								isActiveRoute({ itemUrl: item.url, pathname }),
		// 							);

		// 						return (
		// 							<Collapsible
		// 								key={item.title}
		// 								asChild
		// 								defaultOpen={isActive}
		// 								className="group/collapsible"
		// 							>
		// 								<SidebarMenuItem>
		// 									{isSingle ? (
		// 										<SidebarMenuButton
		// 											asChild
		// 											tooltip={item.title}
		// 											className={cn(isActive && "bg-border")}
		// 										>
		// 											<Link
		// 												href={item.url}
		// 												className="flex w-full items-center gap-2"
		// 											>
		// 												{item.icon && (
		// 													<item.icon
		// 														className={cn(isActive && "text-primary")}
		// 													/>
		// 												)}
		// 												<span>{item.title}</span>
		// 											</Link>
		// 										</SidebarMenuButton>
		// 									) : (
		// 										<>
		// 											<CollapsibleTrigger asChild>
		// 												<SidebarMenuButton
		// 													tooltip={item.title}
		// 													isActive={isActive}
		// 												>
		// 													{item.icon && <item.icon />}

		// 													<span>{item.title}</span>
		// 													{item.items?.length && (
		// 														<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
		// 													)}
		// 												</SidebarMenuButton>
		// 											</CollapsibleTrigger>
		// 											<CollapsibleContent>
		// 												<SidebarMenuSub>
		// 													{item.items?.map((subItem) => (
		// 														<SidebarMenuSubItem key={subItem.title}>
		// 															<SidebarMenuSubButton
		// 																asChild
		// 																className={cn(isActive && "bg-border")}
		// 															>
		// 																<Link
		// 																	href={subItem.url}
		// 																	className="flex w-full items-center"
		// 																>
		// 																	{subItem.icon && (
		// 																		<span className="mr-2">
		// 																			<subItem.icon
		// 																				className={cn(
		// 																					"h-4 w-4 text-muted-foreground",
		// 																					isActive && "text-primary",
		// 																				)}
		// 																			/>
		// 																		</span>
		// 																	)}
		// 																	<span>{subItem.title}</span>
		// 																</Link>
		// 															</SidebarMenuSubButton>
		// 														</SidebarMenuSubItem>
		// 													))}
		// 												</SidebarMenuSub>
		// 											</CollapsibleContent>
		// 										</>
		// 									)}
		// 								</SidebarMenuItem>
		// 							</Collapsible>
		// 						);
		// 					})}
		// 				</SidebarMenu>
		// 			</SidebarGroup>
		// 			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
		// 				<SidebarGroupLabel>Extra</SidebarGroupLabel>
		// 				<SidebarMenu>
		// 					{help.map((item: ExternalLink) => (
		// 						<SidebarMenuItem key={item.name}>
		// 							<SidebarMenuButton asChild>
		// 								<a
		// 									href={item.url}
		// 									target="_blank"
		// 									rel="noopener noreferrer"
		// 									className="flex w-full items-center gap-2"
		// 								>
		// 									<span className="mr-2">
		// 										<item.icon className="h-4 w-4" />
		// 									</span>
		// 									<span>{item.name}</span>
		// 								</a>
		// 							</SidebarMenuButton>
		// 						</SidebarMenuItem>
		// 					))}
		// 				</SidebarMenu>
		// 			</SidebarGroup>
		// 		</SidebarContent>
		// 		<SidebarFooter>
		// 			<SidebarMenu className="flex flex-col gap-2">
		// 				{!isCloud && auth?.role === "owner" && (
		// 					<SidebarMenuItem>
		// 						<UpdateServerButton />
		// 					</SidebarMenuItem>
		// 				)}
		// 				<SidebarMenuItem>
		// 					<UserNav />
		// 				</SidebarMenuItem>
		// 				{empaasVersion && (
		// 					<>
		// 						<div className="px-3 text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
		// 							Version {empaasVersion}
		// 						</div>
		// 						<div className="hidden text-xs text-muted-foreground text-center group-data-[collapsible=icon]:block">
		// 							{empaasVersion}
		// 						</div>
		// 					</>
		// 				)}
		// 			</SidebarMenu>
		// 		</SidebarFooter>
		// 		<SidebarRail />
		// 	</Sidebar>
		// 	<SidebarInset>
		// 		{!includesProjects && (
		// 			<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
		// 				<div className="flex items-center justify-between w-full px-4">
		// 					<div className="flex items-center gap-2">
		// 						<SidebarTrigger className="-ml-1" />
		// 						<Separator orientation="vertical" className="mr-2 h-4" />
		// 						<Breadcrumb>
		// 							<BreadcrumbList>
		// 								<BreadcrumbItem className="block">
		// 									<BreadcrumbLink asChild>
		// 										<Link
		// 											href={activeItem?.url || "/"}
		// 											className="flex items-center gap-1.5"
		// 										>
		// 											{activeItem?.title}
		// 										</Link>
		// 									</BreadcrumbLink>
		// 								</BreadcrumbItem>
		// 							</BreadcrumbList>
		// 						</Breadcrumb>
		// 					</div>
		// 				</div>
		// 			</header>
		// 		)}

		// 		<div className="flex flex-col w-full p-4 pt-0">{children}</div>
		// 	</SidebarInset>
		// </SidebarProvider>
	);
}

// The types of the queries we are going to use
type AuthQueryOutput = inferRouterOutputs<AppRouter>["user"]["get"];

type SingleNavItem = {
	isSingle?: true;
	title: string;
	url: string;
	icon?: LucideIcon;
	isEnabled?: (opts: { auth?: AuthQueryOutput; isCloud: boolean }) => boolean;
};

// NavItem type
// Consists of a single item or a group of items
// If `isSingle` is true or undefined, the item is a single item
// If `isSingle` is false, the item is a group of items
export type NavItem = SingleNavItem;

const renderMenuItem = (item: NavItem, pathname: string) => {
	return (
		<NavigationMenuItem key={item.title}>
			<NavigationMenuLink
				href={item.url}
				className={`inline-flex items-center gap-1.5 hover:text-primary group h-8 w-max justify-center rounded-md p-2 text-sm font-medium transition-colors ${isActiveRoute({ itemUrl: item.url, pathname }) ? "text-primary" : "text-base"}`}
			>
				{item.icon && <item.icon className="size-4" />}
				{item.title}
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
};

const renderMobileMenuItem = (item: NavItem) => {
	return (
		<a key={item.title} href={item.url} className="text-md font-semibold">
			{item.title}
		</a>
	);
};
