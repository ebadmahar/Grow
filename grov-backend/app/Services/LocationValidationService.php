<?php

namespace App\Services;

use App\Models\LocationAqi;

/**
 * Validates that a given coordinate falls within a supported location's
 * bounding box. Currently restricted to Islamabad only.
 *
 * Expand by adding new slugs to LocationAqi::supportedLocations() and
 * adding their bounding boxes to BOUNDING_BOXES below.
 */
class LocationValidationService
{
    /**
     * Bounding boxes for supported regions.
     * Format: [lat_min, lat_max, lon_min, lon_max]
     *
     * Islamabad bounding box covers central Islamabad + Margalla Hills.
     */
    private const BOUNDING_BOXES = [
        'islamabad' => [33.50, 33.85, 72.80, 73.35],
        // 'lahore'    => [31.37, 31.65, 74.14, 74.52],
        // 'karachi'   => [24.74, 25.04, 66.85, 67.26],
    ];

    /**
     * Check whether a coordinate is inside any supported region.
     *
     * @return array{valid: bool, slug: string|null, message: string|null}
     */
    public function validate(float $latitude, float $longitude): array
    {
        foreach (self::BOUNDING_BOXES as $slug => [$latMin, $latMax, $lonMin, $lonMax]) {
            if (
                $latitude >= $latMin && $latitude <= $latMax &&
                $longitude >= $lonMin && $longitude <= $lonMax
            ) {
                return ['valid' => true, 'slug' => $slug, 'message' => null];
            }
        }

        return [
            'valid'   => false,
            'slug'    => null,
            'message' => "This location is currently not supported. We're working on it 👀 — only Islamabad is available right now.",
        ];
    }

    /**
     * Convenience wrapper — throws a validation-style array if invalid.
     * Use in controllers to short-circuit with a 422 response.
     */
    public function assertValid(float $latitude, float $longitude): void
    {
        $result = $this->validate($latitude, $longitude);
        if (!$result['valid']) {
            abort(422, $result['message']);
        }
    }
}
