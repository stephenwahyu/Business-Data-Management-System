import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Sector, ResponsiveContainer, Tooltip } from "recharts";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Category options
const CATEGORY_OPTIONS = [
  { value: "A", label: "Pertanian, Kehutanan dan Perikanan" },
  { value: "B", label: "Pertambangan dan Penggalian" },
  { value: "C", label: "Industri Pengolahan" },
  { value: "D", label: "Pengadaan Listrik, Gas, Uap/Air Panas Dan Udara Dingin" },
  { value: "E", label: "Treatment Air, Treatment Air Limbah, Treatment dan Pemulihan Material Sampah, dan Aktivitas Remediasi" },
  { value: "F", label: "Konstruksi" },
  { value: "G", label: "Perdagangan Besar Dan Eceran; Reparasi Dan Perawatan Mobil Dan Sepeda Motor" },
  { value: "H", label: "Pengangkutan dan Pergudangan" },
  { value: "I", label: "Penyediaan Akomodasi Dan Penyediaan Makan Minum" },
  { value: "J", label: "Informasi Dan Komunikasi" },
  { value: "K", label: "Aktivitas Keuangan dan Asuransi" },
  { value: "L", label: "Real Estat" },
  { value: "M", label: "Aktivitas Profesional, Ilmiah Dan Teknis" },
  { value: "N", label: "Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya" },
  { value: "O", label: "Administrasi Pemerintahan, Pertahanan Dan Jaminan Sosial Wajib" },
  { value: "P", label: "Pendidikan" },
  { value: "Q", label: "Aktivitas Kesehatan Manusia Dan Aktivitas Sosial" },
  { value: "R", label: "Kesenian, Hiburan Dan Rekreasi" },
  { value: "S", label: "Aktivitas Jasa Lainnya" },
  { value: "T", label: "Aktivitas Rumah Tangga Sebagai Pemberi Kerja; Aktivitas Yang Menghasilkan Barang Dan Jasa Oleh Rumah Tangga yang Digunakan untuk Memenuhi Kebutuhan Sendiri" },
  { value: "U", label: "Aktivitas Badan Internasional Dan Badan Ekstra Internasional Lainnya" },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, percentage } = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground p-2 rounded-md shadow-md border text-sm">
        <p className="font-medium">{name}</p>
        <p><span className="font-semibold">{value.toLocaleString()}</span> places</p>
        <p className="text-xs text-muted-foreground">{percentage}% of total</p>
      </div>
    );
  }
  return null;
};

// Main chart component
const CategoryDistributionChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartColors, setChartColors] = useState([]);
  
  // Get CSS variables for chart colors
  useEffect(() => {
    const chartColors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ].map(color => color.trim()); // Remove any extra whitespace around the colors
    setChartColors(chartColors);
  }, []);

  // Process data with memoization
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || chartColors.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return data.map((item, index) => {
      const categoryLabel = CATEGORY_OPTIONS.find(cat => cat.value === item.name)?.label || item.name;
      return {
        ...item,
        name: categoryLabel,
        label: categoryLabel,
        percentage: ((item.value / total) * 100).toFixed(1),
        fill: chartColors[index % chartColors.length]
      };
    });
  }, [data, chartColors]);

  // Handle mouse enter for active slice
  const handleMouseEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  // Loading state
  if (!data || data.length === 0 || processedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Distribution of places by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="relative justify-between space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Distribution of places by category</CardDescription>
        </div>
        <div className="sm:absolute right-4 top-4 mt-2 sm:mt-0">
          <Select 
            value={processedData[activeIndex]?.name} 
            onValueChange={(value) => {
              const newIndex = processedData.findIndex(item => item.name === value);
              if (newIndex >= 0) setActiveIndex(newIndex);
            }}
          >
            <SelectTrigger 
              className="h-8 w-[200px] rounded-lg"
              aria-label="Select a category"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {processedData.map((item) => (
                <SelectItem
                  key={item.name}
                  value={item.name}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.fill }}
                    />
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {item.label.length > 35
                              ? `${item.label.substring(0, 35)}...`
                              : item.label}
                          </span>
                        </TooltipTrigger>
                        {item.label.length > 35 && (
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        )}
                      </UiTooltip>
                    </TooltipProvider>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4">
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="60%"
                paddingAngle={1}
                activeIndex={activeIndex}
                activeShape={({ outerRadius = 0, ...props }) => (
                  <g>
                    <Sector 
                      {...props} 
                      outerRadius={outerRadius + 10} 
                      style={{ transition: 'all 0.3s ease' }} 
                    />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 20}
                      innerRadius={outerRadius + 12}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  </g>
                )}
                onMouseEnter={handleMouseEnter}
              >
                {processedData.map((entry, index) => (
                  <Sector
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              {/* Center label */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-bold"
              >
                {processedData[activeIndex]?.value.toLocaleString() || "0"}
                <tspan
                  x="50%"
                  dy="1.2em"
                  className="fill-muted-foreground text-sm block"
                >
                  Places
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {processedData.map((item, index) => (
              <div
                key={item.name}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  activeIndex === index 
                    ? 'bg-muted/50 ring-1 ring-border' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-foreground truncate">
                          {item.label.length > 40
                            ? `${item.label.substring(0, 40)}...`
                            : item.label}
                        </div>
                      </TooltipTrigger>
                      {item.label.length > 40 && (
                        <TooltipContent side="top" className="max-w-xs">
                          {item.label}
                        </TooltipContent>
                      )}
                    </UiTooltip>
                  </TooltipProvider>
                  <div className="text-xs text-muted-foreground">
                    {item.value.toLocaleString()} ({item.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

CategoryDistributionChart.displayName = 'CategoryDistributionChart';

export default CategoryDistributionChart;
