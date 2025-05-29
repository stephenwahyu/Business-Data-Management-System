import React, { useRef, useMemo, useCallback } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { ScrollArea, ScrollBar } from "@/Components/ui/scroll-area";
import { CheckIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";

// Constants for filter types - aligned with backend constants
const FILTER_TYPES = {
  BUSINESS_STATUS: "businessStatus",
  PLACE_STATUS: "placeStatus",
  CATEGORY: "category", 
  DISTRICT: "district"
};

// Color mapping for filter types with semantic meanings
const COLOR_MAPPINGS = {
  [FILTER_TYPES.BUSINESS_STATUS]: {
    "OPERATIONAL": "bg-green-100 text-green-800 hover:bg-green-200",
    "CLOSED_TEMPORARILY": "bg-amber-100 text-amber-800 hover:bg-amber-200",
    "CLOSED_PERMANENTLY": "bg-red-100 text-red-800 hover:bg-red-200",
    "null": "bg-gray-100 text-gray-800 hover:bg-gray-200",
    "default": "bg-gray-100 text-gray-800 hover:bg-gray-200"
  },
  [FILTER_TYPES.PLACE_STATUS]: {
    "AKTIF": "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "TIDAK AKTIF": "bg-gray-100 text-gray-600 hover:bg-gray-200",
    "TIDAK DITEMUKAN": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    "null": "bg-gray-100 text-gray-800 hover:bg-gray-200",
    "default": "bg-gray-100 text-gray-800 hover:bg-gray-200"
  },
  [FILTER_TYPES.CATEGORY]: "bg-teal-100 text-teal-800 hover:bg-teal-200",
  [FILTER_TYPES.DISTRICT]: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
};

// Status icons mapping for visual indicators
const STATUS_ICONS = {
  [FILTER_TYPES.BUSINESS_STATUS]: {
    "OPERATIONAL": "🟢", // Green circle
    "CLOSED_TEMPORARILY": "🟠", // Orange circle
    "CLOSED_PERMANENTLY": "🔴", // Red circle
    "null": "❓", // Question mark for null values
  },
  [FILTER_TYPES.PLACE_STATUS]: {
    "AKTIF": "✅", // Checkmark
    "TIDAK AKTIF": "❌", // X mark
    "TIDAK DITEMUKAN": "❓", // Question mark
    "null": "❓", // Question mark for null values
  }
};

export default function QuickFilterChips({
  filters,
  activeFilters,
  onFilterChange,
  searchTerm,
}) {
  const filterListRef = useRef(null);

  // Get color for a filter value
  const getFilterColor = useCallback((type, value) => {
    const colorMapping = COLOR_MAPPINGS[type];
    
    // If the mapping is a string, return it directly
    if (typeof colorMapping === 'string') {
      return colorMapping;
    }
    
    // If the mapping is an object, look up the value or return default
    return colorMapping[value] || colorMapping.default;
  }, []);

  // Get icon for a status value
  const getStatusIcon = useCallback((type, value) => {
    if (STATUS_ICONS[type] && STATUS_ICONS[type][value]) {
      return STATUS_ICONS[type][value];
    }
    return null;
  }, []);

  // Apply a quick filter
  const applyQuickFilter = useCallback((filterType, value) => {
    // Toggle filter - if already active, clear it, otherwise set it
    const newValue = activeFilters[filterType] === value ? "" : value;
    
    const newFilters = {
      ...activeFilters,
      search: searchTerm, // Ensure search term stays consistent
      [filterType]: newValue,
      page: 1, // Reset to first page on filter change
    };
    
    // Update parent component state
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
    
    // Navigate with updated filters - using router.get for SPA navigation
    router.get('/places', newFilters, {
      preserveState: true,
      replace: true,
    });
  }, [activeFilters, searchTerm, onFilterChange]);

  // Create enhanced filter groups with null options
  const enhanceFiltersWithNullOptions = useCallback((type, values) => {
    // Add 'null' option to certain filter types
    if (
      type === FILTER_TYPES.BUSINESS_STATUS ||
      type === FILTER_TYPES.PLACE_STATUS ||
      type === FILTER_TYPES.CATEGORY ||
      type === FILTER_TYPES.DISTRICT
    ) {
      return ['null', ...values];
    }
    return values;
  }, []);

  // Group filters by type for organization
  const filterGroups = useMemo(() => [
    { 
      type: FILTER_TYPES.BUSINESS_STATUS, 
      title: "Business Status", 
      values: enhanceFiltersWithNullOptions(FILTER_TYPES.BUSINESS_STATUS, filters?.businessStatuses || []),
    },
    { 
      type: FILTER_TYPES.PLACE_STATUS, 
      title: "Place Status", 
      values: enhanceFiltersWithNullOptions(FILTER_TYPES.PLACE_STATUS, filters?.placeStatuses || []),
    },
    { 
      type: FILTER_TYPES.CATEGORY, 
      title: "Category", 
      values: enhanceFiltersWithNullOptions(FILTER_TYPES.CATEGORY, filters?.categories || []),
    },
    { 
      type: FILTER_TYPES.DISTRICT, 
      title: "District", 
      values: enhanceFiltersWithNullOptions(FILTER_TYPES.DISTRICT, filters?.districts || []),
    }
  ], [filters, enhanceFiltersWithNullOptions]);

  // Filter out groups with no values
  const visibleFilterGroups = useMemo(() => 
    filterGroups.filter(group => group.values && group.values.length > 0),
  [filterGroups]);

  // Get display value for a filter
  const getDisplayValue = useCallback((type, value) => {
    if (value === 'null') {
      return 'Not Specified (null)';
    }
    
    // For categories with short codes, show full name
    if (type === FILTER_TYPES.CATEGORY && value.length <= 2) {
      return `${value}: ${getCategoryName(value)}`;
    }
    
    return value;
  }, []);

  // If no filter groups are available, don't render component
  if (visibleFilterGroups.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div
          ref={filterListRef}
          className="flex gap-4 p-4"
        >
          {visibleFilterGroups.map((group) => (
            <div key={group.type} className="flex flex-col shrink-0">
              <div className="text-xs font-medium text-gray-500 px-1 mb-1">
                {group.title}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => {
                  if (!value && value !== 'null') return null; // Skip empty values except explicit 'null'
                  
                  const isActive = activeFilters[group.type] === value;
                  const colorClass = getFilterColor(group.type, value);
                  const icon = getStatusIcon(group.type, value);
                  const displayValue = getDisplayValue(group.type, value);
                  
                  return (
                    <TooltipProvider key={`${group.type}-${value}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              isActive
                                ? `${colorClass} border-transparent`
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            } whitespace-nowrap flex items-center gap-1`}
                            onClick={() => applyQuickFilter(group.type, value)}
                          >
                            {isActive && <CheckIcon className="h-3 w-3" />}
                            {icon && <span className="text-xs">{icon}</span>}
                            <span className="truncate max-w-[150px]">
                              {displayValue.length > 20 
                                ? `${displayValue.substring(0, 20)}...` 
                                : displayValue}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {displayValue}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Helper function to get full category name from code
function getCategoryName(code) {
  const categoryMap = {
    "A": "Pertanian, Kehutanan dan Perikanan",
    "B": "Pertambangan dan Penggalian",
    "C": "Industri Pengolahan",
    "D": "Pengadaan Listrik, Gas, Uap/Air Panas",
    "E": "Treatment Air, Treatment Air Limbah",
    "F": "Konstruksi",
    "G": "Perdagangan Besar Dan Eceran",
    "H": "Pengangkutan dan Pergudangan",
    "I": "Penyediaan Akomodasi Dan Makan Minum",
    "J": "Informasi Dan Komunikasi",
    "K": "Aktivitas Keuangan dan Asuransi",
    "L": "Real Estat",
    "M": "Aktivitas Profesional, Ilmiah Dan Teknis",
    "N": "Aktivitas Penyewaan dan Sewa Guna Usaha",
    "O": "Administrasi Pemerintahan",
    "P": "Pendidikan",
    "Q": "Aktivitas Kesehatan Manusia",
    "R": "Kesenian, Hiburan Dan Rekreasi",
    "S": "Aktivitas Jasa Lainnya",
    "T": "Aktivitas Rumah Tangga",
    "U": "Aktivitas Badan Internasional",
  };
  
  return categoryMap[code] || code;
}