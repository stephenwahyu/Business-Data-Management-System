<?php

namespace App\Http\Controllers;

use App\Models\Place;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with user activity data
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Get time range from request or use default (30 days)
        $timeRange = $request->input('timeRange', '30d');
        
        // Get start date based on time range
        $startDate = $this->getStartDate($timeRange);
        
        // Get auth user for permissions check
        $authUser = Auth::user();
        
        // Determine if user can view other users' data (admin role)
        $canViewOtherUsers = $authUser->role_id === 1 || $authUser->role_id === 3;
        
        // Get user ID for filtering - only admins can view other users
        $userId = null;
        if ($canViewOtherUsers && $request->has('userId')) {
            $userId = $request->input('userId');
        } else {
            $userId = $authUser->id;
        }
        
        // OPTIMIZATION: Only generate statistics for the requested time range
        // unless this is an AJAX request for updating just user progress data
        $onlyUserProgress = $request->header('X-Inertia-Partial-Data') === 'userProgress';
        
        // Prepare response data
        $data = [
            'currentTimeRange' => $timeRange,
        ];
        
        // Only fetch user progress data if specifically requested or on full page load
        if ($request->has('userId') || !$onlyUserProgress) {
            $data['userProgress'] = $this->getUserProgressData($userId, $startDate, $canViewOtherUsers);
        }
        
        // Only fetch remaining data if this is not a partial request for user progress
        if (!$onlyUserProgress) {
            $data['statistics'] = [
                $timeRange => $this->generateStatisticsForRange($startDate)
            ];
            $data['categoryDistribution'] = $this->getCategoryDistribution($startDate);
            $data['statusOverview'] = $this->getStatusOverview($startDate);
        }
        
        return Inertia::render('overview/dashboard', $data);
    }
    
    /**
     * Generate statistics for a specific time range
     * OPTIMIZATION: Improved query efficiency with subqueries
     * 
     * @param Carbon $startDate
     * @return array
     */
    private function generateStatisticsForRange($startDate)
    {
        // Get end date (now)
        $endDate = now();
        
        // Calculate previous period
        $periodLength = $startDate->diffInDays($endDate);
        $previousPeriodStart = (clone $startDate)->subDays($periodLength);
        $previousPeriodEnd = (clone $startDate)->subDay();
        
        // OPTIMIZATION: Use a single query to get multiple metrics
        $metrics = DB::select("
            SELECT
                (SELECT COUNT(*) FROM places WHERE isCurrent = 1) as totalPlaces,
                (SELECT COUNT(*) FROM places 
                    WHERE isCurrent = 1 
                    AND created_at < ?) as previousTotalPlaces,
                (SELECT COUNT(*) FROM places 
                    WHERE created_at >= ?
                    AND id = (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)) as newPlaces,
                (SELECT COUNT(*) FROM places 
                    WHERE isCurrent = 1
                    AND created_at BETWEEN ? AND ?
                    AND id = (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)) as previousNewPlaces,
                (SELECT COUNT(*) FROM places 
                    WHERE isCurrent = 1
                    AND created_at >= ?
                    AND id != (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)) as updatedPlaces,
                (SELECT COUNT(*) FROM places 
                    WHERE isCurrent = 1
                    AND created_at BETWEEN ? AND ?
                    AND id != (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)) as previousUpdatedPlaces
        ", [$startDate, $startDate, $previousPeriodStart, $previousPeriodEnd, $startDate, $previousPeriodStart, $previousPeriodEnd]);
        
        // Extract values from result
        $metrics = (array) $metrics[0];
        
        // Calculate total trend
        $totalTrend = $metrics['previousTotalPlaces'] > 0 
            ? round((($metrics['totalPlaces'] - $metrics['previousTotalPlaces']) / $metrics['previousTotalPlaces']) * 100, 1)
            : ($metrics['totalPlaces'] > 0 ? 100 : 0);
            
        // Calculate new places trend
        $newTrend = $metrics['previousNewPlaces'] > 0 
            ? round((($metrics['newPlaces'] - $metrics['previousNewPlaces']) / $metrics['previousNewPlaces']) * 100, 1)
            : ($metrics['newPlaces'] > 0 ? 100 : 0);
            
        // Calculate updated places trend
        $updatedTrend = $metrics['previousUpdatedPlaces'] > 0 
            ? round((($metrics['updatedPlaces'] - $metrics['previousUpdatedPlaces']) / $metrics['previousUpdatedPlaces']) * 100, 1)
            : ($metrics['updatedPlaces'] > 0 ? 100 : 0);
            
        // Calculate growth rate for the current period
        $growthRate = $metrics['previousTotalPlaces'] > 0 
            ? round(($metrics['newPlaces'] / $metrics['previousTotalPlaces']) * 100, 1) 
            : ($metrics['newPlaces'] > 0 ? 100 : 0);
            
        // Calculate previous period starting places count
        $previousStartPlaces = (int)$metrics['previousTotalPlaces'] - DB::table('places')
            ->where('isCurrent', true)
            ->where('created_at', '<', $previousPeriodStart)
            ->count();
            
        // Calculate previous growth rate
        $previousGrowthRate = $previousStartPlaces > 0 && $metrics['previousTotalPlaces'] > 0
            ? ($metrics['previousNewPlaces'] / $previousStartPlaces) * 100
            : 0;
            
        // Calculate growth trend
        $growthTrend = $previousGrowthRate > 0 
            ? round((($growthRate - $previousGrowthRate) / $previousGrowthRate) * 100, 1)
            : ($growthRate > 0 ? 100 : 0);
            
        return [
            'totalPlaces' => (int)$metrics['totalPlaces'],
            'totalTrend' => $totalTrend,
            'newPlaces' => (int)$metrics['newPlaces'],
            'newTrend' => $newTrend,
            'updatedPlaces' => (int)$metrics['updatedPlaces'],
            'updatedTrend' => $updatedTrend,
            'growthRate' => $growthRate,
            'growthTrend' => $growthTrend,
            'periodInfo' => [
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
                'periodDays' => $periodLength,
            ]
        ];
    }
    
    /**
     * Get category distribution data for pie chart
     * OPTIMIZATION: Added limit and simplified query
     *
     * @param Carbon $startDate
     * @return array
     */
    private function getCategoryDistribution($startDate)
    {
        // Only get top 10 categories for better performance and display
        $categories = Place::current()
            ->select('placeCategory', DB::raw('count(*) as count'))
            ->groupBy('placeCategory')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                // Map category codes to readable names
                $categoryName = $this->getCategoryName($item->placeCategory);
                return [
                    'category' => $item->placeCategory,
                    'name' => $categoryName,
                    'value' => $item->count,
                ];
            });
            
        return $categories;
    }
    
    /**
     * Get status overview data for bar chart
     * OPTIMIZATION: Simplified and improved query
     *
     * @param Carbon $startDate
     * @return array
     */
    private function getStatusOverview($startDate)
    {
        // Predefined status mapping for consistent display
        $statusMapping = [
            'BARU' => 'Baru',
            'AKTIF' => 'Aktif',
            'TIDAK AKTIF' => 'Tidak Aktif',
            'TIDAK DITEMUKAN' => 'Tidak ditemukan',
            'BELUM DIATUR' => 'Belum diatur',
            null => 'Belum diatur'
        ];
        
        // Use a simpler raw query for better performance
        $statuses = DB::select("
            SELECT 
                COALESCE(placeStatus, 'BELUM DIATUR') as status,
                COUNT(*) as count
            FROM 
                places
            WHERE 
                isCurrent = 1
            GROUP BY 
                COALESCE(placeStatus, 'BELUM DIATUR')
            ORDER BY 
                count DESC
        ");
        
        // Map the results
        $statusData = collect($statuses)->map(function ($item) use ($statusMapping) {
            $statusCode = $item->status;
            $displayName = $statusMapping[$statusCode] ?? ucfirst(strtolower($statusCode));
            
            return [
                'status' => $statusCode,
                'name' => $displayName,
                'value' => $item->count,
            ];
        })->toArray();
            
        // Simplify the status list - just get the mapping
        $allStatuses = collect($statusMapping)->map(function ($name, $code) {
            return [
                'code' => $code,
                'name' => $name
            ];
        })->values()->toArray();
            
        return [
            'data' => $statusData,
            'allStatuses' => $allStatuses
        ];
    }

    
    /**
     * Get user progress data for timeline chart
     * OPTIMIZATION: Improved queries and limited data points
     *
     * @param int $userId
     * @param Carbon $startDate
     * @param bool $canViewOtherUsers
     * @return array
     */
    private function getUserProgressData($userId, $startDate, $canViewOtherUsers)
    {
        // Get date ranges for the timeline
        $endDate = now();
        $dateFormat = 'Y-m-d';
        
        // OPTIMIZATION: For longer time ranges, use weekly aggregation to reduce data points
        $useWeeklyAggregation = $startDate->diffInDays($endDate) > 30;
        $groupByFormat = $useWeeklyAggregation ? 'YEARWEEK(created_at, 1)' : 'DATE(created_at)';
        $displayFormat = $useWeeklyAggregation ? 'Week of %b %d' : '%b %d';
        
        // Create a base date collection
        $dates = [];
        if ($useWeeklyAggregation) {
            // Create weekly buckets
            $current = clone $startDate;
            while ($current->lte($endDate)) {
                $weekKey = $current->format('oW'); // ISO year and week number
                if (!isset($dates[$weekKey])) {
                    $dates[$weekKey] = [
                        'date' => $current->format($dateFormat),
                        'formattedDate' => 'Week of ' . $current->format('M j'),
                        'created' => 0,
                        'updated' => 0,
                    ];
                }
                $current->addDay();
            }
        } else {
            // Daily buckets
            for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
                $dateKey = $date->format($dateFormat);
                $dates[$dateKey] = [
                    'date' => $dateKey,
                    'formattedDate' => $date->format('M j'),
                    'created' => 0,
                    'updated' => 0,
                ];
            }
        }
        
        // OPTIMIZATION: Use more efficient queries with raw SQL
        if ($useWeeklyAggregation) {
            // Get weekly aggregated data for created places
            $created = DB::select("
                SELECT 
                    YEARWEEK(created_at, 1) as week_key,
                    DATE(MIN(created_at)) as date,
                    COUNT(*) as count
                FROM 
                    places
                WHERE 
                    created_by = ?
                    AND created_at >= ?
                    AND id = (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)
                GROUP BY 
                    YEARWEEK(created_at, 1)
            ", [$userId, $startDate]);
            
            // Get weekly aggregated data for updated places
            $updated = DB::select("
                SELECT 
                    YEARWEEK(created_at, 1) as week_key,
                    DATE(MIN(created_at)) as date,
                    COUNT(*) as count
                FROM 
                    places
                WHERE 
                    created_by = ?
                    AND created_at >= ?
                    AND id != (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)
                GROUP BY 
                    YEARWEEK(created_at, 1)
            ", [$userId, $startDate]);
            
            // Fill in the dates array with weekly counts
            foreach ($created as $item) {
                $weekKey = $item->week_key;
                if (isset($dates[$weekKey])) {
                    $dates[$weekKey]['created'] = $item->count;
                }
            }
            
            foreach ($updated as $item) {
                $weekKey = $item->week_key;
                if (isset($dates[$weekKey])) {
                    $dates[$weekKey]['updated'] = $item->count;
                }
            }
        } else {
            // Use daily aggregation for shorter periods
            $created = DB::select("
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM 
                    places
                WHERE 
                    created_by = ?
                    AND created_at >= ?
                    AND id = (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)
                GROUP BY 
                    DATE(created_at)
            ", [$userId, $startDate]);
            
            $updated = DB::select("
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM 
                    places
                WHERE 
                    created_by = ?
                    AND created_at >= ?
                    AND id != (SELECT MIN(id) FROM places p2 WHERE p2.placeId = places.placeId)
                GROUP BY 
                    DATE(created_at)
            ", [$userId, $startDate]);
            
            // Fill in the dates array with daily counts
            foreach ($created as $item) {
                $dateKey = $item->date;
                if (isset($dates[$dateKey])) {
                    $dates[$dateKey]['created'] = $item->count;
                }
            }
            
            foreach ($updated as $item) {
                $dateKey = $item->date;
                if (isset($dates[$dateKey])) {
                    $dates[$dateKey]['updated'] = $item->count;
                }
            }
        }
        
        // Get user activity trends using efficient single query
        $activityCounts = DB::select("
            SELECT 
                SUM(IF(created_at >= ?, 1, 0)) as current_activity,
                SUM(IF(created_at BETWEEN ? AND ?, 1, 0)) as previous_activity
            FROM 
                places
            WHERE 
                created_by = ?
                AND created_at >= ?
        ", [$startDate, $previousPeriodStart = (clone $startDate)->subDays($startDate->diffInDays($endDate)), $startDate, $userId, $previousPeriodStart]);
        
        $currentActivity = $activityCounts[0]->current_activity ?? 0;
        $previousActivity = $activityCounts[0]->previous_activity ?? 0;
        
        // Calculate trend percentage
        $activityTrend = 0;
        if ($previousActivity > 0) {
            $activityTrend = round((($currentActivity - $previousActivity) / $previousActivity) * 100, 1);
        } elseif ($currentActivity > 0) {
            $activityTrend = 100;
        }
        
        // OPTIMIZATION: Only get user list if admin role and limit to active users
        $users = [];
        if ($canViewOtherUsers) {
            $users = User::select('id', 'name')
                ->orderBy('name')
                ->limit(50) // Prevent loading too many users
                ->get();
        }
        
        return [
            'timelineData' => array_values($dates),
            'activityTrends' => [
                'totalTrend' => $activityTrend,
            ],
            'currentUserId' => (string) $userId,
            'canViewOtherUsers' => $canViewOtherUsers,
            'users' => $users,
        ];
    }
    
    /**
     * Convert time range to start date
     *
     * @param string $timeRange
     * @return Carbon
     */
    private function getStartDate($timeRange)
    {
        $now = now();
        
        switch ($timeRange) {
            case '3d':
                return $now->copy()->subDays(3)->startOfDay();
            case '7d':
                return $now->copy()->subDays(7)->startOfDay();
            case '90d':
                return $now->copy()->subDays(90)->startOfDay();
            case '30d':
            default:
                return $now->copy()->subDays(30)->startOfDay();
        }
    }
    
    /**
     * Get readable category name from code
     *
     * @param string $code
     * @return string
     */
    private function getCategoryName($code)
    {
        // OPTIMIZATION: Use static cache for category names to avoid recreating array on each call
        static $categories = null;
        
        if ($categories === null) {
            $categories = [
                'A' => 'Agriculture',
                'B' => 'Pertambangan dan Penggalian',
                'C' => 'Industri Pengolahan',
                'D' => 'Pengadaan Listrik, Gas, Uap/Air Panas Dan Udara Dingin',
                'E' => 'Treatment Air, Treatment Air Limbah, Treatment dan Pemulihan Material Sampah, dan Aktivitas Remediasi',
                'F' => 'Konstruksi',
                'G' => 'Perdagangan Besar Dan Eceran; Reparasi Dan Perawatan Mobil Dan Sepeda Motor',
                'H' => 'Pengangkutan dan Pergudangan',
                'I' => 'Penyediaan Akomodasi Dan Penyediaan Makan Minum',
                'J' => 'Informasi Dan Komunikasi',
                'K' => 'Aktivitas Keuangan dan Asuransi',
                'L' => 'Real Estat',
                'M' => 'Aktivitas Profesional, Ilmiah Dan Teknis',
                'N' => 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya',
                'O' => 'Administrasi Pemerintahan, Pertahanan Dan Jaminan Sosial Wajib',
                'P' => 'Pendidikan',
                'Q' => 'Aktivitas Kesehatan Manusia Dan Aktivitas Sosial',
                'R' => 'Kesenian, Hiburan Dan Rekreasi',
                'S' => 'Aktivitas Jasa Lainnya',
                'T' => 'Aktivitas Rumah Tangga Sebagai Pemberi Kerja; Aktivitas Yang Menghasilkan Barang Dan Jasa Oleh Rumah Tangga yang Digunakan untuk Memenuhi Kebutuhan Sendiri',
                'U' => 'Aktivitas Badan Internasional Dan Badan Ekstra Internasional Lainnya',
            ];
        }
        
        return $categories[$code] ?? 'Unknown';
    }
}