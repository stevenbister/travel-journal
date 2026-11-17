export type LngLat = [number, number];

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Densifies the leg between two points along the great circle (shortest path
// over the globe), so lines render as flight-path style arcs that bend
// towards the nearest pole instead of straight rhumb lines.
const interpolateGreatCircleSegment = (from: LngLat, to: LngLat): LngLat[] => {
    let lng2 = to[0];
    const lat2 = to[1];
    // Pick the shortest longitudinal span, so legs crossing the antimeridian
    // take the short way around
    while (lng2 - from[0] > 180) lng2 -= 360;
    while (from[0] - lng2 > 180) lng2 += 360;

    const phi1 = from[1] * DEG2RAD;
    const lambda1 = from[0] * DEG2RAD;
    const phi2 = lat2 * DEG2RAD;
    const lambda2 = lng2 * DEG2RAD;

    // Convert both endpoints to unit vectors on the sphere
    const x1 = Math.cos(phi1) * Math.cos(lambda1);
    const y1 = Math.cos(phi1) * Math.sin(lambda1);
    const z1 = Math.sin(phi1);
    const x2 = Math.cos(phi2) * Math.cos(lambda2);
    const y2 = Math.cos(phi2) * Math.sin(lambda2);
    const z2 = Math.sin(phi2);

    const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2));
    const omega = Math.acos(dot); // angular distance in radians
    const segments = Math.min(128, Math.max(2, Math.ceil(omega * RAD2DEG * 2)));

    const points: LngLat[] = [];
    let prevLng = from[0];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        let x: number;
        let y: number;
        let z: number;

        if (omega < 1e-6) {
            // Endpoints are (nearly) identical, plain lerp is enough
            x = x1 + (x2 - x1) * t;
            y = y1 + (y2 - y1) * t;
            z = z1 + (z2 - z1) * t;
        } else {
            // Spherical linear interpolation (slerp)
            const w1 = Math.sin((1 - t) * omega) / Math.sin(omega);
            const w2 = Math.sin(t * omega) / Math.sin(omega);
            x = w1 * x1 + w2 * x2;
            y = w1 * y1 + w2 * y2;
            z = w1 * z1 + w2 * z2;
        }

        // atan2's branch flips at +/-180, which breaks segments crossing
        // the antimeridian; unwrap each longitude against the previous point
        // so the arc is continuous (e.g. 160 -> 190, not 160 -> -170)
        let pointLng = Math.atan2(y, x) * RAD2DEG;
        while (pointLng - prevLng > 180) pointLng -= 360;
        while (prevLng - pointLng > 180) pointLng += 360;
        prevLng = pointLng;

        points.push([
            pointLng,
            Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD2DEG,
        ]);
    }
    return points;
};

// Turns an ordered list of stops into a polyline that follows great circles,
// keeping longitudes continuous across legs (important for trips crossing the
// antimeridian)
export const buildGreatCircleRoute = (stops: LngLat[]): LngLat[] => {
    if (stops.length < 2) return stops;

    const route: LngLat[] = [stops[0]!];
    for (let i = 1; i < stops.length; i++) {
        const segment = interpolateGreatCircleSegment(
            route[route.length - 1]!,
            stops[i]!
        );
        route.push(...segment.slice(1));
    }

    return route;
};
