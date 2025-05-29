import { Fragment, useEffect, useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function AppLayout({ children }) {
    const [pathname, setPathname] = useState(window.location.pathname);

    // Memoize breadcrumbs to prevent unnecessary recalculations
    const breadcrumbs = useMemo(() => {
        const pathArray = pathname
            .split("/")
            .filter((segment) => segment);

        return pathArray.map((segment, index) => {
            const path = "/" + pathArray.slice(0, index + 1).join("/");
            const formattedName = segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());
            return { name: formattedName, path };
        });
    }, [pathname]);

    // Only update pathname when it actually changes
    useEffect(() => {
        const handleLocationChange = () => {
            const newPathname = window.location.pathname;
            if (newPathname !== pathname) {
                setPathname(newPathname);
            }
        };

        // Listen for navigation changes (if using a router that doesn't trigger popstate)
        window.addEventListener('popstate', handleLocationChange);
        
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, [pathname]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((breadcrumb, index) => (
                                    <Fragment key={breadcrumb.path}>
                                        <BreadcrumbItem>
                                            {index !== breadcrumbs.length - 1 ? (
                                                <BreadcrumbLink href={breadcrumb.path}>
                                                    {breadcrumb.name}
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                        {index !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                    </Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Toaster richColors position="top-right" />
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}