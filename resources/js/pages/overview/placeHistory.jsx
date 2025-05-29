import React, { useState, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";
import {
    Calendar,
    Search,
    X,
    Eye,
    FileText,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
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
import Heading from "@/Components/Heading";
import AppLayout from "@/Layouts/App-Layout";
import RecordDetailSheet from "./RecordDetailSheet";

// Constants to avoid magic strings
const FILTER_TYPES = {
    SEARCH: "search",
    CATEGORY: "category",
    BUSINESS_STATUS: "businessStatus",
    PLACE_STATUS: "placeStatus",
    DISTRICT: "district",
    SORT_FIELD: "sort_field",
    SORT_DIRECTION: "sort_direction",
    PAGE: "page",
    PER_PAGE: "per_page",
};

export default function PlaceHistory({
    history = { data: [] },
    activeFilters = {},
}) {
    // State management
    const [searchTerm, setSearchTerm] = useState(
        activeFilters[FILTER_TYPES.SEARCH] || ""
    );

    // Reference to track component mounted state
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Create route params object from active filters for DRY code
    const createRouteParams = (overrides = {}) => {
        return {
            [FILTER_TYPES.SEARCH]:
                overrides.search !== undefined ? overrides.search : searchTerm,
            [FILTER_TYPES.BUSINESS_STATUS]:
                overrides.businessStatus !== undefined
                    ? overrides.businessStatus
                    : activeFilters[FILTER_TYPES.BUSINESS_STATUS],
            [FILTER_TYPES.PLACE_STATUS]:
                overrides.placeStatus !== undefined
                    ? overrides.placeStatus
                    : activeFilters[FILTER_TYPES.PLACE_STATUS],
            [FILTER_TYPES.CATEGORY]:
                overrides.category !== undefined
                    ? overrides.category
                    : activeFilters[FILTER_TYPES.CATEGORY],
            [FILTER_TYPES.DISTRICT]:
                overrides.district !== undefined
                    ? overrides.district
                    : activeFilters[FILTER_TYPES.DISTRICT],
            [FILTER_TYPES.PAGE]:
                overrides.page !== undefined
                    ? overrides.page
                    : history?.current_page,
            [FILTER_TYPES.PER_PAGE]:
                overrides.per_page !== undefined
                    ? overrides.per_page
                    : activeFilters[FILTER_TYPES.PER_PAGE] || 10,
            ...(overrides[FILTER_TYPES.SORT_FIELD]
                ? {
                      [FILTER_TYPES.SORT_FIELD]:
                          overrides[FILTER_TYPES.SORT_FIELD],
                      [FILTER_TYPES.SORT_DIRECTION]:
                          overrides[FILTER_TYPES.SORT_DIRECTION],
                  }
                : {}),
        };
    };

    // Common router navigation function to prevent code duplication
    const navigateWithFilters = (overrides = {}) => {
        router.get(route("history.index"), createRouteParams(overrides), {
            preserveState: true,
            replace: true,
        });
    };

    // Create debounced search function
    const debouncedSearch = debounce((value) => {
        navigateWithFilters({ search: value, page: 1 });
    }, 300);

    // Clean up debounced function when component unmounts
    React.useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Sorting handler
    const handleSortingChange = (field) => {
        const isAsc =
            activeFilters[FILTER_TYPES.SORT_FIELD] === field &&
            activeFilters[FILTER_TYPES.SORT_DIRECTION] === "asc";

        navigateWithFilters({
            sort_field: field,
            sort_direction: isAsc ? "desc" : "asc",
        });
    };

    // Handle pagination
    const handlePageChange = (page) => {
        navigateWithFilters({ page });
    };

    // Clear a specific filter
    const clearFilter = (filterName) => {
        navigateWithFilters({
            [filterName]: "",
            page: 1,
        });
    };

    // Clear all filters
    const clearAllFilters = () => {
        const resetFilters = {
            [FILTER_TYPES.SEARCH]: "",
            [FILTER_TYPES.BUSINESS_STATUS]: "",
            [FILTER_TYPES.PLACE_STATUS]: "",
            [FILTER_TYPES.CATEGORY]: "",
            [FILTER_TYPES.DISTRICT]: "",
            page: 1,
        };

        navigateWithFilters(resetFilters);
        setSearchTerm("");
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
        } catch (e) {
            return dateString || "N/A";
        }
    };

    // Calculate active filters count
    const activeFilterCount = Object.entries(activeFilters).filter(
        ([key, value]) =>
            value &&
            key !== FILTER_TYPES.SORT_FIELD &&
            key !== FILTER_TYPES.SORT_DIRECTION &&
            key !== FILTER_TYPES.PAGE &&
            key !== FILTER_TYPES.PER_PAGE
    ).length;

    // Extract active filters for badges
    const filterBadges = [
        activeFilters[FILTER_TYPES.SEARCH] && {
            type: FILTER_TYPES.SEARCH,
            label: `Search: ${activeFilters[FILTER_TYPES.SEARCH]}`,
        },
        activeFilters[FILTER_TYPES.CATEGORY] && {
            type: FILTER_TYPES.CATEGORY,
            label: `Category: ${
                activeFilters[FILTER_TYPES.CATEGORY] === "null"
                    ? "Not Specified (null)"
                    : activeFilters[FILTER_TYPES.CATEGORY]
            }`,
        },
        activeFilters[FILTER_TYPES.BUSINESS_STATUS] && {
            type: FILTER_TYPES.BUSINESS_STATUS,
            label: `Business Status: ${
                activeFilters[FILTER_TYPES.BUSINESS_STATUS] === "null"
                    ? "Not Specified (null)"
                    : activeFilters[FILTER_TYPES.BUSINESS_STATUS]
            }`,
        },
        activeFilters[FILTER_TYPES.PLACE_STATUS] && {
            type: FILTER_TYPES.PLACE_STATUS,
            label: `Place Status: ${
                activeFilters[FILTER_TYPES.PLACE_STATUS] === "null"
                    ? "Not Specified (null)"
                    : activeFilters[FILTER_TYPES.PLACE_STATUS]
            }`,
        },
        activeFilters[FILTER_TYPES.DISTRICT] && {
            type: FILTER_TYPES.DISTRICT,
            label: `District: ${
                activeFilters[FILTER_TYPES.DISTRICT] === "null"
                    ? "Not Specified (null)"
                    : activeFilters[FILTER_TYPES.DISTRICT]
            }`,
        },
    ].filter(Boolean);

    // Render sort indicator
    const renderSortIndicator = (field) => {
        if (activeFilters[FILTER_TYPES.SORT_FIELD] !== field) return null;

        return activeFilters[FILTER_TYPES.SORT_DIRECTION] === "asc" ? (
            <span className="ml-1">↑</span>
        ) : (
            <span className="ml-1">↓</span>
        );
    };

    return (
        <AppLayout>
            <Head title="Historical Place Data" />
            <Heading
                title="Historical Place Data"
                description="View all historical (non-current) place records in the system"
            />

            <div className="flex flex-col space-y-4 py-4">
                {/* Filter controls */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search historical data..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-8 max-w-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Active filters display */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Active filters:
                        </span>
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

                {/* Information banner */}
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Showing historical place records. These represent previous versions of places that have been updated.</span>
                    </p>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() =>
                                        handleSortingChange("placeName")
                                    }
                                >
                                    <div className="flex items-center">
                                        Name {renderSortIndicator("placeName")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer whitespace-nowrap hidden sm:table-cell"
                                    onClick={() =>
                                        handleSortingChange(
                                            "placeBusinessStatus"
                                        )
                                    }
                                >
                                    <div className="flex items-center">
                                        Business Status{" "}
                                        {renderSortIndicator(
                                            "placeBusinessStatus"
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer whitespace-nowrap hidden md:table-cell"
                                    onClick={() =>
                                        handleSortingChange("placeCategory")
                                    }
                                >
                                    <div className="flex items-center">
                                        Category{" "}
                                        {renderSortIndicator("placeCategory")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer whitespace-nowrap hidden lg:table-cell"
                                    onClick={() =>
                                        handleSortingChange("placeDistrict")
                                    }
                                >
                                    <div className="flex items-center">
                                        District{" "}
                                        {renderSortIndicator("placeDistrict")}
                                    </div>
                                </TableHead>
                                <TableHead className="whitespace-nowrap hidden lg:table-cell">
                                    Created By
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer whitespace-nowrap hidden md:table-cell"
                                >
                                    <div className="flex items-center">
                                        Date Created
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {history.data && history.data.length > 0 ? (
                                history.data.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            {record.placeName || "Unnamed Place"}
                                        </TableCell>
                                        <TableCell className="capitalize hidden sm:table-cell">
                                            {record.placeBusinessStatus || "None"}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {record.placeCategory || "Uncategorized"}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {record.placeDistrict || "None"}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {record.creator?.name || "System"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap hidden md:table-cell">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(record.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RecordDetailSheet record={record}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </RecordDetailSheet>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center"
                                    >
                                        No historical records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {history?.total > (activeFilters[FILTER_TYPES.PER_PAGE] || 10) && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {history.from} to {history.to} of{" "}
                            {history.total} entries
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(history.current_page - 1)
                                }
                                disabled={history.current_page === 1}
                            >
                                Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(history.current_page + 1)
                                }
                                disabled={
                                    history.current_page === history.last_page
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}