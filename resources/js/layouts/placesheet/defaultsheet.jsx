import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import { 
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import PlaceViewContent from "./ViewSheet";
import PlaceFormContent from "./FormSheet";
import { Alert, AlertDescription, AlertTitle } from "@/Components/ui/alert";
import { Loader2 } from "lucide-react";
import { validateForm, mergeValidationErrors } from "@/lib/formschema";
import { isEqual } from "lodash"; // Use lodash's isEqual for deep object comparison

export default function DefaultSheet({ open, onOpenChange, mode: initialMode, place }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVersioningInfo, setShowVersioningInfo] = useState(false);
    const [alertInfo, setAlertInfo] = useState(null);
    const [mode, setMode] = useState(initialMode);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [originalData, setOriginalData] = useState({}); // Store the original data for comparison
    
    // Create a ref for checking if component is mounted
    const isMountedRef = useRef(true);
    
    // Initialize form with defaults
    const form = useForm({
        placeName: "",
        placeAddress: "",
        placeBusinessStatus: "",
        placeStatus: "",
        placeTypes: "",
        placeLatitude: "",
        placeLongitude: "",
        placeCategory: "",
        description: "",
        source: "",
    });

    // Update local mode when prop changes
    useEffect(() => {
        if (isMountedRef.current) {
            setMode(initialMode);
        }
    }, [initialMode]);

    // Reset form when mode or place changes
    useEffect(() => {
        if (!open) return; // Don't reset when sheet is closed
        
        // Clear validation errors when form is reset
        setValidationErrors({});
        
        if (mode === "add") {
            form.reset();
            // Set default placeStatus to "BARU" when adding a new place
            form.setData("placeStatus", "BARU");
            setShowVersioningInfo(false);
            // No need to track original data in "add" mode
            setOriginalData({});
        } else if (mode === "edit" && place) {
            form.clearErrors();
            const placeData = {
                placeName: place.placeName || "",
                placeAddress: place.placeAddress || "",
                placeDistrict: place.placeDistrict || "",
                placeBusinessStatus: place.placeBusinessStatus || "",
                placeStatus: place.placeStatus || "",
                placeTypes: place.placeTypes || "",
                placeLatitude: place.placeLatitude || "",
                placeLongitude: place.placeLongitude || "",
                placeCategory: place.placeCategory || "",
                description: place.description || "",
                source: place.source || "",
            };
            form.setData(placeData);
            // Store the original data for comparison
            setOriginalData(placeData);
            setShowVersioningInfo(true);
        }
    }, [mode, place, open]);

    // Component cleanup and tracking
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            // Force cleanup any lingering event listeners
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, []);

    // Clear alert after 5 seconds
    useEffect(() => {
        if (!alertInfo) return;
        
        const timer = setTimeout(() => {
            if (isMountedRef.current) {
                setAlertInfo(null);
            }
        }, 5000);
        
        return () => clearTimeout(timer);
    }, [alertInfo]);

    // Key event handler
    const handleKeyDown = useCallback((e) => {
        // Only handle Escape key
        if (e.key === "Escape") {
            if (isSelectOpen) {
                e.stopPropagation();
                // Let the select component handle its own closing
            }
        }
    }, [isSelectOpen]);

    // Add and remove event listener at the appropriate times
    useEffect(() => {
        // Remove any existing listeners first to prevent duplicates
        document.removeEventListener("keydown", handleKeyDown, true);
        
        // Only add the listener when the sheet is open
        if (open) {
            document.addEventListener("keydown", handleKeyDown, true);
        }
        
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [open, handleKeyDown]);

    // Check if form data has changed
    const hasFormChanged = useCallback(() => {
        if (mode !== "edit") return true; // Always allow submission in add mode
        
        // Deep comparison to check if any fields were modified
        return !isEqual(originalData, form.data);
    }, [form.data, originalData, mode]);

    // Submission handler with form validation
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent multiple submissions
        
        // Clear previous validation errors
        setValidationErrors({});
        
        // In edit mode, check if any changes were made
        if (mode === "edit" && !hasFormChanged()) {
            setAlertInfo({
                title: "No Changes Detected",
                description: "You haven't made any changes to the form. Please make changes before creating a new version.",
                variant: "destructive"
            });
            return;
        }
        
        // Perform client-side validation
        const validation = validateForm(form.data);
        
        if (!validation.success) {
            // Show validation errors
            setValidationErrors(validation.errors);
            setAlertInfo({
                title: "Validation Error",
                description: "Please fix the errors in the form before submitting.",
                variant: "destructive"
            });
            return;
        }
        
        setIsSubmitting(true);

        const onSuccess = () => {
            if (!isMountedRef.current) return;
            
            // Create the alert info
            const alertData = {
                title: "Success",
                description: mode === "add" 
                    ? "Place added successfully" 
                    : "New version created successfully",
                variant: "default"
            };
            
            // Close the sheet first
            onOpenChange(false);
            
            // Small delay to ensure UI updates properly
            setTimeout(() => {
                if (isMountedRef.current) {
                    setAlertInfo(alertData);
                    
                    if (mode === "add") form.reset();
                    setIsSubmitting(false);
                    setValidationErrors({});
                }
            }, 50);
        };

        const onError = (errors) => {
            if (!isMountedRef.current) return;
            
            setIsSubmitting(false);
            
            // If there are validation errors from the server, display them
            if (errors && Object.keys(errors).length > 0) {
                // Merge client and server validation errors
                const mergedErrors = mergeValidationErrors(validation.errors, errors);
                setValidationErrors(mergedErrors);
                
                setAlertInfo({
                    title: "Validation Error",
                    description: "Please fix the errors in the form.",
                    variant: "destructive"
                });
            } else {
                setAlertInfo({
                    title: "Error",
                    description: mode === "add"
                        ? "Failed to add place. Please check your input."
                        : "Failed to create new version. Please check your input.",
                    variant: "destructive"
                });
            }
        };

        if (mode === "add") {
            // Create new place
            router.post("/places", form.data, { 
                onSuccess, 
                onError,
                preserveState: true, // Important to preserve form data on error
                preserveScroll: true
            });
        } else if (mode === "edit" && place) {
            // Create new version (update)
            router.put(`/places/${place.id}`, form.data, { 
                onSuccess, 
                onError,
                preserveState: true,
                preserveScroll: true
            });
        }
    }, [form, mode, place, isSubmitting, onOpenChange, hasFormChanged]);

    // Fix: Update the mode state when switching from view to edit
    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === "edit") {
            setShowVersioningInfo(true);
            
            // When switching to edit mode, set the original data
            if (place) {
                const placeData = {
                    placeName: place.placeName || "",
                    placeAddress: place.placeAddress || "",
                    placeDistrict: place.placeDistrict || "",
                    placeBusinessStatus: place.placeBusinessStatus || "",
                    placeStatus: place.placeStatus || "",
                    placeTypes: place.placeTypes || "",
                    placeLatitude: place.placeLatitude || "",
                    placeLongitude: place.placeLongitude || "",
                    placeCategory: place.placeCategory || "",
                    description: place.description || "",
                    source: place.source || "",
                };
                setOriginalData(placeData);
                form.setData(placeData);
            }
        }
    };

    // Helper function to generate the sheet title based on the mode
    const getSheetTitle = () => {
        switch (mode) {
            case "add": return "Add New Place";
            case "view": return "Place Details";
            case "edit": return "Create New Version";
            default: return "";
        }
    };

    // Simplified handler for select open state
    const handleSelectOpenChange = useCallback((isOpen) => {
        setIsSelectOpen(isOpen);
    }, []);

    // Handle sheet close with proper cleanup
    const handleSheetOpenChange = useCallback((newIsOpen) => {
        if (!newIsOpen) {
            // Prevent closing if a select is open
            if (isSelectOpen) {
                return;
            }
            
            // Otherwise, close the sheet and perform cleanup
            onOpenChange(false);
            
            // Schedule state cleanup after animation completes
            setTimeout(() => {
                if (isMountedRef.current) {
                    // Reset any internal state if needed
                    setIsSelectOpen(false);
                    setValidationErrors({});
                }
            }, 300);
        } else {
            onOpenChange(true);
        }
    }, [isSelectOpen, onOpenChange]);

    // Close handler that ensures proper cleanup
    const handleCloseClick = useCallback(() => {
        if (!isSelectOpen) {
            handleSheetOpenChange(false);
        }
    }, [handleSheetOpenChange, isSelectOpen]);

    return (
        <>
            {alertInfo && (
                <Alert 
                    className="fixed top-4 right-4 w-80 z-50" 
                    variant={alertInfo.variant}
                >
                    <AlertTitle>{alertInfo.title}</AlertTitle>
                    <AlertDescription>{alertInfo.description}</AlertDescription>
                </Alert>
            )}
            
            <Sheet 
                open={open} 
                onOpenChange={handleSheetOpenChange}
            >
                <SheetContent 
                    className="min-w-[30vw] w-full sm:min-w-[35vw] flex flex-col max-h-full overflow-hidden sheet-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <SheetHeader className="sticky top-0 z-10 bg-background pb-4">
                        <SheetTitle>{getSheetTitle()}</SheetTitle>
                        <SheetDescription>
                            {mode === "add" && "Add a new place to your business listings."}
                            {mode === "view" && "View place details."}
                            {mode === "edit" && "Create a new version while preserving the history."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto pr-1">
                        {mode === "view" && place && (
                            <PlaceViewContent place={place} />
                        )}

                        {(mode === "add" || mode === "edit") && (
                            <PlaceFormContent 
                                form={form} 
                                onSubmit={handleSubmit} 
                                mode={mode}
                                onSelectOpenChange={handleSelectOpenChange}
                                validationErrors={validationErrors}
                            />
                        )}
                    </div>

                    <SheetFooter className="sticky bottom-0 z-10 bg-background pt-2 mt-auto">
                        {mode === "view" && (
                            <>
                                <Button type="button" variant="outline" onClick={handleCloseClick}>
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleModeChange("edit")}
                                >
                                    Create New Version
                                </Button>
                            </>
                        )}

                        {(mode === "add" || mode === "edit") && (
                            <>
                                <Button type="button" variant="outline" onClick={handleCloseClick}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || form.processing || (mode === "edit" && !hasFormChanged())}
                                    onClick={handleSubmit}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {mode === "add" ? "Add Place" : "Save New Version"}
                                </Button>
                            </>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}