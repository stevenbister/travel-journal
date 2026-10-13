import { config as maplibreConfig } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Ref } from 'react';
import MapGL, { type MapProps, type MapRef } from 'react-map-gl/maplibre';

import { style } from './style-json';

maplibreConfig.WORKER_URL = maplibreWorkerUrl as string;

type MapComponentProps = MapProps & { ref?: Ref<MapRef> };

export const MapComponent = ({ ref, ...props }: MapComponentProps) => {
    return (
        <MapGL
            ref={ref}
            style={{ width: '100%', height: '100%' }}
            mapStyle={style}
            {...props}
        />
    );
};
