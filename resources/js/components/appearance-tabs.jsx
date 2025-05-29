import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }) {
    const { appearance, updateAppearance } = useAppearance();
    const [mounted, setMounted] = useState(false);

    // Only show the toggle after component mounts to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const tabs = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    // Avoid hydration mismatch by rendering a placeholder with the same dimensions
    if (!mounted) {
        return <div className={cn('inline-flex gap-1 rounded-lg bg-neutral-100 p-1 invisible', className)} {...props} />;
    }

    return (
        <div 
            className={cn('inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800', className)} 
            {...props}
            role="tablist"
            aria-label="Appearance options"
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                        appearance === value
                            ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                    role="tab"
                    aria-selected={appearance === value}
                    aria-controls={`appearance-${value}`}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm font-medium">{label}</span>
                </button>
            ))}
        </div>
    );
}