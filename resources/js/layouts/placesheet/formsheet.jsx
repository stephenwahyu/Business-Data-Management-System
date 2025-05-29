import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";
import MapSelector from "./MapSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useReactHookForm } from "react-hook-form";
import { placeSchema } from "@/lib/formschema";

const businessStatusOptions = [
    { value: null, label: "None" },
    { value: "OPERATIONAL", label: "Operational" },
    { value: "CLOSED_TEMPORARILY", label: "Closed Temporarily" },
    { value: "CLOSED_PERMANENTLY", label: "Closed Permanently" },
];
const statusOptions = [
    { value: "AKTIF", label: "Aktif" },
    { value: "TIDAK AKTIF", label: "Tidak Aktif" },
    { value: "TIDAK DITEMUKAN", label: "Tidak Ditemukan" },
];
const sourceOptions = [
    { value: "GMAPS", label: "Google Maps" },
    { value: "OSM", label: "Open Street Map" },
    { value: "SENSUS/SURVEY", label: "Sensus / Survey" },
    { value: "SEKUNDER/INSTANSI", label: "Sekunder / Instansi" },
];

const categoryOptions = [
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

export default function FormSheet({ form, onSubmit, mode, onSelectOpenChange, validationErrors = {} }) {
    // Use a single ref to track all open select IDs
    const openSelectRef = useRef(null);
    
    // Use react-hook-form for additional validation
    const {
        formState: { errors: hookFormErrors },
        trigger,
        setValue,
        register
    } = useReactHookForm({
        resolver: zodResolver(placeSchema),
        defaultValues: form.data,
        mode: "onChange"
    });

    // Combine validation errors from different sources
    const combinedErrors = { ...validationErrors, ...hookFormErrors };
    
    // Parse latitude and longitude from form data
    const [latitude, setLatitude] = useState(parseFloat(form.data.placeLatitude) || "");
    const [longitude, setLongitude] = useState(parseFloat(form.data.placeLongitude) || "");

    // Update internal state when form data changes externally
    useEffect(() => {
        const lat = parseFloat(form.data.placeLatitude);
        const lng = parseFloat(form.data.placeLongitude);
        
        if (!isNaN(lat)) setLatitude(lat);
        if (!isNaN(lng)) setLongitude(lng);
        
        // Update react-hook-form when form data changes
        Object.entries(form.data).forEach(([key, value]) => {
            setValue(key, value);
        });
    }, [form.data, setValue]);

    // Handle coordinate changes from map
    const handleLocationChange = useCallback((lat, lng) => {
        // Update both internal state and form data
        setLatitude(lat);
        setLongitude(lng);
        form.setData("placeLatitude", lat.toString());
        form.setData("placeLongitude", lng.toString());
        
        // Update react-hook-form
        setValue("placeLatitude", lat.toString());
        setValue("placeLongitude", lng.toString());
    }, [form, setValue]);

    // Handle address and district change from map
    const handleAddressChange = useCallback((address, district) => {
        if (address) {
            form.setData("placeAddress", address);
            setValue("placeAddress", address);
        }
        if (district) {
            form.setData("placeDistrict", district);
            setValue("placeDistrict", district);
        }
    }, [form, setValue]);

    // Handle coordinates input change
    const handleLatLngInputChange = useCallback((field, value) => {
        form.setData(field, value);
        setValue(field, value);
        
        // Update local state for the map
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
            if (field === "placeLatitude") setLatitude(parsedValue);
            if (field === "placeLongitude") setLongitude(parsedValue);
        }
    }, [form, setValue]);

    // Simplified select open/close handling with ref
    const handleSelectOpenChange = useCallback((id, isOpen) => {
        // Update the ref to track which select is open
        openSelectRef.current = isOpen ? id : null;
        
        // Notify parent about any select being open
        if (onSelectOpenChange) {
            onSelectOpenChange(isOpen);
        }
    }, [onSelectOpenChange]);

    // Validate before submitting
    const validateAndSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // Trigger form validation
        const isValid = await trigger();
        
        if (isValid) {
            // Proceed with submission if valid
            onSubmit(e);
        }
    }, [trigger, onSubmit]);

    // Reorder form fields to place address and district after location
    const formFields = [
        {
            id: "placeName",
            label: "Place Name",
            type: "input",
            required: true
        },
        {
            id: "placeBusinessStatus",
            label: "Business Status",
            type: "select",
            options: businessStatusOptions,
        },
        {
            id: "placeStatus",
            label: "Place Status",
            type: "select",
            options: statusOptions,
            required: true
        },
        {
            id: "location",
            label: "Location",
            type: "map",
            children: [
                {
                    id: "placeLatitude",
                    label: "Latitude",
                    type: "input",
                    required: true
                },
                {
                    id: "placeLongitude",
                    label: "Longitude",
                    type: "input",
                    required: true
                }
            ]
        },
        {
            id: "placeAddress",
            label: "Address",
            type: "textarea",
            hint: "Automatically retrieved when location is selected"
        },
        {
            id: "placeDistrict",
            label: "District",
            type: "input",
            hint: "Automatically retrieved when location is selected"
        },
        {
            id: "placeTypes",
            label: "Types",
            type: "textarea"
        },
        {
            id: "placeCategory",
            label: "Category",
            type: "select",
            options: categoryOptions,
            required: true
        },
        {
            id: "description",
            label: "Description",
            type: "textarea"
        },
        {
            id: "source",
            label: "Source",
            type: "select",
            options: sourceOptions,
            required: true
        }
    ];

    return (
        <form onSubmit={validateAndSubmit} className="p-4">
            <div className="grid gap-4">
                {formFields.map((field) => {
                    if (field.type === "map") {
                        return (
                            <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor={field.children[0].id} className="text-right mt-2">
                                    {field.label} <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-3">
                                    <MapSelector
                                        initialLatitude={latitude}
                                        initialLongitude={longitude}
                                        onLocationChange={handleLocationChange}
                                        onAddressChange={handleAddressChange}
                                        className="mb-2"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {field.children.map(child => (
                                            <div key={child.id}>
                                                <Label htmlFor={child.id} className="text-sm font-normal mb-1 block">
                                                    {child.label}
                                                </Label>
                                                <Input
                                                    id={child.id}
                                                    {...register(child.id)}
                                                    value={form.data[child.id]}
                                                    onChange={(e) => handleLatLngInputChange(child.id, e.target.value)}
                                                    required={child.required}
                                                    className={combinedErrors[child.id] ? "border-red-500" : ""}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {(combinedErrors.placeLatitude || combinedErrors.placeLongitude) && (
                                        <div className="text-sm text-red-500 mt-1">
                                            {combinedErrors.placeLatitude || combinedErrors.placeLongitude}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }
                    
                    return (
                        <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={field.id} className="text-right">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="col-span-3">
                                {field.type === "input" && (
                                    <>
                                        <Input
                                            id={field.id}
                                            {...register(field.id)}
                                            value={form.data[field.id] || ""}
                                            onChange={(e) => form.setData(field.id, e.target.value)}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            className={combinedErrors[field.id] ? "border-red-500" : ""}
                                        />
                                        {field.hint && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {field.hint}
                                            </p>
                                        )}
                                    </>
                                )}
                                
                                {field.type === "textarea" && (
                                    <>
                                        <Textarea
                                            id={field.id}
                                            {...register(field.id)}
                                            value={form.data[field.id] || ""}
                                            onChange={(e) => form.setData(field.id, e.target.value)}
                                            required={field.required}
                                            className={combinedErrors[field.id] ? "border-red-500" : ""}
                                        />
                                        {field.hint && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {field.hint}
                                            </p>
                                        )}
                                    </>
                                )}
                                
                                {field.type === "select" && (
                                    <TooltipProvider>
                                        <Select
                                            value={form.data[field.id]}
                                            onValueChange={(value) => {
                                                form.setData(field.id, value);
                                                setValue(field.id, value);
                                            }}

                                            onOpenChange={(isOpen) => handleSelectOpenChange(field.id, isOpen)}
                                            open={openSelectRef.current === field.id}
                                            disabled={mode === "add" && field.id === "placeStatus"} // Disable placeStatus select in add mode
                                        >
                                            <SelectTrigger 
                                                id={field.id}
                                                className={`w-full ${combinedErrors[field.id] ? "border-red-500" : ""}`}
                                            >
                                                <SelectValue placeholder={`Select ${field.label}`} />
                                            </SelectTrigger>
                                            <SelectContent 
                                                className="max-w-lg z-50"
                                                position="popper"
                                                side="bottom"
                                                align="start"
                                                sideOffset={5}
                                                onEscapeKeyDown={(e) => {
                                                    // Stop propagation to prevent sheet from closing
                                                    e.stopPropagation();
                                                    // Close the select
                                                    handleSelectOpenChange(field.id, false);
                                                }}
                                                onPointerDownOutside={(e) => {
                                                    // Stop propagation to prevent sheet from closing when clicking outside
                                                    e.stopPropagation();
                                                    // Let the select handle closing itself
                                                }}
                                                onInteractOutside={(e) => {
                                                    // Close the select when clicking outside
                                                    e.stopPropagation();
                                                    handleSelectOpenChange(field.id, false);
                                                }}
                                            >
                                                {field.options.map((option) => (
                                                    <Tooltip key={option.value || 'none'}>
                                                        <TooltipTrigger asChild>
                                                            <SelectItem 
                                                                value={option.value} 
                                                                className="pr-6 whitespace-normal break-words"
                                                                onPointerDown={(e) => {
                                                                    // Prevent default to handle the click ourselves
                                                                    e.preventDefault();
                                                                }}
                                                            >
                                                                <span className="block truncate">{field.id === "placeCategory" ? `${option.value}: ${option.label}`: option.label}</span>
                                                            </SelectItem>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="max-w-xs z-60">
                                                            {option.label}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TooltipProvider>
                                )}
                                
                                {combinedErrors[field.id] && (
                                    <div className="text-sm text-red-500 mt-1">
                                        {combinedErrors[field.id]}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </form>
    );
}