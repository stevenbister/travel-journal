import { MapPinIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type MapRef, Marker } from 'react-map-gl/maplibre';

import { Spinner } from '@repo/ui/components/ui/spinner';

import { MapComponent } from '../map/map';
import { EntryDrawer } from './entry-drawer';
import { useGetEntries } from './hooks/use-get-entries';

type EntryMapProps = {
    tripId: string;
};

export const EntryMap = ({ tripId }: EntryMapProps) => {
    const { entries, isPending } = useGetEntries(tripId);
    const mapRef = useRef<MapRef>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const sortedEntries = useMemo(() => {
        if (!entries) return [];
        return entries.toSorted((a, b) =>
            a.entryDate.localeCompare(b.entryDate)
        );
    }, [entries]);

    const locatedEntries = useMemo(
        () =>
            sortedEntries.filter(
                (entry) =>
                    typeof entry.location?.lat === 'number' &&
                    typeof entry.location?.lng === 'number'
            ),
        [sortedEntries]
    );

    const bounds = useMemo<[number, number, number, number] | null>(() => {
        if (locatedEntries.length === 0) return null;
        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;
        for (const entry of locatedEntries) {
            const { lat, lng } = entry.location!;
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
        }
        return [minLng, minLat, maxLng, maxLat];
    }, [locatedEntries]);

    const fitMapToBounds = useCallback(
        (animate = false) => {
            const map = mapRef.current;
            if (!map || !bounds) return;
            const duration = animate ? 2000 : 0;
            const [minLng, minLat, maxLng, maxLat] = bounds;
            if (minLng === maxLng && minLat === maxLat) {
                map.flyTo({
                    center: [minLng, minLat],
                    zoom: 10,
                    duration,
                });
            } else {
                map.fitBounds(
                    [
                        [minLng, minLat],
                        [maxLng, maxLat],
                    ],
                    { padding: 60, maxZoom: 12, duration }
                );
            }
        },
        [bounds]
    );

    useEffect(() => {
        fitMapToBounds(false);
    }, [fitMapToBounds]);

    if (isPending) {
        return <div>Loading...</div>;
    }

    if (!entries || entries.length === 0) {
        return <div>No entries found.</div>;
    }

    if (!bounds || locatedEntries.length === 0) {
        return <div>No entry locations found.</div>;
    }

    const [minLng, minLat, maxLng, maxLat] = bounds;

    return (
        <div className="relative h-full w-full">
            <div
                className={`h-full w-full transition-opacity duration-300 ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
                <MapComponent
                    ref={mapRef}
                    initialViewState={{
                        longitude: (minLng + maxLng) / 2,
                        latitude: (minLat + maxLat) / 2,
                        zoom: locatedEntries.length === 1 ? 10 : 2,
                    }}
                    onLoad={() => {
                        fitMapToBounds(true);
                        setIsMapLoaded(true);
                    }}
                    onError={() => setIsMapLoaded(true)}
                >
                    {sortedEntries.map((entry) => {
                        if (!entry.location?.lat || !entry.location?.lng)
                            return null;
                        const isSelected = entry.id === selectedEntryId;

                        return (
                            <Marker
                                key={entry.id}
                                longitude={entry.location!.lng}
                                latitude={entry.location!.lat}
                                className="text-accent"
                            >
                                <EntryDrawer
                                    entryId={entry.id}
                                    trigger={
                                        <MapPinIcon size={40} weight="fill" />
                                    }
                                    isOpen={isSelected}
                                    setIsOpen={(isOpen) =>
                                        setSelectedEntryId(
                                            isOpen ? entry.id : null
                                        )
                                    }
                                />
                            </Marker>
                        );
                    })}
                </MapComponent>
            </div>

            {!isMapLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <Spinner className="size-8" />
                </div>
            ) : null}
        </div>
    );
};
