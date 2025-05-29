import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import MapView from "@/components/MapView";

export default function MapPage() {
    return (
        <AppLayout>
            <Head title="Interactive Map" />
            <div className="w-full h-full">
                <MapView />
            </div>
        </AppLayout>
    );
}