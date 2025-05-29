<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $places = [
            [
                'ID' => 48,
                'placeId' => 'ChIJG0i9CEap1TERq1G-K3lxuus',
                'placeName' => 'Graha Renova',
                'placeBusinessStatus' => 'OPERATIONAL',
                'placeAddress' => 'GC2C+GP3, Tengkerang Barat',
                'placeTypes' => 'point_of_interest,establishment',
                'placeLatitude' => '0.5012537',
                'placeLongitude' => '101.4218026',
                'category' => 'Kategori S: Aktivitas Jasa Lainnya',
                'description' => 'Tempat usaha dengan berbagai layanan.'
            ],
            [
                'ID' => 93,
                'placeId' => 'ChIJI0kxnE-p1TERVzzCaVLc_-A',
                'placeName' => 'Putri Jaya Abadi. CV',
                'placeBusinessStatus' => 'OPERATIONAL',
                'placeAddress' => 'Jalan Musyawarah No.184, Labuh Baru Timur',
                'placeTypes' => 'furniture_store,home_goods_store,point_of_interest,store,establishment',
                'placeLatitude' => '0.5039693',
                'placeLongitude' => '101.4236093',
                'category' => 'Kategori G: Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Sepeda Motor',
                'description' => 'Toko yang menjual berbagai barang kebutuhan sehari-hari.'
            ],
            [
                'ID' => 139,
                'placeId' => 'ChIJ75xs3BSp1TERjUD6T2Hr7MU',
                'placeName' => 'Warung Ojo Forget',
                'placeBusinessStatus' => 'OPERATIONAL',
                'placeAddress' => 'GC3G+GQ4, Jalan Soekarno-Hatta, Sidomulyo Timur',
                'placeTypes' => 'restaurant,point_of_interest,food,establishment',
                'placeLatitude' => '0.50377',
                'placeLongitude' => '101.4269639',
                'category' => 'Kategori I: Penyediaan Akomodasi dan Penyediaan Makan Minum',
                'description' => 'Tempat yang menyediakan makanan, seperti warung atau kedai., Restoran yang menyajikan makanan dan minuman untuk pelanggan.'
            ],
        ];

        foreach ($places as $place) {
            Place::create($place);
        }
    }
}
