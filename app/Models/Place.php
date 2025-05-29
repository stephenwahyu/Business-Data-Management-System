<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Place extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'placeId',
        'placeName',
        'placeAddress',
        'placeDistrict',
        'placeBusinessStatus',
        'placeStatus',
        'placeTypes',
        'placeLatitude',
        'placeLongitude',
        'placeCategory',
        'description',
        'source',
        'created_by',
        'isCurrent',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'isCurrent' => 'boolean',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($place) {
            // Generate a unique placeId if not provided
            if (empty($place->placeId)) {
                $place->placeId = $place->placeCategory . '-' . Str::upper(Str::random(8));
            }
            
            // Set default value for isCurrent if not specified
            if (!isset($place->isCurrent)) {
                $place->isCurrent = true;
            }
        });
    }

    /**
     * Check if the place data is valid
     * Part of the transform process for data quality
     *
     * @return bool
     */
    public function getIsValidAttribute(): bool
    {
        // Basic validation rules
        return !empty($this->placeName) && 
               !empty($this->placeCategory) && 
               !empty($this->placeLatitude) && 
               !empty($this->placeLongitude);
    }

    /**
     * Get the user who created this place record
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    /**
     * Get historical versions of this place
     * Used in the Extract phase when retrieving history
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function history()
    {
        return $this->hasMany(Place::class, 'placeId', 'placeId')
                    ->orderBy('created_at', 'desc');
    }
    
    /**
     * Scope for retrieving only current places
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCurrent($query)
    {
        return $query->where('isCurrent', true);
    }
    
    /**
     * Get the previous version of this place
     * Used in the ETL process to track changes
     *
     * @return \App\Models\Place|null
     */
    public function getPreviousVersion()
    {
        return static::where('placeId', $this->placeId)
                   ->where('id', '<>', $this->id)
                   ->orderBy('created_at', 'desc')
                   ->first();
    }
}