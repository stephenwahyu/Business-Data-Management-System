import React, { useState, useCallback, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AlertCircle, Users, TrendingUp, TrendingDown, Calendar, LockIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground p-3 rounded-md shadow-md border text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.name === "created" ? "Added: " : "Updated: "}
              <span className="font-medium">{entry.value}</span>
              {entry.value === 1 ? " place" : " places"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Trend badge component - reused for consistency
const TrendBadge = ({ trend, label }) => {
  if (trend === undefined || trend === null) return null;
  
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const badgeVariant = isPositive ? "success" : "destructive";
  
  return (
    <Badge 
      variant={badgeVariant} 
      className="flex gap-1 text-xs whitespace-nowrap"
      aria-label={`${isPositive ? 'Positive' : 'Negative'} trend of ${Math.abs(trend)}%`}
    >
      <TrendIcon className="size-3 flex-shrink-0" aria-hidden="true" />
      {isPositive ? '+' : ''}{trend}%
      {label && <span className="ml-1 text-xs opacity-80 hidden sm:inline">({label})</span>}
    </Badge>
  );
};

// Time range options
const TIME_RANGE_OPTIONS = [
  { value: "3d", label: "Last 3 days", shortLabel: "3d" },
  { value: "7d", label: "Last 7 days", shortLabel: "7d" },
  { value: "30d", label: "Last 30 days", shortLabel: "30d" },
  { value: "90d", label: "Last 3 months", shortLabel: "90d" }
];

export default function UserProgressChart({ 
  data, 
  currentTimeRange, 
  onTimeRangeChange, 
  isLoading: parentIsLoading 
}) {
  const [selectedUserId, setSelectedUserId] = useState(data?.currentUserId || null);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [hasActivity, setHasActivity] = useState(true);
  // Extract the permission flag from data - using the explicit flag from backend
  const canViewOtherUsers = Boolean(data?.canViewOtherUsers);
  
  // Combined loading state
  const isLoading = parentIsLoading || localIsLoading;

  // Calculate activity totals for summary
  const activitySummary = data?.timelineData?.reduce((totals, day) => ({
    created: totals.created + day.created,
    updated: totals.updated + day.updated
  }), { created: 0, updated: 0 }) || { created: 0, updated: 0 };

  // Check if there's any activity data
  useEffect(() => {
    if (data?.timelineData) {
      const hasAnyActivity = data.timelineData.some(
        (day) => day.created > 0 || day.updated > 0
      );
      setHasActivity(hasAnyActivity);
    }
  }, [data]);

  // Handle user selection change - only update user, not time range
  const handleUserChange = useCallback((userId) => {
    if (userId && userId !== selectedUserId && canViewOtherUsers) {
      setSelectedUserId(userId);
      setLocalIsLoading(true);

      router.visit("/dashboard", {
        method: "get",
        data: { 
          timeRange: currentTimeRange, 
          userId: userId 
        },
        preserveState: true,
        preserveScroll: true,
        only: ["userProgress"],
        onSuccess: () => {
          setLocalIsLoading(false);
        },
        onError: () => {
          setLocalIsLoading(false);
        },
      });
    }
  }, [selectedUserId, currentTimeRange, canViewOtherUsers]);

  // Find current user name
  const currentUserName = data?.users?.find(u => u.id.toString() === selectedUserId?.toString())?.name || "Current User";

  // Format time range for display
  const timeRangeOption = TIME_RANGE_OPTIONS.find(option => option.value === currentTimeRange);
  const timeRangeLabel = timeRangeOption?.label || "Last 30 days";

  // Format the timeline data for the chart
  const chartData = data?.timelineData || [];

  // Determine max value for Y axis scaling
  const maxValue = chartData.length
    ? Math.max(...chartData.map((item) => Math.max(item.created, item.updated)))
    : 10;

  const yMaxValue = maxValue < 5 ? 5 : maxValue; // Set minimum of 5 for better visualization

  // Calculate activity trend
  const activityTrend = data?.activityTrends?.totalTrend || 0;

  // Sync component state with props when they change
  useEffect(() => {
    if (data?.currentUserId && data.currentUserId !== selectedUserId) {
      setSelectedUserId(data.currentUserId);
    }
  }, [data?.currentUserId]);

  return (
    <Card className="w-full animate-in fade-in duration-300">
      <CardHeader className="pb-4 space-y-4">
        {/* Title and Description */}
        <div className="flex items-start gap-3">
          <Users className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold">User Progress Timeline</CardTitle>
            <CardDescription className="text-sm mt-1">
              Track place creation and update activity over time
            </CardDescription>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          {/* Time Range Selector */}
          <div className="flex-1 sm:flex-none">
            <Select
              value={currentTimeRange}
              onValueChange={onTimeRangeChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full" aria-label="Select time range">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="size-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    <span className="sm:hidden">{timeRangeOption?.shortLabel}</span>
                    <span className="hidden sm:inline">{timeRangeOption?.label}</span>
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* User Selector */}
          <div className="flex-1 sm:flex-none">
            {canViewOtherUsers ? (
              <Select
                value={selectedUserId?.toString()}
                onValueChange={handleUserChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full" aria-label="Select user">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="size-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {data?.users?.find(u => u.id.toString() === selectedUserId?.toString())?.name || "Select user"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {data?.users?.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground w-full sm:w-[180px]">
                <LockIcon className="size-4 mr-2 flex-shrink-0" />
                <span className="text-sm truncate">Your Activity Only</span>
              </div>
            )}
          </div>
          
          {/* Trend Badge - Show on larger screens or when space allows */}
          {!isLoading && hasActivity && activityTrend !== 0 && (
            <div className="sm:flex hidden justify-end sm:justify-start sm:ml-auto">
              <TrendBadge trend={activityTrend} label="activity" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        {/* Activity Summary - Mobile Optimized */}
        {!isLoading && hasActivity && (
          <div className="mb-6">
            {/* Mobile: Stack vertically */}
            <div className="grid grid-cols-2 sm:hidden gap-4 mb-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">User</span>
                <span className="font-medium text-sm truncate block">{currentUserName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Period</span>
                <span className="font-medium text-sm">{timeRangeOption?.shortLabel}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Added</span>
                <span className="font-medium text-sm">{activitySummary.created}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Updated</span>
                <span className="font-medium text-sm">{activitySummary.updated}</span>
              </div>
            </div>
            
            {/* Tablet/Desktop: Horizontal layout */}
            <div className="hidden sm:flex flex-wrap gap-x-6 gap-y-3 items-center">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">User</span>
                <span className="font-medium">{currentUserName}</span>
              </div>
              <div className="w-px h-8 bg-border hidden lg:block" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Places Added</span>
                <span className="font-medium">{activitySummary.created}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Places Updated</span>
                <span className="font-medium">{activitySummary.updated}</span>
              </div>
              <div className="w-px h-8 bg-border hidden lg:block" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Time Period</span>
                <span className="font-medium">{timeRangeLabel}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Chart Container */}
        {isLoading ? (
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <Skeleton className="w-full h-full rounded-md" />
          </div>
        ) : !hasActivity ? (
          <Alert variant="default" className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <AlertDescription>
                <div className="font-medium w-full">No activity data available</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Try selecting a different {canViewOtherUsers ? "user or " : ""}time range.
                </div>
              </AlertDescription>
            </div>
          </Alert>
        ) : (
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={5}
                  interval={currentTimeRange === "7d" ? 0 : "preserveStartEnd"}
                  angle={window.innerWidth < 640 ? -45 : 0}
                  textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                  height={window.innerWidth < 640 ? 60 : 30}
                />
                <YAxis
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  domain={[0, yMaxValue]}
                  allowDecimals={false}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) =>
                    value === "created" ? "Places Added" : "Places Updated"
                  }
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <ReferenceLine
                  y={0}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="created"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="updated"
                  name="updated"
                  stroke="var(--chart-5)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-5)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}