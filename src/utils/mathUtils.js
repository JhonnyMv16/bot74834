const config = require('../config/config');

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Aceita:
 * 1) haversineDistance({lat, lng}, {lat, lng})
 * 2) haversineDistance(lat1, lng1, lat2, lng2)
 */
function haversineDistance(a, b, c, d) {
    let lat1, lng1, lat2, lng2;

    // Formato com objetos
    if (typeof a === 'object' && typeof b === 'object') {
        lat1 = a.lat;
        lng1 = a.lng;
        lat2 = b.lat;
        lng2 = b.lng;
    } 
    // Formato com números
    else {
        lat1 = a;
        lng1 = b;
        lat2 = c;
        lng2 = d;
    }

    if (
        [lat1, lng1, lat2, lng2].some(v => typeof v !== 'number')
    ) {
        throw new Error('Coordenadas inválidas para haversineDistance');
    }

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);

    const aCalc =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rLat1) *
            Math.cos(rLat2) *
            Math.sin(dLng / 2) ** 2;

    const cCalc = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));

    return (config.earthRadius || 6371) * cCalc;
}

function angle(cx, cy, ex, ey) {
    const dy = ey - cy;
    const dx = ex - cx;
    let theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta;
}

function angle360(cx, cy, ex, ey) {
    let theta = angle(cx, cy, ex, ey);
    if (theta < 0) theta = 360 + theta;
    return theta;
}

function getRandomCoordinate(bbox) {
    // suporta bbox como array ou objeto
    if (Array.isArray(bbox)) {
        const [minLat, minLng, maxLat, maxLng] = bbox;
        return {
            lat: Math.random() * (maxLat - minLat) + minLat,
            lng: Math.random() * (maxLng - minLng) + minLng
        };
    }

    return {
        lat: Math.random() * (bbox.maxLat - bbox.minLat) + bbox.minLat,
        lng: Math.random() * (bbox.maxLng - bbox.minLng) + bbox.minLng
    };
}

module.exports = {
    haversineDistance,
    angle360,
    getRandomCoordinate
};
