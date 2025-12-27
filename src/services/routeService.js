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
                // OBRIGATÓRIO segundo política do OpenStreetMap
                'User-Agent': 'gps103-emulator-sacode/1.0 (admin@seudominio.com)'
            },
            timeout: 5000
        });

        return Boolean(response.data?.address?.country);
    } catch (error) {
        console.warn(
            'Aviso: falha ao verificar se coordenada está em terra. Ignorando validação.'
        );
        return true; // fallback para não quebrar
    }
}

function decodePolyline(encoded) {
    return polyline.decode(encoded).map(([lat, lon]) => ({ lat, lon }));
}

async function getRoute(start, end) {
    try {
        const url = `${config.valhallaUrl}?json=${encodeURIComponent(
            JSON.stringify({
                locations: [
                    { lat: start[0], lon: start[1] },
                    { lat: end[0], lon: end[1] }
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

        // Validação de terra (com fallback)
        const startOnLand = await isOnLand(start[0], start[1]);
        const destOnLand = await isOnLand(destination[0], destination[1]);

        if (!startOnLand || !destOnLand) continue;

        distance = haversineDistance(
            start[0],
            start[1],
            destination[0],
            destination[1]
        );
    } while (distance < config.minDistance || distance > config.maxDistance);

    return {
        start: { lat: start[0], lng: start[1] },
        destination: { lat: destination[0], lng: destination[1] },
        distance
    };
}

module.exports = {
    generateValidRoute,
    getRoute,
    decodePolyline
};
