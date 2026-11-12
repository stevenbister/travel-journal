import { MapPinIcon } from '@phosphor-icons/react';
import { Link, useParams } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, type MapRef, Marker, Source } from 'react-map-gl/maplibre';

import { Spinner } from '@repo/ui/components/ui/spinner';
import { cn } from '@repo/ui/lib/utils';

import type { Entry } from '../../lib/dexie/types';
import { MapComponent } from '../map/map';
import { EntryDrawer } from './entry-drawer';
import { buildGreatCircleRoute } from './utils/great-circle';

type EntryMapProps = {
    entries: Entry[];
};

type EntryRouteGeoJSON = {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        properties: Record<string, string>;
        geometry: {
            type: 'LineString';
            coordinates: [number, number][];
        };
    }>;
};

export const EntryMap = ({ entries }: EntryMapProps) => {
    const mapRef = useRef<MapRef>(null);
    const isMapLoadedRef = useRef(false);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const { tripId } = useParams({
        from: '/_auth/map/{-$tripId}',
    });

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

    const routeGeoJSON = useMemo<EntryRouteGeoJSON | null>(() => {
        if (!tripId || locatedEntries.length < 2) return null;

        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        // Great-circle arcs between stops, like flight paths
                        coordinates: buildGreatCircleRoute(
                            locatedEntries.map((entry) => [
                                entry.location!.lng,
                                entry.location!.lat,
                            ])
                        ),
                    },
                },
            ],
        };
    }, [tripId, locatedEntries]);

    const isTripView = Boolean(tripId);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const openEntry = useCallback((entry: Entry) => {
        setSelectedEntryId(entry.id);

        // Zoom into the pin for the selected entry
        const map = mapRef.current;
        if (map && entry.location) {
            map.flyTo({
                center: [entry.location.lng, entry.location.lat],
                zoom: Math.max(map.getZoom(), 12),
                duration: 1000,
            });
        }
    }, []);

    const handleActiveEntryChange = useCallback(
        (entryId: string) => {
            const entry = locatedEntries.find(
                (locatedEntry) => locatedEntry.id === entryId
            );
            if (entry) openEntry(entry);
        },
        [locatedEntries, openEntry]
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
        // Animate once the map is loaded, so navigation-triggered bounds changes
        fitMapToBounds(isMapLoadedRef.current);
    }, [fitMapToBounds]);

    if (!entries || entries.length === 0) {
        return <div>No entries found.</div>;
    }

    if (!bounds || locatedEntries.length === 0) {
        return <div>No entry locations found.</div>;
    }

    const [minLng, minLat, maxLng, maxLat] = bounds;

    return (
        <>
            <div
                className={cn(
                    'h-full w-full transition-opacity duration-300',
                    isMapLoaded ? 'opacity-100' : 'opacity-0'
                )}
            >
                <MapComponent
                    ref={mapRef}
                    initialViewState={{
                        longitude: (minLng + maxLng) / 2,
                        latitude: (minLat + maxLat) / 2,
                        zoom: locatedEntries.length === 1 ? 10 : 2,
                    }}
                    onLoad={() => {
                        isMapLoadedRef.current = true;
                        fitMapToBounds(true);
                        setIsMapLoaded(true);
                    }}
                    onError={() => setIsMapLoaded(true)}
                >
                    {routeGeoJSON ? (
                        <Source
                            id="entry-route"
                            type="geojson"
                            data={routeGeoJSON}
                        >
                            <Layer
                                id="entry-route-line"
                                type="line"
                                paint={{
                                    'line-color': '#e2734d',
                                    'line-width': 2,
                                    'line-opacity': 0.8,
                                    // Purely decorative route line, so dash it to
                                    // distinguish it from real roads/paths
                                    'line-dasharray': [2, 2],
                                }}
                            />
                        </Source>
                    ) : null}
                    {sortedEntries.map((entry) => {
                        if (!entry.location?.lat || !entry.location?.lng)
                            return null;

                        if (isTripView) {
                            return (
                                <Marker
                                    key={entry.id}
                                    longitude={entry.location!.lng}
                                    latitude={entry.location!.lat}
                                    className="text-accent"
                                >
                                    <button
                                        type="button"
                                        onClick={() => openEntry(entry)}
                                        aria-label={`Open ${entry.title}`}
                                        className="cursor-pointer"
                                    >
                                        <MapPinIcon weight="fill" size={40} />
                                    </button>
                                </Marker>
                            );
                        }

                        return (
                            <Marker
                                key={entry.id}
                                longitude={entry.location!.lng}
                                latitude={entry.location!.lat}
                                className="text-accent"
                            >
                                <Link
                                    to="/map/{-$tripId}"
                                    params={{ tripId: entry.tripId }}
                                >
                                    <MapPinIcon weight="fill" size={40} />
                                </Link>
                            </Marker>
                        );
                    })}
                </MapComponent>
            </div>

            {isTripView && selectedEntryId ? (
                <EntryDrawer
                    entries={locatedEntries}
                    entryId={selectedEntryId}
                    onActiveEntryChange={handleActiveEntryChange}
                    isOpen={Boolean(selectedEntryId)}
                    setIsOpen={(isOpen) => {
                        if (!isOpen) setSelectedEntryId(null);
                    }}
                />
            ) : null}

            {!isMapLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <Spinner className="size-8" />
                </div>
            ) : null}
        </>
    );
};
