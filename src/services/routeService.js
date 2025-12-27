const axios = require('axios');
const polyline = require('@mapbox/polyline');
const config = require('../config/config');
const { haversineDistance, getRandomCoordinate } = require('../utils/mathUtils');

/**
 * Verifica se a coordenada está em terra
 * Se a API falhar, retorna TRUE para não quebrar o sistema
 */
async function isOnLand(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'gps103-emulator-sacode/1.0 (admin@seudominio.com)'
            },
            timeout: 5000
        });

        return Boolean(response.data?.address?.country);
    } catch (error) {
        console.warn(
            'Aviso: falha ao verificar se coordenada está em terra. Ignorando validação.'
        );
        return true; // fallback
    }
}

function decodePolyline(encoded) {
    return polyline.decode(encoded).map(([lat, lon]) => ({ lat, lng: lon }));
}

async function getRoute(start, end) {
    try {
        const url = `${config.valhallaUrl}?json=${encodeURIComponent(
            JSON.stringify({
                locations: [
                    { lat: start.lat, lon: start.lng },
                    { lat: end.lat, lon: end.lng }
                ],
                costing: 'auto',
                directions_options: { units: 'kilometers' }
            })
        )}`;

        const response = await axios.get(url, { timeout: 10000 });
        return response.data.trip.legs[0].shape;
    } catch (error) {
        console.error('Erro ao obter rota:', error.message);
        throw error;
    }
}

async function generateValidRoute() {
    let start, destination, distance;

    do {
        const bbox =
            config.boundingBoxes[
                Math.floor(Math.random() * config.boundingBoxes.length)
            ];

        start = getRandomCoordinate(bbox);
        destination = getRandomCoordinate(bbox);

        // validação básica
        if (
            typeof start.lat !== 'number' ||
            typeof start.lng !== 'number' ||
            typeof destination.lat !== 'number' ||
            typeof destination.lng !== 'number'
        ) {
            continue;
        }

        // Validação de terra (com fallback)
        const startOnLand = await isOnLand(start.lat, start.lng);
        const destOnLand = await isOnLand(destination.lat, destination.lng);

        if (!startOnLand || !destOnLand) continue;

        distance = haversineDistance(start, destination);

    } while (
        !distance ||
        distance < config.minDistance ||
        distance > config.maxDistance
    );

    return {
        start,
        destination,
        distance
    };
}

module.exports = {
    generateValidRoute,
    getRoute,
    decodePolyline
};
