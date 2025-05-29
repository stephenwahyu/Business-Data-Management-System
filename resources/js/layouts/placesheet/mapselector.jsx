import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { MapIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MapSelector({ 
  initialLatitude, 
  initialLongitude, 
  onLocationChange,
  onAddressChange,
  className
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingReverse, setIsGeocodingReverse] = useState(false);
  
  // Function to reverse geocode - get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    setIsGeocodingReverse(true);
    
    try {
      // Using Nominatim OpenStreetMap API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=20&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();

      
      
      if (data && data.display_name) {
        // Extract district information
        let district = data.address?.district || 
                        data.address?.suburb || 
                        data.address?.neighbourhood || 
                        data.address?.city_district ||
                        '';

        let subDistrict = data.address?.village ||
                        '';
        let road = data.address?.road ||
                        '';
        
        district = district.trim().replace(/^District of\s+/i, '').replace(/^District\s+/i, '');
        subDistrict = subDistrict.trim().replace(/^Subdistrict of\s+/i, '').replace(/^Subdistrict\s+/i, '');
        road = road.trim().replace(/^Jalan\s+/i, '').replace(/^Jl.\s+/i, '').replace(/^Jl\s+/i, '').replace(/^.\s+/i, '');
        let districtAddress = 'Kec. '+district;
        let subDistrictAddress = 'Jl. '+subDistrict;
        let roadAddress = road ? 'Jl. ' + road : '';


        // Construct a cleaner address manually
        const address = [
          data.address.house_number,
          roadAddress,
          districtAddress ,
          data.address.city || data.address.town || subDistrictAddress,
          data.address.state,
          data.address.postcode,
          data.address.country
        ].filter(Boolean).join(', ');

        // Now send the clean address and district
        onAddressChange(address, district);

        console.log(data);
        
        toast.success("Address retrieved", {
          description: "Location address and district have been automatically populated.",
        });
      } else {
        toast.warning("Address incomplete", {
          description: "Could not retrieve full address for this location.",
        });
      }
    } catch (error) {
      toast.error("Geocoding error", {
        description: "Could not retrieve address information.",
      });
      console.error("Reverse geocoding error:", error);
    } finally {
      setIsGeocodingReverse(false);
    }
  };
  
  const getUserLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support geolocation",
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 20);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = window.L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
          }

          onLocationChange(latitude, longitude);
          
          // Get address for the location
          reverseGeocode(latitude, longitude);
        }

        toast.success("Location found", {
          description: "Map has been centered on your current location.",
        });

        setIsLocating(false);
      },
      (error) => {
        let errorMessage = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "Unknown error occurred";
            break;
        }

        toast.error("Location error", {
          description: errorMessage,
        });

        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  useEffect(() => {
    // Don't initialize map if Leaflet isn't loaded, map isn't open, or ref doesn't exist
    if (!window.L || !isMapOpen || !mapRef.current) return;
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) {
      // Just refresh the map size if it's already initialized
      mapInstanceRef.current.invalidateSize();
      return;
    }
    
    const latitude = initialLatitude || -6.2088;
    const longitude = initialLongitude || 106.8456;
    
    const map = window.L.map(mapRef.current, {
        dragging: true,
        scrollWheelZoom: true,
        zoomControl: false,
        doubleClickZoom: true,
        attributionControl: false
    }).setView([latitude, longitude], 16);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    markerRef.current = window.L.marker([latitude, longitude]).addTo(map);
    
    if (initialLatitude == null || initialLongitude == null) {
      getUserLocation();
    } else {
      // Get address for initial coordinates
      // reverseGeocode(latitude, longitude);
    }

    // Add click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = window.L.marker([lat, lng]).addTo(map);
      }

      onLocationChange(lat, lng);
      
      // Get address for the clicked location
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isMapOpen, initialLatitude, initialLongitude]);
  
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapOpen) return;
    
    const map = mapInstanceRef.current;
    
    if (initialLatitude && initialLongitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLatitude, initialLongitude]);
      } else {
        markerRef.current = window.L.marker([initialLatitude, initialLongitude]).addTo(map);
      }
      
      map.setView([initialLatitude, initialLongitude], map.getZoom());
    }
  }, [initialLatitude, initialLongitude, isMapOpen]);
  
  const toggleMap = () => {
    setIsMapOpen(prev => !prev);
    
    if (!isMapOpen && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  };
  
  return (
    <div className={className}>
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
        
        {isMapOpen && (
          <Button
            type="button"
            variant="secondary"
            onClick={getUserLocation}
            disabled={isLocating || isGeocodingReverse}
            className="flex-1"
          >
            {isLocating || isGeocodingReverse ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="1" />
              </svg>
            )}
            {isLocating ? "Locating..." : isGeocodingReverse ? "Getting Address..." : "Use My Location"}
          </Button>
        )}
      </div>
      
      {isMapOpen && (
        <Card className="p-1 mb-2">
          <div 
            ref={mapRef} 
            className="h-64 w-full rounded-md border" 
            aria-label="Interactive map to select location"
          />
          <p className="text-xs text-muted-foreground text-center">
            Click on the map to select a location{isGeocodingReverse ? ' (retrieving address...)' : ''}
          </p>
        </Card>
      )}
    </div>
  );
}