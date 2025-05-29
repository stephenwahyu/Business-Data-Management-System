import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

// Define the coordinates for Pekanbaru, Indonesia
const PEKANBARU_COORDINATES = [0.5070677, 101.4477793];
const DEFAULT_ZOOM = 13;

// Category color mapping for markers
const CATEGORY_COLORS = {
  A: '#4CAF50', // Agriculture, Forestry and Fisheries - Green
  B: '#795548', // Mining and Quarrying - Brown
  C: '#FF5722', // Processing Industry - Deep Orange
  D: '#FFC107', // Electricity, Gas, Steam/Hot Water and Cold Air Supply - Amber
  E: '#2196F3', // Water Treatment, Waste Water Treatment - Blue
  F: '#9E9E9E', // Construction - Gray
  G: '#E91E63', // Wholesale and Retail Trade - Pink
  H: '#3F51B5', // Transportation and Warehousing - Indigo
  I: '#9C27B0', // Accommodation and Food Service - Purple
  J: '#00BCD4', // Information and Communication - Cyan
  K: '#FFEB3B', // Financial and Insurance Activities - Yellow
  L: '#FF9800', // Real Estate - Orange
  M: '#8BC34A', // Professional, Scientific and Technical Activities - Light Green
  N: '#03A9F4', // Rental and Leasing Activities - Light Blue
  O: '#F44336', // Government Administration, Defense - Red
  P: '#673AB7', // Education - Deep Purple
  Q: '#4CAF50', // Human Health and Social Work Activities - Green
  R: '#FF9800', // Arts, Entertainment and Recreation - Orange
  S: '#2196F3', // Other Service Activities - Blue
  T: '#9C27B0', // Household Activities - Purple
  U: '#607D8B', // Activities of International Bodies - Blue Gray
};

// Create a marker icon based on category - memoized for performance
const createIcon = (() => {
  const iconCache = {};
  
  return (category) => {
    // Return from cache if we already created this icon
    if (iconCache[category]) {
      return iconCache[category];
    }
    
    const color = CATEGORY_COLORS[category] || '#757575'; // Default gray if category not found
    
    const icon = new Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    
    // Store in cache
    iconCache[category] = icon;
    
    return icon;
  };
})();

// Create a cluster icon for grouping markers - memoized by cluster size
const createClusterIcon = (() => {
  const clusterCache = {};
  
  return (count, category) => {
    const cacheKey = `${count}-${category || 'default'}`;
    
    // Return from cache if available
    if (clusterCache[cacheKey]) {
      return clusterCache[cacheKey];
    }
    
    const primaryCategory = category || 'default';
    const color = CATEGORY_COLORS[primaryCategory] || '#757575';
    
    const icon = divIcon({
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white;">${count}</div>`,
      className: 'custom-cluster-icon',
      iconSize: [30, 30]
    });
    
    // Store in cache
    clusterCache[cacheKey] = icon;
    
    return icon;
  };
})();

// Custom hook to debounce map events
const useDebouncedMapEvents = (callback, delay = 300) => {
  const handleEvent = useDebouncedCallback(callback, delay);
  return useMapEvents({
    moveend: handleEvent,
    zoomend: handleEvent
  });
};

// Component to handle map events and data loading
function MapEventHandler({ onViewportChange }) {
  const map = useDebouncedMapEvents(() => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    onViewportChange({
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      zoom
    });
  });
  
  return null;
}

// Map attribution component
const Attribution = () => {
  return (
    <div className="absolute bottom-0 right-0 bg-white bg-opacity-70 px-2 py-1 text-xs z-10">
      &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">OpenStreetMap</a> contributors
    </div>
  );
};

// Component for map controls
function MapControls({ onResetView }) {
  const map = useMap();
  
  const handleReset = useCallback(() => {
    map.setView(PEKANBARU_COORDINATES, DEFAULT_ZOOM);
    onResetView();
  }, [map, onResetView]);
  
  return (
    <div className="absolute top-4 right-4 z-500 flex flex-col gap-2">
      <Button 
        variant="secondary" 
        size="sm" 
        className="bg-white shadow-md hover:bg-gray-100"
        onClick={handleReset}
      >
        Reset View
      </Button>
    </div>
  );
}

