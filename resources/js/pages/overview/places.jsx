import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Search,
    History,
    X,
    Edit2,
    ListCollapse,
    Copy,
    Download,
    FileText,
    Loader2,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import Heading from "@/Components/Heading";
import AppLayout from "@/Layouts/App-Layout";
import { debounce } from "lodash";
import PlaceSheet from "@/Layouts/Placesheet/DefaultSheet";
import PlaceFilter from "./PlaceFilter";
import QuickFilterChips from "./QuickFilterChips";

// Constants to avoid magic strings
const FILTER_TYPES = {
    SEARCH: 'search',
    BUSINESS_STATUS: 'businessStatus',
    PLACE_STATUS: 'placeStatus',
    CATEGORY: 'category',
    DISTRICT: 'district',
    SORT_FIELD: 'sort_field',
    SORT_DIRECTION: 'sort_direction',
    PAGE: 'page',
};

// Constants for sheet modes
const SHEET_MODES = {
    ADD: 'add',
    VIEW: 'view',
    EDIT: 'edit',
};

export default function Places({ places, filters, activeFilters = {} }) {
    // Initialize search term from activeFilters
    const [searchTerm, setSearchTerm] = useState(activeFilters[FILTER_TYPES.SEARCH] || '');
    
    // State management
    const [sorting, setSorting] = useState(() => {
        const sortField = activeFilters[FILTER_TYPES.SORT_FIELD];
        const sortDirection = activeFilters[FILTER_TYPES.SORT_DIRECTION];
        if (sortField && sortDirection) {
            return [{ id: sortField, desc: sortDirection === 'desc' }];
        }
        return [];
    });
    
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    
    // Reference to track component mounted state
    const isMountedRef = useRef(true);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Sync search term with activeFilters when they change externally
    useEffect(() => {
        const newSearchTerm = activeFilters[FILTER_TYPES.SEARCH] || '';
        setSearchTerm(newSearchTerm);
    }, [activeFilters[FILTER_TYPES.SEARCH]]);

    // Create route params object from active filters for DRY code
    const createRouteParams = useCallback((overrides = {}) => {
        const params = {};
        
        // Handle search - use the override value if provided, otherwise use current activeFilters
        const searchValue = overrides.hasOwnProperty('search') 
            ? overrides.search 
            : activeFilters[FILTER_TYPES.SEARCH];
            
        if (searchValue && searchValue.trim()) {
            params[FILTER_TYPES.SEARCH] = searchValue.trim();
        }
        
        // Handle other filters
        const filterKeys = [
            FILTER_TYPES.BUSINESS_STATUS,
            FILTER_TYPES.PLACE_STATUS,
            FILTER_TYPES.CATEGORY,
            FILTER_TYPES.DISTRICT
        ];
        
        filterKeys.forEach(key => {
            const value = overrides.hasOwnProperty(key) ? overrides[key] : activeFilters[key];
            if (value && value.trim()) {
                params[key] = value;
            }
        });
        
        // Handle pagination - reset to page 1 for new searches/filters
        if (overrides.hasOwnProperty('page')) {
            if (overrides.page > 1) {
                params[FILTER_TYPES.PAGE] = overrides.page;
            }
        } else if (!overrides.search && places?.current_page > 1) {
            params[FILTER_TYPES.PAGE] = places.current_page;
        }
        
        // Handle sorting
        if (overrides[FILTER_TYPES.SORT_FIELD]) {
            params[FILTER_TYPES.SORT_FIELD] = overrides[FILTER_TYPES.SORT_FIELD];
            params[FILTER_TYPES.SORT_DIRECTION] = overrides[FILTER_TYPES.SORT_DIRECTION] || 'asc';
        } else if (sorting.length > 0) {
            params[FILTER_TYPES.SORT_FIELD] = sorting[0].id;
            params[FILTER_TYPES.SORT_DIRECTION] = sorting[0].desc ? 'desc' : 'asc';
        }
        
        return params;
    }, [activeFilters, places?.current_page, sorting]);

    // Common router navigation function
    const navigateWithFilters = useCallback((overrides = {}) => {
        if (!isMountedRef.current) return;
        
        const params = createRouteParams(overrides);
        
        router.get('/places', params, {
            preserveState: true,
            replace: true,
            only: ['places', 'activeFilters'],
            onError: (errors) => {
                console.error('Navigation error:', errors);
            }
        });
    }, [createRouteParams]);

    // Create debounced search function
    const debouncedSearch = useMemo(
        () => debounce((value) => {
            if (isMountedRef.current) {
                navigateWithFilters({ 
                    search: value,
                    page: 1 // Always reset to page 1 when searching
                });
            }
        }, 200),
        [navigateWithFilters]
    );

    // Clean up debounced function when component unmounts
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Handle search change - this is the key fix
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        
        // Update local state immediately for responsive UI
        setSearchTerm(value);
        
        // Debounce the actual search request
        debouncedSearch(value);
    }, [debouncedSearch]);

    // Handle search clear
    const handleSearchClear = useCallback(() => {
        setSearchTerm('');
        debouncedSearch('');
    }, [debouncedSearch]);

    // Sorting handler
    const handleSortingChange = useCallback((newSorting) => {
        setSorting(newSorting);
        
        if (newSorting.length > 0) {
            const [{ id, desc }] = newSorting;
            navigateWithFilters({ 
                sort_field: id, 
                sort_direction: desc ? 'desc' : 'asc' 
            });
        }
    }, [navigateWithFilters]);

    // Handle pagination
    const handlePageChange = useCallback((page) => {
        navigateWithFilters({ page });
    }, [navigateWithFilters]);

    // Handle filter changes
    const handleFilterChange = useCallback((newFilters) => {
        // Don't update searchTerm here - let it be controlled by the input
        navigateWithFilters({ ...newFilters, page: 1 });
    }, [navigateWithFilters]);

    // Clear a specific filter
    const clearFilter = useCallback((filterName) => {
        const clearedFilters = { [filterName]: '', page: 1 };
        
        if (filterName === FILTER_TYPES.SEARCH) {
            setSearchTerm('');
            debouncedSearch('');
        } else {
            navigateWithFilters(clearedFilters);
        }
    }, [navigateWithFilters, debouncedSearch]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        const resetFilters = {
            [FILTER_TYPES.SEARCH]: '',
            [FILTER_TYPES.BUSINESS_STATUS]: '',
            [FILTER_TYPES.PLACE_STATUS]: '',
            [FILTER_TYPES.CATEGORY]: '',
            [FILTER_TYPES.DISTRICT]: '',
            page: 1,
        };
        
        setSearchTerm('');
        navigateWithFilters(resetFilters);
    }, [navigateWithFilters]);

    // Export function
    const handleExport = useCallback(async () => {
        if (isExporting) return;
        
        setIsExporting(true);
        
        try {
            const params = createRouteParams();
            const queryString = new URLSearchParams(params).toString();
            const exportUrl = `/places/export${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('text/csv')) {
                throw new Error('Invalid response format. Expected CSV but received: ' + contentType);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `places_export_${new Date().toISOString().split('T')[0]}.csv`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    }, [createRouteParams, isExporting]);

    // Sheet handlers
    const openSheet = useCallback((mode, place = null) => {
        setSheetMode(mode);
        setSelectedPlace(place);
        setSheetOpen(true);
    }, []);

    const handleAddClick = useCallback((e) => {
        e?.stopPropagation();
        openSheet(SHEET_MODES.ADD);
    }, [openSheet]);

    const handleViewClick = useCallback((place, e) => {
        e?.stopPropagation();
        openSheet(SHEET_MODES.VIEW, place);
    }, [openSheet]);

    const handleEditClick = useCallback((place, e) => {
        e?.stopPropagation();
        openSheet(SHEET_MODES.EDIT, place);
    }, [openSheet]);
    
    const handleHistoryClick = useCallback((place, e) => {
        e?.stopPropagation();
        router.get(`/places/history/${place.placeId}`);
    }, []);

    const handleCopyId = useCallback(async (id, e) => {
        e?.stopPropagation();
        try {
            await navigator.clipboard.writeText(id);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }, []);

    const handleSheetOpenChange = useCallback((open) => {
        setSheetOpen(open);
        if (!open) {
            setTimeout(() => {
                if (isMountedRef.current) {
                    setSheetMode(null);
                    setSelectedPlace(null);
                }
            }, 150);
        }
    }, []);

    // Calculate active filters count
    const activeFilterCount = useMemo(() => {
        return Object.entries(activeFilters)
            .filter(([key, value]) => 
                value && 
                value.toString().trim() &&
                key !== FILTER_TYPES.SORT_FIELD && 
                key !== FILTER_TYPES.SORT_DIRECTION && 
                key !== FILTER_TYPES.PAGE
            ).length;
    }, [activeFilters]);

    const hasDataToExport = useMemo(() => {
        return places?.total > 0;
    }, [places?.total]);

    // Define columns
    const columns = useMemo(() => [
        {
            accessorKey: "placeName",
            header: "Place Name",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.getValue("placeName")}
                </div>
            ),
        },
        {
            accessorKey: "placeBusinessStatus",
            header: "Business Status",
            cell: ({ row }) => {
                const status = row.getValue("placeBusinessStatus");
                return (
                    <div className="capitalize">
                        {status || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: "placeStatus",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("placeStatus");
                return (
                    <div
                        className="max-w-xs truncate"
                        title={status || 'No status'}
                    >
                        {status || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: "placeCategory",
            header: "Category",
            cell: ({ row }) => {
                const category = row.getValue("placeCategory");
                return (
                    <div
                        className="max-w-xs truncate"
                        title={category || 'No category'}
                    >
                        {category || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: "source",
            header: "Source",
            cell: ({ row }) => {
                const source = row.getValue("source");
                return (
                    <div
                        className="max-w-xs truncate"
                        title={source || 'No source'}
                    >
                        {source || '-'}
                    </div>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const place = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyId(place.placeId, e);
                                }}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewClick(place, e);
                                }}
                            >
                                <ListCollapse className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(place, e);
                                }}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleHistoryClick(place, e);
                                }}
                            >
                                <History className="h-4 w-4 mr-2" />
                                View History
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [handleCopyId, handleViewClick, handleEditClick, handleHistoryClick]);

    // Create table instance
    const table = useReactTable({
        data: places?.data || [],
        columns,
        onSortingChange: handleSortingChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { 
            sorting, 
            columnVisibility, 
            rowSelection 
        },
        manualSorting: true,
        manualPagination: true,
    });

    // Extract active filters for badges
    const filterBadges = useMemo(() => {
        const badges = [];
        
        if (activeFilters[FILTER_TYPES.SEARCH]) {
            badges.push({
                type: FILTER_TYPES.SEARCH,
                label: `Search: ${activeFilters[FILTER_TYPES.SEARCH]}`,
            });
        }
        
        if (activeFilters[FILTER_TYPES.CATEGORY]) {
            badges.push({
                type: FILTER_TYPES.CATEGORY,
                label: `Category: ${activeFilters[FILTER_TYPES.CATEGORY] === 'null' ? 'Not Specified' : activeFilters[FILTER_TYPES.CATEGORY]}`,
            });
        }
        
        if (activeFilters[FILTER_TYPES.BUSINESS_STATUS]) {
            badges.push({
                type: FILTER_TYPES.BUSINESS_STATUS,
                label: `Business Status: ${activeFilters[FILTER_TYPES.BUSINESS_STATUS] === 'null' ? 'Not Specified' : activeFilters[FILTER_TYPES.BUSINESS_STATUS]}`,
            });
        }
        
        if (activeFilters[FILTER_TYPES.PLACE_STATUS]) {
            badges.push({
                type: FILTER_TYPES.PLACE_STATUS,
                label: `Place Status: ${activeFilters[FILTER_TYPES.PLACE_STATUS] === 'null' ? 'Not Specified' : activeFilters[FILTER_TYPES.PLACE_STATUS]}`,
            });
        }
        
        if (activeFilters[FILTER_TYPES.DISTRICT]) {
            badges.push({
                type: FILTER_TYPES.DISTRICT,
                label: `District: ${activeFilters[FILTER_TYPES.DISTRICT] === 'null' ? 'Not Specified' : activeFilters[FILTER_TYPES.DISTRICT]}`,
            });
        }
        
        return badges;
    }, [activeFilters]);

    // Filter props
    const filterProps = useMemo(() => ({
        filters: {
            categories: filters.categories || [],
            businessStatuses: filters.businessStatuses || [], 
            placeStatuses: filters.placeStatuses || [],
            districts: filters.districts || []
        },
        activeFilters,
        onFilterChange: handleFilterChange,
        searchTerm
    }), [filters, activeFilters, handleFilterChange, searchTerm]);

    return (
        <AppLayout>
            <Head title="Places" />
            <Heading title="Places" description="Manage your business places"/>

            <div className="flex flex-col space-y-4 py-4">
                {/* Filter controls */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search places..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-8 pr-8 max-w-sm"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-transparent"
                                    onClick={handleSearchClear}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <PlaceFilter {...filterProps} />
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleExport}
                                        disabled={isExporting || !hasDataToExport}
                                        className="flex items-center gap-2"
                                    >
                                        {isExporting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        <span className="hidden sm:inline">
                                            {isExporting ? 'Exporting...' : 'Export'}
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span>
                                            {!hasDataToExport 
                                                ? 'No data to export' 
                                                : activeFilterCount > 0 
                                                    ? `Export ${places?.total || 0} filtered results as CSV`
                                                    : `Export all ${places?.total || 0} places as CSV`
                                            }
                                        </span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button onClick={handleAddClick}>
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Add new place</span>
                        </Button>
                    </div>
                </div>
                
                {/* Quick Filter Chips */}
                <QuickFilterChips {...filterProps} />
                
                {/* Active filters display */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        <div className="flex flex-wrap gap-2">
                            {filterBadges.map((badge) => (
                                <Badge 
                                    key={badge.type}
                                    variant="outline" 
                                    className="flex items-center gap-1"
                                >
                                    {badge.label}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearFilter(badge.type);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearAllFilters();
                                }}
                                disabled={activeFilterCount === 0}
                            >
                                Clear all
                            </Button>
                        </div>
                    </div>
                )}

                {/* Export info banner when filters are active */}
                {activeFilterCount > 0 && hasDataToExport && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                                Export will include {places?.total || 0} filtered results based on your current filters.
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="border-blue-300 text-blue-800 hover:bg-blue-100"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Export Now
                        </Button>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Pagination */}
                {places?.total > places?.per_page && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {places.from || 0} to {places.to || 0} of {places.total || 0} entries
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(places.current_page - 1)}
                                disabled={places.current_page === 1}
                            >
                                Previous
                            </Button>
                            
                            <span className="text-sm text-muted-foreground px-2">
                                Page {places.current_page} of {places.last_page}
                            </span>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(places.current_page + 1)}
                                disabled={places.current_page === places.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Place Sheet (for add/edit/view) */}
            <PlaceSheet
                open={sheetOpen}
                onOpenChange={handleSheetOpenChange}
                mode={sheetMode}
                place={selectedPlace}
            />
        </AppLayout>
    );
}