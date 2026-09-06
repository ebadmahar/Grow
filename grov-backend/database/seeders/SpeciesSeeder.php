<?php

namespace Database\Seeders;

use App\Models\Species;
use Illuminate\Database\Seeder;

class SpeciesSeeder extends Seeder
{
    public function run(): void
    {
        $speciesData = [
            [
                'common_name' => 'Chir Pine',
                'scientific_name' => 'Pinus roxburghii',
                'local_name' => 'Chir (Urdu / Punjabi)',
                'suitable_zones' => 'Margalla Hills, Sub-Himalayan foothills, 500–2,200m elevation',
                'basic_description' => 'Fast-growing native pine, well-adapted to dry sub-tropical conditions. Forms dense forests critical for watershed protection.',
                'basic_guidance' => 'Plant in well-drained rocky soils. Best planted at start of monsoon. Space 2–3m apart.',
                'category' => 'conifer',
                'is_native' => true,
                'is_active' => true,
            ],
            [
                'common_name' => 'Phulai',
                'scientific_name' => 'Acacia modesta',
                'local_name' => 'Phulai',
                'suitable_zones' => 'Pothohar Plateau, Margalla Hills scrub forest',
                'basic_description' => 'Hardy drought-resistant native tree critical for soil conservation and erosion control.',
                'basic_guidance' => 'Requires minimal watering once established. Excellent for seed bombing in degraded hills.',
                'category' => 'deciduous',
                'is_native' => true,
                'is_active' => true,
            ],
            [
                'common_name' => 'Sheesham',
                'scientific_name' => 'Dalbergia Sissoo',
                'local_name' => 'Tali / Sheesham',
                'suitable_zones' => 'Indus plain, Punjab riversides, lower Margalla valleys',
                'basic_description' => 'Native rosewood species valued for canopy shade, nitrogen fixation, and timber.',
                'basic_guidance' => 'Plant in deep alluvial soil near water channels.',
                'category' => 'deciduous',
                'is_native' => true,
                'is_active' => true,
            ],
            [
                'common_name' => 'Red Mangrove',
                'scientific_name' => 'Rhizophora Mangle',
                'local_name' => 'Tivar / Mangrove',
                'suitable_zones' => 'Coastal estuaries and intertidal mudflats',
                'basic_description' => 'Keystone coastal mangrove supporting marine biodiversity and shoreline protection.',
                'basic_guidance' => 'Plant propagules directly in brackish intertidal mud during low tide.',
                'category' => 'mangrove',
                'is_native' => true,
                'is_active' => true,
            ],
            [
                'common_name' => 'Ber',
                'scientific_name' => 'Ziziphus Jujuba',
                'local_name' => 'Ber / Indian Jujube',
                'suitable_zones' => 'Semi-arid plains and dry foothills',
                'basic_description' => 'Drought-tolerant fruiting tree that provides wildlife food and shelter.',
                'basic_guidance' => 'Ideal candidate for direct seeding and seed bombing.',
                'category' => 'deciduous',
                'is_native' => true,
                'is_active' => true,
            ],
            [
                'common_name' => 'Peepal',
                'scientific_name' => 'Ficus Religiosa',
                'local_name' => 'Peepal',
                'suitable_zones' => 'Subtropical plains and urban greenbelts',
                'basic_description' => 'Large indigenous fig tree providing massive carbon capture and bird habitat.',
                'basic_guidance' => 'Requires ample space for root expansion.',
                'category' => 'deciduous',
                'is_native' => true,
                'is_active' => true,
            ],
        ];

        foreach ($speciesData as $data) {
            Species::firstOrCreate([
                'scientific_name' => $data['scientific_name'],
            ], $data);
        }
    }
}
