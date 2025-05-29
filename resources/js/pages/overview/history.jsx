import React, { useState, useRef, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";
import { 
    ArrowLeft, 
    Calendar, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ChevronsLeftIcon, 
    ChevronsRightIcon,
    Search,
    X,
    Eye,
    FileText
} from "lucide-react";

// UI Components
import { Button } from "@/Components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import Heading from "@/Components/Heading";
import AppLayout from "@/Layouts/App-Layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import RecordDetailSheet from "./RecordDetailSheet";

// Constants for filter types
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

export default function RecordHistory({ currentPlace, history }) {
    // Set up state
    const [searchTerm, setSearchTerm] = useState("");
    const [columnVisibility, setColumnVisibility] = useState({
        version: true,
        name: true,
        businessStatus: true,
        category: true,
        createdBy: true,
        createdAt: true,
        current: true,
        changes: true,
    });

    
    // For component-level pagination (when working with array instead of paginated data)
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.ceil(history.length / pageSize);
    const paginatedHistory = history.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    
    // Reference to track component mounted state
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            debouncedSearch.cancel();
        };
    }, []);

    // Create debounced search function
    const debouncedSearch = debounce((value) => {
        // This would be replaced with your Inertia router implementation
        // if integrating search with backend
        setSearchTerm(value);
    }, 300);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Sorting & filtering functions can be implemented here
    // For the local array version, filtering could be done as:
    const filteredHistory = history.filter(record => {
        if (!searchTerm) return true;
        return (
            (record.placeName && record.placeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.placeId && record.placeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.placeCategory && record.placeCategory.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    // Helper function to format date with error handling
    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
        } catch (e) {
            return dateString || "N/A";
        }
    };

    // Format date with compact display for mobile
    const formatCompactDate = (dateString) => {
        try {
            return format(parseISO(dateString), "MMM d, yyyy");
        } catch (e) {
            return dateString || "N/A";
        }
    };

    // Function to compare changes between versions
    const hasFieldChanged = (currentRecord, previousRecord, fieldName) => {
        if (!previousRecord) return false;
        return currentRecord[fieldName] !== previousRecord[fieldName];
    };
    
    // Navigation functions for pagination
    const previousPage = () => setPageIndex(Math.max(0, pageIndex - 1));
    const nextPage = () => setPageIndex(Math.min(totalPages - 1, pageIndex + 1));
    const firstPage = () => setPageIndex(0);
    const lastPage = () => setPageIndex(totalPages - 1);
    
    const canPreviousPage = pageIndex > 0;
    const canNextPage = pageIndex < totalPages - 1;

    const handleBack = () => {
        router.get('/places');
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm("");
    };

    return (
        <AppLayout>
            <Head title={`History - ${currentPlace.placeName}`} />
            
            {/* Header section with back button */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                <Heading 
                    title={`History for ${currentPlace.placeName}`} 
                    description={`Showing all historical records for Place ID: ${currentPlace.placeId}`} 
                />
                <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className="self-start sm:self-auto"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Places
                </Button>
            </div>

            {/* Filter and search section */}
            <div className="flex flex-col space-y-4 py-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search history records..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-8 max-w-sm"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={clearSearch}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active search filter display */}
                {searchTerm && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Active filters:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                Search: {searchTerm}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={clearSearch}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Information banner */}
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>This page shows the complete history of this place. Each row represents a version of the record over time.</span>
                    </p>
                </div>
            </div>

            {/* Responsive Table with shadcn/ui components */}
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                    <TableHead className="whitespace-nowrap w-16">Version</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[80px] max-w-[180px]">Name</TableHead>
                                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Business Status</TableHead>
                                    <TableHead className="whitespace-nowrap hidden md:table-cell">Category</TableHead>
                                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Created By</TableHead>
                                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Created At</TableHead>
                                    <TableHead className="whitespace-nowrap">Current</TableHead>
                                    <TableHead className="whitespace-nowrap hidden md:table-cell">Changes</TableHead>
                                
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedHistory.length ? (
                                paginatedHistory.map((record, index) => {
                                    const actualIndex = pageIndex * pageSize + index;
                                    const previousRecord = history[actualIndex + 1];
                                    const changedFields = [
                                        'placeName', 
                                        'placeBusinessStatus', 
                                        'placeStatus',
                                        'placeDistrict',
                                        'placeCategory',
                                        'placeAddress',
                                        'placeTypes',
                                        'source',
                                        'created_by'
                                    ].filter(field => 
                                        hasFieldChanged(record, previousRecord, field)
                                    );
                                    
                                    return (
                                        <TableRow key={record.id}>
                                            {columnVisibility.version && 
                                                <TableCell className="w-16">{history.length - actualIndex}</TableCell>}
                                            
                                            {columnVisibility.name && (
                                                <TableCell className="font-medium max-w-[180px] truncate">
                                                    {record.placeName || "Unnamed Place"}
                                                </TableCell>
                                            )}
                                            
                                            {columnVisibility.businessStatus && 
                                                <TableCell className="capitalize whitespace-nowrap hidden sm:table-cell">
                                                    {record.placeBusinessStatus || "None"}
                                                </TableCell>}
                                            
                                            {columnVisibility.category && 
                                                <TableCell className="max-w-[150px] truncate hidden md:table-cell">
                                                    {record.placeCategory || "Uncategorized"}
                                                </TableCell>}
                                            
                                            {columnVisibility.createdBy && 
                                                <TableCell className="whitespace-nowrap hidden lg:table-cell">
                                                    {record.creator?.name || "System"}
                                                </TableCell>}
                                            
                                            {columnVisibility.createdAt && (
                                                <TableCell className="whitespace-nowrap hidden sm:table-cell">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-1" />
                                                        {formatDate(record.created_at)}
                                                    </div>
                                                </TableCell>
                                            )}
                                            
                                            {columnVisibility.current && (
                                                <TableCell>
                                                    {record.isCurrent ? (
                                                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                                            Current
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                                            Historical
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            )}
                                            
                                            {columnVisibility.changes && (
                                                <TableCell className="hidden md:table-cell">
                                                    {actualIndex < history.length - 1 ? (
                                                        changedFields.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {changedFields.map(field => (
                                                                    <Badge key={field} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                                        {field
                                                                            .replace('place', '')
                                                                            .replace('created_by', 'Modified by')
                                                                            .replace('source', 'Source')}
                                                                    </Badge>                                                                  
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-sm">No changes</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-500 text-sm">Initial version</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            
                                            <TableCell className="text-right">
                                                <RecordDetailSheet record={record}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex items-center"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        <span className="hidden sm:inline">View Details</span>
                                                    </Button>
                                                </RecordDetailSheet>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 mt-4">
                <div className="hidden flex-1 text-sm text-muted-foreground md:block">
                    Showing {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, history.length)} of {history.length} records
                </div>
                
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium hidden sm:block">
                            Rows per page
                        </Label>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPageIndex(0); // Reset to first page when changing page size
                            }}
                        >
                            <SelectTrigger className="w-16" id="rows-per-page">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[5, 10, 20, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex items-center text-sm font-medium">
                        <span className="hidden sm:inline">Page </span>
                        {pageIndex + 1} / {totalPages || 1}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="hidden p-2 md:flex h-8 w-8"
                            onClick={firstPage}
                            disabled={!canPreviousPage}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="p-2 h-8 w-8"
                            onClick={previousPage}
                            disabled={!canPreviousPage}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="p-2 h-8 w-8"
                            onClick={nextPage}
                            disabled={!canNextPage}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden p-2 md:flex h-8 w-8"
                            onClick={lastPage}
                            disabled={!canNextPage}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}