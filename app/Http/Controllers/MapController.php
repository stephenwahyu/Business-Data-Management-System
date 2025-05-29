<?php

namespace App\Http\Controllers;

use App\Models\Place;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;

class MapController extends Controller
{
    /**
     * Display the map view with optimized place data
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Return the map view without data - data will be loaded asynchronously
        return Inertia::render('overview/mapview');
    }

    /**
     * Get places for map display with spatial filtering and clustering
     * Implements server-side clustering for better performance
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPlaces(Request $request)
    {
        try {
            // Extract map bounds and zoom level from request
            $bounds = $request->input('bounds', null);
            $zoomLevel = (int) $request->input('zoom', 13); // Default zoom level

            // Create cache key based on request parameters
            $cacheKey = "places_map_{$zoomLevel}_" . md5(json_encode($bounds));

            // Try to get from cache first (5 minute TTL)
            return Cache::remember($cacheKey, 300, function () use ($bounds, $zoomLevel) {
                // Adjust limit based on zoom level for better performance
                $limit = $this->getLimitByZoomLevel($zoomLevel);

                // Base query for current places
                $query = Place::current();

                // Apply spatial filtering if bounds are provided
                if ($bounds) {
                    $north = $bounds['north'] ?? null;
                    $south = $bounds['south'] ?? null;
                    $east = $bounds['east'] ?? null;
                    $west = $bounds['west'] ?? null;

                    if ($north && $south && $east && $west) {
                        $query->where('placeLatitude', '<=', $north)
                            ->where('placeLatitude', '>=', $south)
                            ->where('placeLongitude', '<=', $east)
                            ->where('placeLongitude', '>=', $west);
                    }
                }

                // Apply Level of Detail filtering based on zoom level
                $query = $this->applyLevelOfDetailFilters($query, $zoomLevel);

                // Select only necessary fields for map display
                $places = $query->select([
                    'id',
                    'placeId',
                    'placeName',
                    'placeAddress',
                    'placeLatitude',
                    'placeLongitude',
                    'placeCategory',
                    'placeBusinessStatus',
                    'description'
                ])
                    ->orderBy('placeCategory')
                    ->orderBy('placeName')
                    ->limit($limit)
                    ->get();

                // Format coordinates for proper display
                $places = $places->map(function ($place) {
                    $place->placeLatitude = (float) $place->placeLatitude;
                    $place->placeLongitude = (float) $place->placeLongitude;
                    return $place;
                });

                // Apply server-side clustering for better performance
                if ($zoomLevel < 18) {
                    return $this->clusterPlaces($places, $zoomLevel);
                }

                return $places;
            });
        } catch (QueryException $e) {
            return response()->json(['error' => 'Database error occurred: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while fetching places: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cluster places on the server side based on geographic proximity
     * 
     * @param \Illuminate\Support\Collection $places
     * @param int $zoomLevel
     * @return array
     */
    private function clusterPlaces($places, $zoomLevel)
    {
        if ($places->isEmpty()) {
            return [];
        }

        // High zoom levels get minimal clustering
        if ($zoomLevel >= 18) {
            return $places;
        }

        $clusters = [];
        $processed = [];

        // Adjust proximity threshold based on zoom level
        $proximityThreshold = $this->getProximityThreshold($zoomLevel);

        foreach ($places as $i => $place) {
            if (in_array($i, $processed)) {
                continue;
            }

            $cluster = [
                'id' => "cluster-{$i}",
                'isCluster' => true,
                'count' => 1,
                'categories' => [$place->placeCategory],
                'primaryCategory' => $place->placeCategory,
                'latitude' => $place->placeLatitude,
                'longitude' => $place->placeLongitude,
                'places' => [$place]
            ];

            $processed[] = $i;

            // Find nearby places to cluster
            foreach ($places as $j => $otherPlace) {
                if ($i === $j || in_array($j, $processed)) {
                    continue;
                }

                $distance = $this->calculateDistance(
                    $place->placeLatitude,
                    $place->placeLongitude,
                    $otherPlace->placeLatitude,
                    $otherPlace->placeLongitude
                );

                if ($distance <= $proximityThreshold) {
                    $cluster['count']++;
                    $cluster['places'][] = $otherPlace;

                    if (!in_array($otherPlace->placeCategory, $cluster['categories'])) {
                        $cluster['categories'][] = $otherPlace->placeCategory;
                    }

                    $processed[] = $j;
                }
            }

            // For single markers, return the original place data
            if ($cluster['count'] === 1) {
                $clusters[] = $cluster['places'][0];
            } else {
                $clusters[] = $cluster;
            }
        }

        return $clusters;
    }

    /**
     * Calculate distance between two coordinate points using Haversine formula
     * 
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in kilometers
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Earth radius in kilometers

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Get appropriate proximity threshold based on zoom level
     * 
     * @param int $zoomLevel
     * @return float
     */
    private function getProximityThreshold($zoomLevel)
    {
        $thresholds = [
            // zoom level => distance in km
            6 => 10.0,
            8 => 5.0,
            10 => 2.0,
            12 => 1.0,
            14 => 0.5,
            16 => 0.2,
            18 => 0.1,
        ];

        // Find the closest threshold
        $closest = 0.1; // Default minimum threshold

        foreach ($thresholds as $zoom => $threshold) {
            if ($zoomLevel <= $zoom) {
                $closest = $threshold;
                break;
            }
        }

        return $closest;
    }

    /**
     * Determine the appropriate query limit based on zoom level
     * 
     * @param int $zoomLevel
     * @return int
     */
    private function getLimitByZoomLevel($zoomLevel)
    {
        if ($zoomLevel < 10) {
            return 0; // Very zoomed out - fewer points
        } elseif ($zoomLevel < 13) {
            return 200; // Medium zoom - moderate number of points
        } elseif ($zoomLevel <= 17) {
            return 400; // Detailed zoom - more points
        } else {
            return 800; // Very detailed zoom - many points
        }
    }

    /**
     * Apply Level of Detail filtering based on zoom level
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $zoomLevel
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function applyLevelOfDetailFilters($query, $zoomLevel)
    {
        if ($zoomLevel < 6) {
            // Very low zoom (region level): Only government and major landmarks
            return $query->where(function ($q) {
                $q->where('placeCategory', 'O');
            });
        }
        if ($zoomLevel < 8) {
            // Very low zoom (region level): Only government and major landmarks
            return $query->where(function ($q) {
                $q->where('placeCategory', 'O');
            });
        } elseif ($zoomLevel < 10) {
            // Low zoom (city level): Add education, health, major business
            return $query->where(function ($q) {
                $q->whereIn('placeCategory', ['O', 'P', 'Q'])
                    ->orWhere('placeBusinessStatus', 'OPERATIONAL');
            });
        } elseif ($zoomLevel < 12) {
            // Medium zoom: Add more categories
            return $query->where(function ($q) {
                $q->whereIn('placeCategory', [
                    'O',
                    'P',
                    'Q',
                    'J',
                    'K',
                    'L',
                    'R'
                ]);
            });
        } elseif ($zoomLevel < 14) {
            // Higher zoom: All categories with some filtering
            // At this level, we'll include everything except the least important categories
            return $query->where(function ($q) {
                $q->whereNotIn('placeCategory', ['T', 'S']) // Exclude household activities and other services
                    ->orWhereNotNull('placeBusinessStatus');
            });
        } else {
            // Very high zoom: All places without category filtering
            return $query;
        }
    }
}
