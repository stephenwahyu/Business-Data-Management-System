import React, { useEffect, useState, useCallback, useRef } from "react";
import { format, parseISO } from "date-fns";
import { router } from "@inertiajs/react";

import { 
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/Components/ui/alert";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Card } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { MapIcon, Loader2 } from "lucide-react";

export default function RecordDetailSheet({ record, children }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const isMountedRef = useRef(true);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(true);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [alertInfo, setAlertInfo] = useState(null);
    
    // Clean up when component unmounts
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            // Force cleanup any lingering event listeners
            document.removeEventListener("keydown", handleKeyDown, true);
            
            // Clean up map
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
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
    
    // Handle map initialization with proper cleanup
    useEffect(() => {
        if (!isSheetOpen) return;
        const timeout = setTimeout(() => {
            // Only initialize if not already initialized
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                return;
            }
            
            const latitude = parseFloat(record.placeLatitude) || -6.2088;
            const longitude = parseFloat(record.placeLongitude) || 106.8456;
            
            const map = window.L.map(mapRef.current, {
                dragging: true,
                scrollWheelZoom: true,
                zoomControl: false,
                doubleClickZoom: true,
                attributionControl: false,
                touchZoom: false
            }).setView([latitude, longitude], 18);
            
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            
            // Add a static marker
            window.L.marker([latitude, longitude]).addTo(map);
            
            mapInstanceRef.current = map;
            setIsMapLoaded(true);
            
            // Ensure map renders correctly after DOM is fully loaded
            setTimeout(() => {
                if (mapInstanceRef.current && isMountedRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 250);
        },100);
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isSheetOpen, isMapOpen, record.placeLatitude, record.placeLongitude]);
    
    // Key event handler for better accessibility
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            // Let the sheet component handle closing
        }
    }, []);
    
    // Add keyboard event listener
    useEffect(() => {
        if (isSheetOpen) {
            document.addEventListener("keydown", handleKeyDown, true);
        } else {
            document.removeEventListener("keydown", handleKeyDown, true);
        }
        
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [isSheetOpen, handleKeyDown]);
    
    // Date formatting helper
    const formatDateLocal = (dateString) => {
        try {
            return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
        } catch (e) {
            return dateString || "N/A";
        }
    };
    
    // Format business status for display
    const formatBusinessStatus = (status) => {
        if (!status) return "None";
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };
    
    // Format category with code and description
    const formatCategory = (code) => {
        const categories = {
            "A": "Pertanian, Kehutanan dan Perikanan",
            "B": "Pertambangan dan Penggalian",
            "C": "Industri Pengolahan",
            "D": "Pengadaan Listrik, Gas, Uap/Air Panas Dan Udara Dingin",
            "E": "Treatment Air, Treatment Air Limbah, Treatment dan Pemulihan Material Sampah, dan Aktivitas Remediasi",
            "F": "Konstruksi",
            "G": "Perdagangan Besar Dan Eceran; Reparasi Dan Perawatan Mobil Dan Sepeda Motor",
            "H": "Pengangkutan dan Pergudangan",
            "I": "Penyediaan Akomodasi Dan Penyediaan Makan Minum",
            "J": "Informasi Dan Komunikasi",
            "K": "Aktivitas Keuangan dan Asuransi",
            "L": "Real Estat",
            "M": "Aktivitas Profesional, Ilmiah Dan Teknis",
            "N": "Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya",
            "O": "Administrasi Pemerintahan, Pertahanan Dan Jaminan Sosial Wajib",
            "P": "Pendidikan",
            "Q": "Aktivitas Kesehatan Manusia Dan Aktivitas Sosial",
            "R": "Kesenian, Hiburan Dan Rekreasi",
            "S": "Aktivitas Jasa Lainnya",
            "T": "Aktivitas Rumah Tangga Sebagai Pemberi Kerja; Aktivitas Yang Menghasilkan Barang Dan Jasa Oleh Rumah Tangga yang Digunakan untuk Memenuhi Kebutuhan Sendiri",
            "U": "Aktivitas Badan Internasional Dan Badan Ekstra Internasional Lainnya"
        };
        
        if (!code || !categories[code]) return code || "None";
        return `${code} - ${categories[code]}`;
    };
    
    // Render types as badges
    const renderTypes = (types) => {
        if (!types || types === "None") {
            return <span className="text-gray-500">None</span>;
        }
        
        if (types.includes(',')) {
            return types.split(',').map((item, index) => (
                <Badge key={index} className="mr-2 mb-2 bg-primary text-primary-foreground">
                    {item.trim()}
                </Badge>
            ));
        }
        
        return (
            <Badge className="mr-2 mb-2 bg-primary text-primary-foreground">
                {types}
            </Badge>
        );
    };
    
    // Toggle map visibility
    const toggleMap = useCallback(() => {
        setIsMapOpen(prev => !prev);
        
        // Force map to update size when opening
        if (!isMapOpen && mapInstanceRef.current) {
            setTimeout(() => {
                if (mapInstanceRef.current && isMountedRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 100);
        }
    }, [isMapOpen]);
    
    // Handle sheet opening and closing
    const handleSheetOpenChange = useCallback((open) => {
        setIsSheetOpen(open);
        
        if (!open) {
            // Clean up on close
            setTimeout(() => {
                if (isMountedRef.current) {
                    // Resetting states for next opening
                    setIsMapLoaded(false);
                }
            }, 300);
        }
    }, []);
    
    // Navigate to place history
    const handleViewHistory = useCallback(() => {
        router.get(`/places/${record.placeId}/history`);
    }, [record.placeId]);
    
    // Handle close click
    const handleCloseClick = useCallback(() => {
        handleSheetOpenChange(false);
    }, [handleSheetOpenChange]);
    
    // Organize fields in the same order as other forms for consistency
    const formFields = [
        {
            id: "placeName",
            label: "Place Name",
            type: "input",
            value: record.placeName || "N/A"
        },
        {
            id: "placeBusinessStatus",
            label: "Business Status",
            type: "input",
            value: formatBusinessStatus(record.placeBusinessStatus)
        },
        {
            id: "placeStatus",
            label: "Place Status",
            type: "input",
            value: record.placeStatus || "None"
        },
        {
            id: "location",
            label: "Location",
            type: "map"
        },
        {
            id: "placeAddress",
            label: "Address",
            type: "textarea",
            value: record.placeAddress || "No address available"
        },
        {
            id: "placeDistrict",
            label: "District",
            type: "input",
            value: record.placeDistrict || "No district available"
        },
        {
            id: "placeTypes",
            label: "Types",
            type: "types",
            value: record.placeTypes || "None"
        },
        {
            id: "placeCategory",
            label: "Category",
            type: "input",
            value: formatCategory(record.placeCategory)
        },
        {
            id: "description",
            label: "Description",
            type: "textarea",
            value: record.description || "No description available"
        },
        {
            id: "source",
            label: "Source",
            type: "input",
            value: record.source || "BM"
        },
        {
            id: "metadata",
            label: "Metadata",
            type: "metadata"
        }
    ];
    
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
                open={isSheetOpen} 
                onOpenChange={handleSheetOpenChange}
            >
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                
                <SheetContent 
                    className="min-w-[30vw] w-full sm:min-w-[35vw] flex flex-col max-h-full overflow-hidden sheet-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <SheetHeader className="sticky top-0 z-10 bg-background pb-4">
                        <SheetTitle>{record.placeName}</SheetTitle>
                        <SheetDescription>
                            Place details for version {record.isCurrent ? "(Current)" : ""}
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto pr-1">
                        <div className="p-4">
                            <div className="bg-blue-50 p-3 rounded mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>ETL System:</strong> Viewing historical version of this place.
                                    {record.isCurrent && " This is the current version."}
                                </p>
                            </div>
                            
                            <div className="grid gap-4">
                                {formFields.map((field) => {
                                    if (field.type === "map") {
                                        return (
                                            <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                                                <Label className="text-right mt-2">
                                                    {field.label}
                                                </Label>
                                                <div className="col-span-3">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={toggleMap}
                                                            className="flex-1"
                                                        >
                                                            <MapIcon className="mr-2 h-4 w-4" />
                                                            {isMapOpen ? "Hide Map" : "Show Map"}
                                                        </Button>
                                                    </div>
                                                    
                                                    {isMapOpen && (
                                                        <Card className="p-1 mb-3 relative">
                                                            <div 
                                                                ref={mapRef} 
                                                                className="h-64 w-full rounded-md border" 
                                                                aria-label="Static map showing location"
                                                            />
                                                            
                                                            {!isMapLoaded && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                                </div>
                                                            )}
                                                            
                                                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                                                Location map (read-only)
                                                            </p>
                                                        </Card>
                                                    )}
                                                        
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-sm font-normal mb-1 block">
                                                                Latitude
                                                            </Label>
                                                            <Input
                                                                value={record.placeLatitude || ""}
                                                                disabled
                                                                className="bg-gray-50"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-normal mb-1 block">
                                                                Longitude
                                                            </Label>
                                                            <Input
                                                                value={record.placeLongitude || ""}
                                                                disabled
                                                                className="bg-gray-50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    if (field.type === "types") {
                                        return (
                                            <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                                                <Label className="text-right mt-2">
                                                    {field.label}
                                                </Label>
                                                <div className="col-span-3">
                                                    <div className="py-2 min-h-10 bg-gray-50 rounded-md px-3 flex flex-wrap items-center">
                                                        {renderTypes(field.value)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    if (field.type === "metadata") {
                                        return (
                                            <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                                                <Label className="text-right mt-2">
                                                    {field.label}
                                                </Label>
                                                <div className="col-span-3">
                                                    <Card className="p-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-sm font-normal mb-1 block">
                                                                    Created At
                                                                </Label>
                                                                <Input
                                                                    value={formatDateLocal(record.created_at)}
                                                                    disabled
                                                                    className="bg-gray-50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-normal mb-1 block">
                                                                    Place ID
                                                                </Label>
                                                                <Input
                                                                    value={record.placeId || ""}
                                                                    disabled
                                                                    className="bg-gray-50"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                                            <Label className="text-right mt-2">
                                                {field.label}
                                            </Label>
                                            <div className="col-span-3">
                                                {field.type === "input" && (
                                                    <Input
                                                        value={field.value}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                )}
                                                
                                                {field.type === "textarea" && (
                                                    <Textarea
                                                        value={field.value}
                                                        disabled
                                                        className="bg-gray-50"
                                                        rows={3}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            
                        </div>
                    </div>
                    
                    <SheetFooter className="sticky bottom-0 z-10 bg-background pt-2 mt-auto">
                        <Button type="button" variant="outline" onClick={handleCloseClick} className="flex-1">
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}