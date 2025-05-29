<?php

namespace App\Http\Controllers;

use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HistoryController extends Controller
{
    // Define constants for filter parameters
    private const FILTER_SEARCH = 'search';
    private const FILTER_CATEGORY = 'category';
    private const FILTER_BUSINESS_STATUS = 'businessStatus';
    private const FILTER_PLACE_STATUS = 'placeStatus';
    private const FILTER_DISTRICT = 'district';
    private const FILTER_SORT_FIELD = 'sort_field';
    private const FILTER_SORT_DIRECTION = 'sort_direction';
    private const FILTER_PAGE = 'page';
    private const FILTER_PER_PAGE = 'per_page';

    /**
     * Display the global history view with optimized place records.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Build base query with only necessary columns
        // Filter only for historical records (isCurrent = false)
        $query = Place::query()
            ->select([
                'id',
                'placeId',
                'placeName',
                'placeAddress',
                'placeDistrict',
                'placeBusinessStatus',
                'placeCategory',
                'placeStatus',
                'placeTypes',
                'placeLatitude',
                'placeLongitude',
                'source',
                'created_by',
                'created_at',
                'isCurrent'
            ])
            ->where('isCurrent', false) // Only retrieve historical records
            ->with(['creator' => function ($query) {
                $query->select('id', 'name');
            }]);

        // Apply filters efficiently
        $this->applyFilters($query, $request);

        // Get sorting parameters
        $sortField = $request->input(self::FILTER_SORT_FIELD, 'created_at');
        $sortDirection = $request->input(self::FILTER_SORT_DIRECTION, 'desc');
        $perPage = (int) $request->input(self::FILTER_PER_PAGE, 10);

        // Apply sorting
        $query->orderBy($sortField, $sortDirection);

        // Paginate with optimized settings
        $history = $query->paginate($perPage)->withQueryString();

        // Get active filters for the frontend
        $activeFilters = $this->getActiveFilters($request, $sortField, $sortDirection);

        // Only load filter options if needed for an advanced search
        $filters = $request->has('advanced_search') ? $this->getFilterOptions() : null;

        // Return the Inertia view with data
        return Inertia::render('overview/placeHistory', [
            'history' => $history,
            'filters' => $filters,
            'activeFilters' => $activeFilters
        ]);
    }

    /**
     * Apply filters efficiently to the query
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param \Illuminate\Http\Request $request
     * @return void
     */
    private function applyFilters($query, Request $request)
    {
        // Only execute search if term is meaningful (more than 2 chars)
        if ($request->filled(self::FILTER_SEARCH) && strlen($request->input(self::FILTER_SEARCH)) > 2) {
            $search = "%{$request->input(self::FILTER_SEARCH)}%";
            $query->where(function ($q) use ($search) {
                $q->where('placeId', 'like', $search)
                    ->orWhere('placeName', 'like', $search)
                    // Limit search fields to indexed columns for performance
                    ->orWhere('placeCategory', 'like', $search)
                    ->orWhere('placeDistrict', 'like', $search);
            });
        }

        // Apply direct equality filters efficiently
        $this->applyEqualityFilter($query, $request, self::FILTER_BUSINESS_STATUS, 'placeBusinessStatus');
        $this->applyEqualityFilter($query, $request, self::FILTER_CATEGORY, 'placeCategory');
        $this->applyEqualityFilter($query, $request, self::FILTER_PLACE_STATUS, 'placeStatus');
        $this->applyEqualityFilter($query, $request, self::FILTER_DISTRICT, 'placeDistrict');
    }

    /**
     * Helper method to apply equality filters
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param \Illuminate\Http\Request $request
     * @param string $filterName
     * @param string $columnName
     * @return void
     */
    private function applyEqualityFilter($query, Request $request, $filterName, $columnName)
    {
        if ($request->filled($filterName)) {
            $value = $request->input($filterName);
            if ($value === 'null') {
                $query->whereNull($columnName);
            } else {
                $query->where($columnName, $value);
            }
        }
    }

    /**
     * Get active filters for the frontend
     *
     * @param \Illuminate\Http\Request $request
     * @param string $sortField
     * @param string $sortDirection
     * @return array
     */
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
            self::FILTER_PER_PAGE => $request->input(self::FILTER_PER_PAGE, 10),
            self::FILTER_PAGE => $request->input(self::FILTER_PAGE, 1),
        ];
    }

    /**
     * Get filter options optimized for filter dropdowns
     * Using a single query approach to reduce database calls
     *
     * @return array
     */
    private function getFilterOptions()
    {
        // Using DB::raw approach to get all distinct values in one query
        // This is much more efficient than multiple separate queries
        $distincts = DB::table('places')
            ->select(
                DB::raw('JSON_ARRAYAGG(DISTINCT placeCategory) as categories'),
                DB::raw('JSON_ARRAYAGG(DISTINCT placeBusinessStatus) as businessStatuses'),
                DB::raw('JSON_ARRAYAGG(DISTINCT placeStatus) as placeStatuses'),
                DB::raw('JSON_ARRAYAGG(DISTINCT placeDistrict) as districts')
            )
            ->where('isCurrent', false) // Only get filter options from historical records
            ->whereNotNull('placeCategory')
            ->whereNotNull('placeBusinessStatus')
            ->whereNotNull('placeStatus')
            ->whereNotNull('placeDistrict')
            ->first();

        // Parse the JSON arrays
        return [
            'categories' => json_decode($distincts->categories ?? '[]'),
            'businessStatuses' => json_decode($distincts->businessStatuses ?? '[]'),
            'placeStatuses' => json_decode($distincts->placeStatuses ?? '[]'),
            'districts' => json_decode($distincts->districts ?? '[]'),
        ];
    }
}