import * as React from "react";
import {
    BarChart2Icon,
    BarChart3Icon,
    BookOpen,
    Bot,
    DatabaseIcon,
    LayoutDashboardIcon,
    ListX,
    LucideMapPinHouse,
    Map,
    Settings2,
    SettingsIcon,
    UserCogIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { usePage } from "@inertiajs/react";

// Define navigation items outside component to prevent recreation
const ALL_NAV_MAIN = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Map",
        url: "/map",
        icon: Map,
    },
    {
        title: "Data Places",
        url: "/places",
        icon: DatabaseIcon,
        items: [
            {
                title: "History",
                url: "/places/history",
            },
        ],
    },
];

const ALL_PROJECTS = [
    {
        name: "Manage Users",
        url: "/users",
        icon: UserCogIcon,
    },
];

const NAV_SECONDARY = [
    {
        title: "Settings",
        url: "/settings",
        icon: SettingsIcon,
    },
];

export function AppSidebar(props) {
    const { auth, url } = usePage().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : url || '';
    
    // Function to check if a route is active
    const isActive = React.useCallback((itemUrl) => {
        if (!currentPath || !itemUrl) return false;
        
        // Exact match for root paths
        if (itemUrl === currentPath) return true;
        
        // For nested routes, check if current path starts with the item URL
        // but make sure we're not matching partial segments
        if (currentPath.startsWith(itemUrl) && currentPath !== '/') {
            const nextChar = currentPath[itemUrl.length];
            return nextChar === '/' || nextChar === undefined;
        }
        
        return false;
    }, [currentPath]);
    
    // Memoize navigation data based on role and current path
    const navigationData = React.useMemo(() => {
        const roleId = auth?.user?.role_id;
        let navMain = [];
        let projects = [];

        if (roleId === 1) {
            // Admin - add isActive property to each item
            navMain = ALL_NAV_MAIN.map(item => ({
                ...item,
                isActive: isActive(item.url),
                items: item.items?.map(subItem => ({
                    ...subItem,
                    isActive: isActive(subItem.url)
                }))
            }));
            projects = ALL_PROJECTS.map(project => ({
                ...project,
                isActive: isActive(project.url)
            }));
        } else if (roleId === 2) {
            // Manager
            navMain = ALL_NAV_MAIN.map(item => ({
                ...item,
                isActive: isActive(item.url),
                items: item.items?.map(subItem => ({
                    ...subItem,
                    isActive: isActive(subItem.url)
                }))
            }));
        } else if (roleId === 3) {
            // Viewer - Fixed the filter logic
            navMain = ALL_NAV_MAIN
                .filter(item => item.url === "/dashboard" || item.url === "/map")
                .map(item => ({
                    ...item,
                    isActive: isActive(item.url)
                }));
        }

        return {
            user: {
                name: auth?.user?.name || "User",
                email: auth?.user?.email || "no-email@example.com",
                avatar: "/avatars/default.jpg",
            },
            navMain,
            navSecondary: NAV_SECONDARY.map(item => ({
                ...item,
                isActive: isActive(item.url)
            })),
            projects,
        };
    }, [auth?.user?.role_id, auth?.user?.name, auth?.user?.email, isActive]);

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <LucideMapPinHouse className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        Badan Pusat Statistik
                                    </span>
                                    <span className="truncate text-xs">
                                        Enterprise
                                    </span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navigationData.navMain} />
                {navigationData.projects?.length > 0 && (
                    <NavProjects projects={navigationData.projects} />
                )}
                <NavSecondary items={navigationData.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={navigationData.user} />
            </SidebarFooter>
        </Sidebar>
    );
}