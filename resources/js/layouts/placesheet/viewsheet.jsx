import React, { useEffect, useRef, useState } from "react";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { History, MapIcon } from "lucide-react";
import { router } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Card } from "@/Components/ui/card";

export default function ViewSheet({ place }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [isMapOpen, setIsMapOpen] = useState(true);
    
    // Handle map initialization
    useEffect(() => {
        if (!window.L || !isMapOpen || !mapRef.current) return;
        if (mapInstanceRef.current) return;
        
        const latitude = parseFloat(place.placeLatitude) || -6.2088;
        const longitude = parseFloat(place.placeLongitude) || 106.8456;
        
        const map = window.L.map(mapRef.current, {
            dragging: true,
            scrollWheelZoom: true,
            zoomControl: false,
            doubleClickZoom: true,
            attributionControl: false,
            touchZoom: false
        }).setView([latitude, longitude], 20);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        
        // Add a static marker
        window.L.marker([latitude, longitude]).addTo(map);
        
        mapInstanceRef.current = map;
        
        // Ensure map renders correctly
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isMapOpen, place.placeLatitude, place.placeLongitude]);
    
    // Toggle map visibility
    const toggleMap = () => {
        setIsMapOpen(prev => !prev);
        
        if (!isMapOpen && mapInstanceRef.current) {
            setTimeout(() => {
                mapInstanceRef.current.invalidateSize();
            }, 100);
        }
    };

    // Convert business status to proper display format
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

    const handleViewHistory = () => {
        router.get(`/places/history/${place.placeId}`);
    };

    // Organize fields in the same order as the form
    const formFields = [
        {
            id: "placeName",
            label: "Place Name",
            type: "input",
            value: place.placeName || "N/A"
        },
        {
            id: "placeBusinessStatus",
            label: "Business Status",
            type: "input",
            value: formatBusinessStatus(place.placeBusinessStatus)
        },
        {
            id: "placeStatus",
            label: "Place Status",
            type: "input",
            value: place.placeStatus || "None"
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
            value: place.placeAddress || "No address available"
        },
        {
            id: "placeDistrict",
            label: "District",
            type: "input",
            value: place.placeDistrict || "No address available"
        },
        {
            id: "placeTypes",
            label: "Types",
            type: "types",
            value: place.placeTypes || "None"
        },
        {
            id: "placeCategory",
            label: "Category",
            type: "input",
            value: formatCategory(place.placeCategory)
        },
        {
            id: "description",
            label: "Description",
            type: "textarea",
            value: place.description || "No description available"
        },
        {
            id: "source",
            label: "Source",
            type: "input",
            value: place.source || "BM"
        },
        {
            id: "metadata",
            label: "Metadata",
            type: "metadata"
        }
    ];

    return (
        <div className="p-4">
            <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-sm text-blue-800">
                    <strong>ETL System:</strong> This data was loaded from the database. 
                    All changes are versioned to preserve history.
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
                                        <Card className="p-1 mb-3">
                                            <div 
                                                ref={mapRef} 
                                                className="h-64 w-full rounded-md border" 
                                                aria-label="Static map showing location"
                                            />
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
                                                value={place.placeLatitude || ""}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-normal mb-1 block">
                                                Longitude
                                            </Label>
                                            <Input
                                                value={place.placeLongitude || ""}
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
                                                    value={new Date(place.created_at).toLocaleString()}
                                                    disabled
                                                    className="bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-normal mb-1 block">
                                                    Place ID
                                                </Label>
                                                <Input
                                                    value={place.placeId || ""}
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
            
            <div className="mt-6 pt-4 border-t border-gray-200">
                <Button 
                    variant="outline" 
                    onClick={handleViewHistory}
                    className="w-full"
                >
                    <History className="mr-2 h-4 w-4" />
                    View Version History
                </Button>
            </div>
        </div>
    );
}