// Place Popup Component - extracted for better rendering performance
const PlacePopup = React.memo(({ place }) => (
  <div className="max-w-xs">
    <h3 className="font-bold text-lg mb-1">{place.placeName}</h3>
    {place.placeAddress && (
      <p className="text-sm mb-2">{place.placeAddress}</p>
    )}
    <div className="flex flex-wrap gap-1 mb-2">
      <Badge variant="outline" className="text-xs">
        {place.placeCategory}
      </Badge>
      {place.placeBusinessStatus && (
        <Badge 
          variant={place.placeBusinessStatus === 'OPERATIONAL' ? 'success' : 'secondary'} 
          className="text-xs"
        >
          {place.placeBusinessStatus}
        </Badge>
      )}
    </div>
    {place.description && (
      <p className="text-xs text-gray-600">{place.description}</p>
    )}
  </div>
));

// Cluster Popup Component - extracted for better rendering performance
const ClusterPopup = React.memo(({ item }) => (
  <div className="max-w-xs">
    <h3 className="font-bold text-lg mb-1">Group of {item.count} places</h3>
    <div className="flex flex-wrap gap-1 mb-2">
      {item.categories.map((category, i) => (
        <Badge key={i} variant="outline" className="text-xs">
          {category}
        </Badge>
      ))}
    </div>
    <p className="text-xs text-gray-600">Zoom in to see individual places</p>
  </div>
));

// Individual Place Marker Component
const PlaceMarker = React.memo(({ place }) => (
  <Marker
    position={[place.placeLatitude, place.placeLongitude]}
    icon={createIcon(place.placeCategory)}
  >
    <Popup>
      <PlacePopup place={place} />
    </Popup>
  </Marker>
));

// Cluster Marker Component  
const ClusterMarker = React.memo(({ cluster }) => (
  <Marker
    position={[cluster.latitude, cluster.longitude]}
    icon={createClusterIcon(cluster.count, cluster.primaryCategory)}
  >
    <Popup>
      <ClusterPopup item={cluster} />
    </Popup>
  </Marker>
));

export default function MapView() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewport, setViewport] = useState({
    bounds: null,
    zoom: DEFAULT_ZOOM
  });
  const mapRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Map container style
  const mapContainerStyle = {
    height: 'calc(100vh - 7rem)',
    width: '100%',
    position: 'relative',
    borderRadius: 'var(--radius-md)',
    zIndex: 0,
  };
  
  // Fetch places based on map viewport
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const params = {
        zoom: viewport.zoom
      };
      
      if (viewport.bounds) {
        params.bounds = viewport.bounds;
      }
      
      const response = await axios.get('/api/places', { 
        params,
        signal: abortControllerRef.current.signal
      });
      
      setMapData(response.data);
      setLoading(false);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('Error fetching places:', err);
        setError(err.message || 'Failed to fetch places');
        setLoading(false);
      }
    }
  }, [viewport]);
  
  // Initial data fetch
  useEffect(() => {
    console.log(viewport.zoom);
    fetchMapData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMapData]);
  
  // Handle viewport changes (debounced in the handler)
  const handleViewportChange = useCallback((newViewport) => {
    setViewport(prevViewport => ({
      ...prevViewport,
      ...newViewport
    }));
  }, []);
  
  // Handle reset view
  const handleResetView = useCallback(() => {
    setViewport({
      bounds: null,
      zoom: DEFAULT_ZOOM
    });
  }, []);
  
  // Render map items (markers & clusters) - memoized for performance
  const mapItems = useMemo(() => {
    return mapData.map((item) => {
      if (item.isCluster && item.count > 1) {
        return <ClusterMarker key={`cluster-${item.id}`} cluster={item} />;
      } else {
        return <PlaceMarker key={item.id || `place-${item.placeId}`} place={item} />;
      }
    });
  }, [mapData]);

  // Loading indicator overlay
  const loadingOverlay = loading && (
    <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md z-10 flex items-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
      <span className="text-sm">Loading map data...</span>
    </div>
  );

  // Error display
  if (error && !mapData.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Error Loading Map</h2>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loadingOverlay}
      
      <MapContainer
        center={PEKANBARU_COORDINATES}
        zoom={DEFAULT_ZOOM}
        style={mapContainerStyle}
        zoomControl={false}
        ref={mapRef}
        preferCanvas={true} // Use Canvas renderer for better performance with many markers
      >
        {/* Open Street Map tile layer */}
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Custom attribution */}
        <Attribution />
        
        {/* Event handlers */}
        <MapEventHandler onViewportChange={handleViewportChange} />
        
        {/* Custom map controls */}
        <MapControls onResetView={handleResetView} />
        
        {/* Custom position for zoom controls */}
        <ZoomControl position="bottomright" />
        
        {/* Place markers or clusters */}
        {mapItems}
      </MapContainer>
    </div>
  );
}