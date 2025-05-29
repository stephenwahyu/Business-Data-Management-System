import { Head, usePage, router } from "@inertiajs/react";
import { useState, useCallback } from "react";
import AppLayout from "@/layouts/app-layout";
import PlacesOverviewCards from "./dashboard-places-card";
import CategoryDistributionChart from "./dashboard-category-chart";
import StatusOverviewChart from "./dashboard-status-chart";
import UserProgressChart from "./dashboard-user-progress";

export default function Dashboard() {
  const { 
    statistics, 
    currentTimeRange: initialTimeRange, 
    categoryDistribution, 
    statusOverview,
    userProgress
  } = usePage().props;
  
  // Lift state to parent component
  const [timeRange, setTimeRange] = useState(initialTimeRange || "30d");
  const [isLoading, setIsLoading] = useState(false);

  // Single handler for time range changes that updates all components
  const handleTimeRangeChange = useCallback((value) => {
    if (value && value !== timeRange) {
      setTimeRange(value);
      setIsLoading(true);
      
      // Make a single request to update all data
      router.visit('/dashboard', {
        method: 'get',
        data: { 
          timeRange: value,
          userId: userProgress?.currentUserId
        },
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsLoading(false), // Using onFinish instead of separate success/error
      });
      
      // Update URL with parameters
      const url = new URL(window.location);
      url.searchParams.set('timeRange', value);
      if (userProgress?.currentUserId) {
        url.searchParams.set('userId', userProgress.currentUserId);
      }
      window.history.replaceState({}, '', url);
    }
  }, [timeRange, userProgress?.currentUserId]);

  return (
    <AppLayout>
      <Head title="Dashboard" />
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Places Overview Statistics Cards */}
        <PlacesOverviewCards 
          statistics={statistics} 
          currentTimeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={isLoading}
        />
        
        {/* User Progress Timeline */}
        <UserProgressChart 
          data={userProgress} 
          currentTimeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={isLoading}
        />
        
        {/* Charts Row - Distribution & Status */}
        <div className="grid gap-6 md:grid-cols-2">
          <CategoryDistributionChart data={categoryDistribution} />
          <StatusOverviewChart data={statusOverview} />
        </div>
      </div>
    </AppLayout>
  );
}