import { useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Plus, Clock, TrendingUp, TrendingDown } from "lucide-react";

// Trend badge component
const TrendBadge = ({ trend }) => {
    if (trend === undefined || trend === null) return null;
    
    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const badgeVariant = isPositive ? "success" : "destructive";
    
    return (
        <Badge 
            variant={badgeVariant} 
            className="flex gap-1 text-xs"
            aria-label={`${isPositive ? 'Positive' : 'Negative'} trend of ${Math.abs(trend)}%`}
        >
            <TrendIcon className="size-3" aria-hidden="true" />
            {isPositive ? '+' : ''}{trend}%
        </Badge>
    );
};

// Stat card component
const StatCard = ({ title, value, trend, description, icon: Icon, loading, timeRange }) => (
    <Card>
        <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                <CardDescription>{title}</CardDescription>
            </div>
            {loading ? (
                <Skeleton className="h-8 w-32" />
            ) : (
                <CardTitle className="text-2xl md:text-3xl font-semibold tabular-nums">
                    {value}
                </CardTitle>
            )}
            <div className="absolute right-4 top-4">
                {loading ? (
                    <Skeleton className="h-5 w-16" />
                ) : trend !== undefined && (
                    <TrendBadge trend={trend} />
                )}
            </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs text-muted-foreground">
            <div className="line-clamp-1 flex gap-1 font-medium">
                {description}
            </div>
            <div>
                {timeRange === "7d" 
                    ? "Last 7 days" 
                    : timeRange === "30d" 
                        ? "Last 30 days" 
                        : timeRange === "3d"
                            ? "Last 3 days"
                            : "Last 3 months"}
            </div>
        </CardFooter>
    </Card>
);

// Main component - updated to receive props from parent
export default function PlacesOverviewCards({ 
    statistics, 
    currentTimeRange, 
    onTimeRangeChange, 
    isLoading 
}) {
    // Get current stats from the time range object
    // This now handles the restructured statistics format from the backend
    const currentStats = statistics && statistics[currentTimeRange] || {};
    const loading = !statistics || !statistics[currentTimeRange] || isLoading;
    
    // Generate appropriate descriptions based on trends
    const getTotalDescription = (trend) => {
        if (!trend) return "No change in place count";
        return trend > 0 ? "Trending up this period" : "Trending down this period";
    };
    
    const getNewDescription = (trend) => {
        if (!trend) return "Stable addition rate";
        return trend > 0 ? "Growth in new additions" : "Slowdown in new places";
    };
    
    const getUpdatedDescription = (trend) => {
        if (!trend) return "Consistent update activity";
        return trend > 0 ? "More update activity" : "Less update activity";
    };
    
    const getGrowthDescription = (rate, trend) => {
        if (rate <= 0) return "No growth this period";
        if (!trend) return "Steady growth performance";
        return trend > 0 ? "Improving growth rate" : "Declining growth rate";
    };
    
    // Use the centralized handler
    const handleTimeRangeChange = useCallback((value) => {
        if (value) {
            onTimeRangeChange(value);
        }
    }, [onTimeRangeChange]);

    return (
        <div className="grid gap-4 animate-in fade-in duration-300">
            <Card>
                <CardHeader className="relative pb-4">
                    <CardTitle>Places Overview</CardTitle>
                    <CardDescription>
                        Track total, new, updated, and growth metrics
                    </CardDescription>
                    <div className="sm:absolute right-4 top-4 mt-2 sm:mt-0">
                        {/* Time range toggle for desktop */}
                        <ToggleGroup
                            type="single"
                            value={currentTimeRange}
                            onValueChange={handleTimeRangeChange}
                            variant="outline"
                            className="hidden sm:flex"
                            disabled={isLoading}
                            aria-label="Select time range"
                        >
                            <ToggleGroupItem value="90d" className="h-8 px-2.5">
                                Last 3 months
                            </ToggleGroupItem>
                            <ToggleGroupItem value="30d" className="h-8 px-2.5">
                                Last 30 days
                            </ToggleGroupItem>
                            <ToggleGroupItem value="7d" className="h-8 px-2.5">
                                Last 7 days
                            </ToggleGroupItem>
                            <ToggleGroupItem value="3d" className="h-8 px-2.5">
                                Last 3 days
                            </ToggleGroupItem>
                        </ToggleGroup>
                        
                        {/* Time range dropdown for mobile */}
                        <Select 
                            value={currentTimeRange} 
                            onValueChange={handleTimeRangeChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger
                                className="flex sm:hidden"
                                aria-label="Select time range"
                            >
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="90d">Last 3 months</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="3d">Last 3 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            title="Total Places" 
                            value={currentStats.totalPlaces || 0} 
                            trend={currentStats.totalTrend} 
                            description={getTotalDescription(currentStats.totalTrend)} 
                            icon={Building}
                            loading={loading}
                            timeRange={currentTimeRange}
                        />
                        
                        <StatCard 
                            title="New Places" 
                            value={currentStats.newPlaces || 0} 
                            trend={currentStats.newTrend} 
                            description={getNewDescription(currentStats.newTrend)} 
                            icon={Plus}
                            loading={loading}
                            timeRange={currentTimeRange}
                        />
                        
                        <StatCard 
                            title="Updated Places" 
                            value={currentStats.updatedPlaces || 0} 
                            trend={currentStats.updatedTrend} 
                            description={getUpdatedDescription(currentStats.updatedTrend)} 
                            icon={Clock}
                            loading={loading}
                            timeRange={currentTimeRange}
                        />
                        
                        <StatCard 
                            title="Growth Rate" 
                            value={`${currentStats.growthRate || 0}%`} 
                            trend={currentStats.growthTrend}
                            description={getGrowthDescription(currentStats.growthRate, currentStats.growthTrend)} 
                            icon={TrendingUp}
                            loading={loading}
                            timeRange={currentTimeRange}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}