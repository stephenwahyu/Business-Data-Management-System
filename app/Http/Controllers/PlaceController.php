<?php

namespace App\Http\Controllers;

use App\Models\Place;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlaceController extends Controller
{
    private const FILTER_SEARCH = 'search';
    private const FILTER_CATEGORY = 'category';
    private const FILTER_BUSINESS_STATUS = 'businessStatus';
    private const FILTER_PLACE_STATUS = 'placeStatus';
    private const FILTER_DISTRICT = 'district';
    private const FILTER_SORT_FIELD = 'sort_field';
    private const FILTER_SORT_DIRECTION = 'sort_direction';
    private const FILTER_PAGE = 'page';
    

    public function index(Request $request)
    {
        // Add this to the top of your PlaceController.php index method
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
        
        $query = Place::query()->where('isCurrent', true);

        $this->applyFilters($query, $request);

        $sortField = $request->input(self::FILTER_SORT_FIELD, 'created_at');
        $sortDirection = $request->input(self::FILTER_SORT_DIRECTION, 'desc');

        // Apply primary sorting
        $query->orderBy($sortField, $sortDirection);
        
        // Add secondary sorting only if it's different from primary
        if ($sortField !== 'placeName') {
            $query->orderBy('placeName', $sortDirection);
        }

        $places = $query->paginate(15)->withQueryString();
        $filters = $this->getFilterOptions();
        $activeFilters = $this->getActiveFilters($request, $sortField, $sortDirection);
        
        return Inertia::render('overview/places', [
            'places' => $places,
            'filters' => $filters,
            'activeFilters' => $activeFilters,
        ]);
    }

    private function applyFilters($query, Request $request)
    {
        // Search filter - improved with better LIKE matching
        if ($request->filled(self::FILTER_SEARCH)) {
            $search = trim($request->input(self::FILTER_SEARCH));
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('placeName', 'LIKE', "%{$search}%")
                        ->orWhere('placeId', 'LIKE', "%{$search}%")
                        ->orWhere('placeAddress', 'LIKE', "%{$search}%")
                        ->orWhere('placeDistrict', 'LIKE', "%{$search}%")
                        ->orWhere('placeCategory', 'LIKE', "%{$search}%");
                });
            }
        }

        // Business Status filter
        if ($request->filled(self::FILTER_BUSINESS_STATUS)) {
            $businessStatus = $request->input(self::FILTER_BUSINESS_STATUS);
            if ($businessStatus === 'null') {
                $query->whereNull('placeBusinessStatus');
            } else {
                $query->where('placeBusinessStatus', $businessStatus);
            }
        }

        // Category filter
        if ($request->filled(self::FILTER_CATEGORY)) {
            $category = $request->input(self::FILTER_CATEGORY);
            if ($category === 'null') {
                $query->whereNull('placeCategory');
            } else {
                $query->where('placeCategory', $category);
            }
        }

        // Place Status filter
        if ($request->filled(self::FILTER_PLACE_STATUS)) {
            $placeStatus = $request->input(self::FILTER_PLACE_STATUS);
            if ($placeStatus === 'null') {
                $query->whereNull('placeStatus');
            } else {
                $query->where('placeStatus', $placeStatus);
            }
        }

        // District filter
        if ($request->filled(self::FILTER_DISTRICT)) {
            $district = $request->input(self::FILTER_DISTRICT);
            if ($district === 'null') {
                $query->whereNull('placeDistrict');
            } else {
                $query->where('placeDistrict', $district);
            }
        }
    }

    private function getActiveFilters(Request $request, $sortField, $sortDirection)
    {
        return [
            self::FILTER_SEARCH => $request->input(self::FILTER_SEARCH, ''),
            self::FILTER_CATEGORY => $request->input(self::FILTER_CATEGORY, ''),
            self::FILTER_BUSINESS_STATUS => $request->input(self::FILTER_BUSINESS_STATUS, ''),
            self::FILTER_PLACE_STATUS => $request->input(self::FILTER_PLACE_STATUS, ''),
            self::FILTER_DISTRICT => $request->input(self::FILTER_DISTRICT, ''),
            self::FILTER_SORT_FIELD => $sortField,
            self::FILTER_SORT_DIRECTION => $sortDirection,
        ];
    }

    private function getFilterOptions()
    {
        $currentPlacesQuery = Place::where('isCurrent', true);

        return [
            'categories' => $this->getDistinctValues($currentPlacesQuery, 'placeCategory'),
            'businessStatuses' => $this->getDistinctValues($currentPlacesQuery, 'placeBusinessStatus'),
            'placeStatuses' => $this->getDistinctValues($currentPlacesQuery, 'placeStatus'),
            'districts' => $this->getDistinctValues($currentPlacesQuery, 'placeDistrict'),
        ];
    }

    private function getDistinctValues($baseQuery, $column)
    {
        return DB::table(DB::raw("({$baseQuery->toSql()}) as p"))
            ->mergeBindings($baseQuery->getQuery())
            ->select($column)
            ->distinct()
            ->whereNotNull($column)
            ->pluck($column);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $validated = $this->validatePlaceData($request);
            $validated['created_by'] = Auth::id();
            $validated['isCurrent'] = true;
            
            // Automatically set placeStatus to 'BARU' for new places
            $validated['placeStatus'] = 'BARU';

            Place::create($validated);

            DB::commit();
            return redirect()->back()->with('success', 'Place added successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add place: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->back()->withErrors(['error' => 'Failed to add place: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $currentPlace = Place::findOrFail($id);
            $validated = $this->validatePlaceData($request);
            
            // Check if any changes were made (backend validation)
            $hasChanges = false;
            foreach ($validated as $key => $value) {
                // Normalize values for comparison
                $originalValue = $currentPlace->$key;
                $newValue = $value;
                
                // Handle nullable fields
                if (is_null($originalValue) && $newValue === "") {
                    continue; // Consider empty string equivalent to null
                }
                
                // String comparison with trimming for strings
                if (is_string($originalValue) && is_string($newValue)) {
                    if (trim($originalValue) !== trim($newValue)) {
                        $hasChanges = true;
                        break;
                    }
                } 
                // Regular comparison for non-strings
                else if ($originalValue != $newValue) {
                    $hasChanges = true;
                    break;
                }
            }
            
            if (!$hasChanges) {
                DB::rollBack();
                return redirect()->back()->withErrors(['error' => 'No changes detected. Please make changes before creating a new version.']);
            }
            
            $currentPlace->update(['isCurrent' => false]);

            $newPlaceData = array_merge([
                'placeId' => $currentPlace->placeId,
                'created_by' => Auth::id(),
                'isCurrent' => true,
            ], $validated);

            Place::create($newPlaceData);

            DB::commit();
            return redirect()->back()->with('success', 'New version created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create new version: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->back()->withErrors(['error' => 'Failed to create new version: ' . $e->getMessage()]);
        }
    }

    public function history($placeId)
    {
        $currentPlace = Place::where('placeId', $placeId)
            ->where('isCurrent', true)
            ->first();

        if (!$currentPlace) {
            return redirect('/places')->with('error', 'Place not found');
        }

        $historyRecords = Place::where('placeId', $placeId)
            ->with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('overview/history', [
            'currentPlace' => $currentPlace,
            'history' => $historyRecords
        ]);
    }

    public function allHistory(Request $request)
    {
        $query = Place::query()
            ->where('isCurrent', false);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('placeName', 'like', "%{$search}%")
                    ->orWhere('placeId', 'like', "%{$search}%")
                    ->orWhere('placeAddress', 'like', "%{$search}%")
                    ->orWhere('placeDistrict', 'like', "%{$search}%")
                    ->orWhere('placeCategory', 'like', "%{$search}%");
            });
        }

        $sortField = $request->input('sort_field', 'placeName');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $places = $query->with('creator:id,name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('overview/placeHistory', [
            'history' => $places,
            'activeFilters' => [
                'search' => $request->input('search', ''),
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function export(Request $request)
    {
        try {
            // Set headers early to ensure proper response type
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="places_export_' . date('Y-m-d_H-i-s') . '.csv"',
                'Cache-Control' => 'no-cache, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ];

            $query = Place::query()->where('isCurrent', true);
            
            // Apply the same filters as in index method
            $this->applyFilters($query, $request);
            
            // Apply sorting
            $sortField = $request->input(self::FILTER_SORT_FIELD, 'created_at');
            $sortDirection = $request->input(self::FILTER_SORT_DIRECTION, 'desc');
            $query->orderBy($sortField, $sortDirection);
            
            // Add secondary sorting only if it's different from primary
            if ($sortField !== 'placeName') {
                $query->orderBy('placeName', $sortDirection);
            }
            
            $places = $query->get();
            
            // Generate CSV content
            $csvContent = $this->generateCsv($places);
            
            // Return response with proper headers
            return response($csvContent, 200, $headers);
            
        } catch (\Exception $e) {
            Log::error('Failed to export places: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            // Return JSON error response instead of redirect for AJAX requests
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'error' => 'Failed to export places: ' . $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()->withErrors(['error' => 'Failed to export places: ' . $e->getMessage()]);
        }
    }

    private function generateCsv($places)
    {
        // Use output buffering to capture CSV content
        ob_start();
        $output = fopen('php://output', 'w');
        
        // Add BOM for UTF-8 encoding to ensure proper display in Excel
        fwrite($output, "\xEF\xBB\xBF");
        
        // CSV Headers
        $headers = [
            'Place ID',
            'Place Name',
            'Address',
            'District',
            'Business Status',
            'Place Status',
            'Category',
            'Types',
            'Latitude',
            'Longitude',
            'Description',
            'Source',
            'Created At'
        ];
        
        fputcsv($output, $headers);
        
        // Add data rows
        foreach ($places as $place) {
            $row = [
                $place->placeId ?? '',
                $place->placeName ?? '',
                $place->placeAddress ?? '',
                $place->placeDistrict ?? '',
                $place->placeBusinessStatus ?? '',
                $place->placeStatus ?? '',
                $place->placeCategory ?? '',
                $place->placeTypes ?? '',
                $place->placeLatitude ?? '',
                $place->placeLongitude ?? '',
                $place->description ?? '',
                $place->source ?? '',
                $place->created_at ? $place->created_at->format('Y-m-d H:i:s') : ''
            ];
            fputcsv($output, $row);
        }
        
        fclose($output);
        $csvContent = ob_get_clean();
        
        return $csvContent;
    }

    private function validatePlaceData(Request $request)
    {
        return $request->validate([
            'placeName' => 'required|string|max:255',
            'placeBusinessStatus' => 'nullable|string|max:100',
            'placeStatus' => 'nullable|string|max:100',
            'placeAddress' => 'nullable|string',
            'placeDistrict' => 'nullable|string|max:255',
            'placeTypes' => 'nullable|string',
            'placeLatitude' => 'required|string|max:30',
            'placeLongitude' => 'required|string|max:30',
            'placeCategory' => 'required|string|max:100',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:50',
        ]);
    }

    public function checkExists(Request $request)
    {
        $request->validate([
            'placeName' => 'required|string',
            'placeLatitude' => 'required|string',
            'placeLongitude' => 'required|string'
        ]);

        $exists = Place::where('isCurrent', true)
            ->where('placeName', $request->placeName)
            ->where('placeLatitude', $request->placeLatitude)
            ->where('placeLongitude', $request->placeLongitude)
            ->exists();

        return response()->json(['exists' => $exists]);
    }
}