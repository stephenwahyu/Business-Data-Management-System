import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Cell,
  ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const StatusOverviewChart = ({ data }) => {
  const [chartColors, setChartColors] = useState({});

  // Get CSS variables for chart colors
  useEffect(() => {
    const colors = {
      'BARU': 'var(--chart-5)',
      'AKTIF': 'var(--chart-1)',
      'TIDAK AKTIF': 'var(--chart-2)',
      'TIDAK DITEMUKAN': 'var(--chart-3)',
      'BELUM DIATUR': 'var(--chart-4)',
      'default': 'var(--chart-4)'
    };
    
    setChartColors(colors);
  }, []);
  
  // Process and ensure all statuses are properly handled
  const processedData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0 || Object.keys(chartColors).length === 0) {
      return [];
    }
    
    return data.data.map(item => ({
      name: item.name,
      status: item.status,
      value: item.value,
      fill: chartColors[item.status] || chartColors['default'],
      percentage: 0 // Will be calculated below
    })).sort((a, b) => b.value - a.value);
  }, [data, chartColors]);

  // Calculate percentages and total
  const { dataWithPercentages, total } = useMemo(() => {
    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentages = processedData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100) : 0
    }));
    
    return { dataWithPercentages, total };
  }, [processedData]);
  
  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    const config = {};
    if (dataWithPercentages.length > 0) {
      dataWithPercentages.forEach((item) => {
        config[item.name] = {
          label: item.name,
          color: item.fill,
        };
      });
    }
    return config;
  }, [dataWithPercentages]);

  // Custom Legend Component
  const Legend = () => (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>Status Distribution</span>
        <span className="font-medium">{total.toLocaleString()} total places</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {dataWithPercentages.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Badge variant="secondary" className="text-xs">
                {item.percentage.toFixed(1)}%
              </Badge>
              <span className="text-sm font-semibold text-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Early return for loading or empty states
  if (!data || !data.data || data.data.length === 0 || dataWithPercentages.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
          <CardDescription>Places by operational status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Status Overview</CardTitle>
        <CardDescription>Places by operational status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={dataWithPercentages}
                layout="vertical"
                margin={{
                  left: 0,
                  top: 8,
                  bottom: 0,
                  right: 16
                }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={80}
                  className="text-xs"
                  tickFormatter={(value) => 
                    value.length > 10
                      ? `${value.substring(0, 10)}...` 
                      : value
                  }
                />
                <XAxis 
                  dataKey="value" 
                  type="number" 
                  hide 
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent 
                      hideLabel 
                      formatter={(value, name, props) => [
                        `${value.toLocaleString()} places (${props.payload.percentage.toFixed(1)}%) `,
                        props.payload.name
                      ]}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  layout="vertical" 
                  radius={[0, 4, 4, 0]} 
                  className="transition-all duration-200 hover:opacity-80"
                >
                  {dataWithPercentages.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex-shrink-0">
          <Legend />
        </div>
      </CardContent>
    </Card>
  );
};

StatusOverviewChart.displayName = 'StatusOverviewChart';

export default StatusOverviewChart;