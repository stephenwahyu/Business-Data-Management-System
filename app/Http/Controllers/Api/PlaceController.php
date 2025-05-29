<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlaceController extends Controller
{
    public function index(Request $request)
    {
    // Use the query parameters for pagination (optional page and per_page parameters)
    $perPage = $request->input('per_page', 15); // Default to 15 per page
    $places = Place::current()->paginate($perPage);

    return response()->json(['data' => $places], 200);
    }

    public function sync(Request $request)
    {
    $data = $request->validate([
        'places' => 'required|array',
        'places.*.placeId' => 'required|string',
        'places.*.placeName' => 'required|string|max:255',
        'places.*.placeBusinessStatus' => 'nullable|string|max:100',
        'places.*.placeStatus' => 'nullable|string|max:100',
        'places.*.placeAddress' => 'nullable|string',
        'places.*.placeDistrict' => 'nullable|string|max:255',
        'places.*.placeTypes' => 'nullable|string',
        'places.*.placeLatitude' => 'required|string|max:30',
        'places.*.placeLongitude' => 'required|string|max:30',
        'places.*.placeCategory' => 'required|string|max:100',
        'places.*.description' => 'nullable|string',
        'places.*.source' => 'nullable|string|max:50',
    ]);

    $synced = [];

    foreach ($data['places'] as $placeData) {
        DB::beginTransaction();

        try {
            $existingPlace = Place::where('placeId', $placeData['placeId'])
                ->where('isCurrent', true)
                ->first();

            if ($existingPlace) {
                // Mark old as not current
                $existingPlace->update(['isCurrent' => false]);
            }

            // Insert new (or first-time) version
            $placeData['isCurrent'] = true;
            $placeData['created_by'] = Auth::id();// Optional

            $newPlace = Place::create($placeData);
            $synced[] = $newPlace;

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Sync failed for placeId {$placeData['placeId']}: " . $e->getMessage());
        }
    }

    return response()->json([
        'message' => 'Sync complete',
        'syncedCount' => count($synced),
        'synced' => $synced
    ]);
    }
}
