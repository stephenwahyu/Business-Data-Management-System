import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";

const sidebarNavItems = [
    {
        title: 'Profile',
        href: '/settings/profile',
    },
    {
        title: 'Password',
        href: '/settings/password',
    },
    {
      title: 'Appearance',
      href: '/settings/appearance',
      icon: null,
  },
];

export default function SettingsLayout({ children }) {
    const { url } = usePage();
    
    return (
        <AppLayout>
            <Heading 
                title="Settings" 
                description="Manage your profile and account settings" 
            />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full lg:w-48">
                    <nav className="flex flex-col space-y-1">
                        {sidebarNavItems.map((item) => (
                            <Button
                                key={item.href}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'w-full justify-start',
                                    url === item.href && 'bg-muted'
                                )}
                            >
                                <Link href={item.href}>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 max-w-2xl">
                    {children}
                </div>
            </div>
        </AppLayout>
    );
}