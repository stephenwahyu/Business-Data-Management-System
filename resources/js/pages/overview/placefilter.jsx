import React, { useState, useEffect, useRef, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";

// Define constant options (outside component to prevent recreation)
const businessStatusOptions = [
  { value: "none", label: "All Business Statuses" },
  { value: "OPERATIONAL", label: "Operational" },
  { value: "CLOSED_TEMPORARILY", label: "Closed Temporarily" },
  { value: "CLOSED_PERMANENTLY", label: "Closed Permanently" },
  { value: "null", label: "Not Specified (null)" },
];

const statusOptions = [
  { value: "none", label: "All Place Statuses" },
  { value: "AKTIF", label: "Aktif" },
  { value: "TIDAK AKTIF", label: "Tidak Aktif" },
  { value: "TIDAK DITEMUKAN", label: "Tidak Ditemukan" },
  { value: "null", label: "Not Specified (null)" },
];

// Keep category options in a constant array
const categoryOptions = [
  { value: "none", label: "All Categories" },
  { value: "null", label: "Not Specified (null)" },
  { value: "A", label: "Pertanian, Kehutanan dan Perikanan" },
  { value: "B", label: "Pertambangan dan Penggalian" },
  { value: "C", label: "Industri Pengolahan" },
  { value: "D", label: "Pengadaan Listrik, Gas, Uap/Air Panas Dan Udara Dingin" },
  { value: "E", label: "Treatment Air, Treatment Air Limbah, Treatment dan Pemulihan Material Sampah" },
  { value: "F", label: "Konstruksi" },
  { value: "G", label: "Perdagangan Besar Dan Eceran" },
  { value: "H", label: "Pengangkutan dan Pergudangan" },
  { value: "I", label: "Penyediaan Akomodasi Dan Penyediaan Makan Minum" },
  { value: "J", label: "Informasi Dan Komunikasi" },
  { value: "K", label: "Aktivitas Keuangan dan Asuransi" },
  { value: "L", label: "Real Estat" },
  { value: "M", label: "Aktivitas Profesional, Ilmiah Dan Teknis" },
  { value: "N", label: "Aktivitas Penyewaan dan Sewa Guna Usaha" },
  { value: "O", label: "Administrasi Pemerintahan, Pertahanan Dan Jaminan Sosial" },
  { value: "P", label: "Pendidikan" },
  { value: "Q", label: "Aktivitas Kesehatan Manusia Dan Aktivitas Sosial" },
  { value: "R", label: "Kesenian, Hiburan Dan Rekreasi" },
  { value: "S", label: "Aktivitas Jasa Lainnya" },
  { value: "T", label: "Aktivitas Rumah Tangga" },
  { value: "U", label: "Aktivitas Badan Internasional" },
];

export default function PlaceFilter({ 
  filters,
  activeFilters,
  onFilterChange,
  searchTerm
}) {
  // Initialize state from active filters
  const [selectedCategory, setSelectedCategory] = useState(activeFilters.category || "none");
  const [selectedBusinessStatus, setSelectedBusinessStatus] = useState(activeFilters.businessStatus || "none");
  const [selectedPlaceStatus, setSelectedPlaceStatus] = useState(activeFilters.placeStatus || "none");
  const [selectedDistrict, setSelectedDistrict] = useState(activeFilters.district || "none");
  const [open, setOpen] = useState(false);
  const [activeSelect, setActiveSelect] = useState(null);
  
  // Refs for components
  const popoverRef = useRef(null);

  // Sync internal state when props change
  useEffect(() => {
    setSelectedCategory(activeFilters.category || "none");
    setSelectedBusinessStatus(activeFilters.businessStatus || "none");
    setSelectedPlaceStatus(activeFilters.placeStatus || "none");
    setSelectedDistrict(activeFilters.district || "none");
  }, [activeFilters]);

  // Calculate active filter count for badge display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory && selectedCategory !== "none") count++;
    if (selectedBusinessStatus && selectedBusinessStatus !== "none") count++;
    if (selectedPlaceStatus && selectedPlaceStatus !== "none") count++;
    if (selectedDistrict && selectedDistrict !== "none") count++;
    return count;
  }, [selectedCategory, selectedBusinessStatus, selectedPlaceStatus, selectedDistrict]);

  // Convert district array to select options format
  const districtOptions = useMemo(() => {
    const options = [
      { value: "none", label: "All Districts" },
      { value: "null", label: "Not Specified (null)" }
    ];
    
    if (filters?.districts && Array.isArray(filters.districts)) {
      filters.districts.forEach(district => {
        if (district) {
          options.push({ value: district, label: district });
        }
      });
    }
    
    return options;
  }, [filters?.districts]);

  // Apply filters and update URL
  const applyFilters = () => {
    const newFilters = {
      search: searchTerm,
      category: selectedCategory !== "none" ? selectedCategory : "",
      businessStatus: selectedBusinessStatus !== "none" ? selectedBusinessStatus : "",
      placeStatus: selectedPlaceStatus !== "none" ? selectedPlaceStatus : "",
      district: selectedDistrict !== "none" ? selectedDistrict : "",
      page: 1, // Reset to first page on filter change
    };
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
    
    router.get('/places', newFilters, {
      preserveState: true,
      replace: true,
    });
    setOpen(false);
  };

  // Reset all filters to default state
  const resetFilters = () => {
    setSelectedCategory("none");
    setSelectedBusinessStatus("none");
    setSelectedPlaceStatus("none");
    setSelectedDistrict("none");
    
    const newFilters = {
      search: searchTerm,
      category: "",
      businessStatus: "",
      placeStatus: "",
      district: "",
      page: 1,
    };
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
    
    router.get('/places', newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  // Handle select dropdown state management
  const handleSelectOpenChange = (id, isOpen) => {
    if (isOpen) {
      setActiveSelect(id);
    } else if (activeSelect === id) {
      setActiveSelect(null);
    }
  };

  // Handle popover state
  const handlePopoverOpenChange = (isOpen) => {
    if (!isOpen && !activeSelect) {
      setOpen(false);
    } else if (isOpen) {
      setOpen(true);
    }
  };

  // Global keyboard handler for accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (activeSelect) {
        e.stopPropagation();
        setActiveSelect(null);
      }
    }
  };

  // Add event listener for keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeSelect]);

  // Create memoized select component for better performance
  const SelectWithTooltip = ({ id, label, value, onChange, options }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <TooltipProvider>
        <Select
          value={value}
          onValueChange={(newValue) => {
            onChange(newValue);
            setActiveSelect(null);
          }}
          open={activeSelect === id}
          onOpenChange={(isOpen) => handleSelectOpenChange(id, isOpen)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent
            className="max-w-lg"
            position="popper"
            sideOffset={5}
            onEscapeKeyDown={(e) => {
              e.stopPropagation();
              setActiveSelect(null);
            }}
            onPointerDownOutside={(e) => {
              if (popoverRef.current && popoverRef.current.contains(e.target)) {
                e.preventDefault();
              }
            }}
          >
            {options.map(option => (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  <SelectItem
                    value={option.value}
                    className="pr-6 whitespace-normal break-words"
                  >
                    <span className="block truncate">
                      {option.value !== "none" && option.value.length <= 2 ? `${option.value}: ` : ""}
                      {option.label.length > 25 ? `${option.label.substring(0, 25)}...` : option.label}
                    </span>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  {option.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </SelectContent>
        </Select>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="relative" ref={popoverRef}>
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative" onClick={() => setOpen(true)}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 z-50">
          <div className="space-y-4">
            <h4 className="font-medium">Filter Places</h4>
            
            <SelectWithTooltip
              id="category"
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
            />
            
            <SelectWithTooltip
              id="businessStatus"
              label="Business Status"
              value={selectedBusinessStatus}
              onChange={setSelectedBusinessStatus}
              options={businessStatusOptions}
            />
            
            <SelectWithTooltip
              id="placeStatus"
              label="Place Status"
              value={selectedPlaceStatus}
              onChange={setSelectedPlaceStatus}
              options={statusOptions}
            />
            
            <SelectWithTooltip
              id="district"
              label="District"
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              options={districtOptions}
            />
            
            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                disabled={activeFilterCount === 0}
              >
                Reset
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}