import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPinIcon } from 'lucide-react';
import axios from 'axios';

export default function SpatialStats({ viewport }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  
  // Fetch spatial stats when viewport changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        // Only fetch if we have bounds
        if (!viewport.bounds) {
          setStats(null);
          setLoading(false);
          return;
        }
        
        const response = await axios.get('/api/places', {
          params: {
            bounds: viewport.bounds,
            zoom: viewport.zoom,
            statsOnly: true
          },
          signal: abortControllerRef.current.signal
        });
        
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Error fetching spatial stats:', err);
          setError(err.message || 'Failed to fetch stats');
          setLoading(false);
        }
      }
    };
    
    fetchStats();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [viewport]);
  
  if (error) {
    return (
      <Card className="p-3 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">Error: {error}</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 shadow-sm">
      <h3 className="text-md font-semibold mb-3 flex items-center">
        <MapPinIcon className="h-4 w-4 mr-1" />
        Spatial Statistics
      </h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm">Loading stats...</span>
        </div>
      ) : !stats ? (
        <p className="text-sm text-gray-500">Move the map to see statistics</p>
      ) : (
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="density">Density</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="pt-2">
            <div className="space-y-1">
              {stats.categoryStats?.map((category) => (
                <div key={category.name} className="flex justify-between text-xs">
                  <span>{category.name || 'Uncategorized'}</span>
                  <span className="font-semibold">{category.count}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="pt-2">
            <div className="space-y-1">
              {stats.statusStats?.map((status) => (
                <div key={status.name} className="flex justify-between text-xs">
                  <span>{status.name || 'Unknown'}</span>
                  <span className="font-semibold">{status.count}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="density" className="pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Total Places</span>
                <span className="font-semibold">{stats.totalPlaces}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Area (km²)</span>
                <span className="font-semibold">{stats.areaKm2?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Density (places/km²)</span>
                <span className="font-semibold">{stats.density?.toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}