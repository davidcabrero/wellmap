import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fijar ícono por defecto para Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const App = () => {
    const [start, setStart] = useState([43.545, -5.661]); // Coordenadas iniciales (Gijón)
    const [destination, setDestination] = useState(null);
    const [route, setRoute] = useState(null);
    const [originInput, setOriginInput] = useState(''); // Almacena el valor del origen ingresado por el usuario
    const [showInfo, setShowInfo] = useState(false); // Controla la visibilidad del cuadro flotante

    // Función para obtener la ubicación actual y convertirla a nombre de ciudad
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const city = await getCityFromCoordinates(latitude, longitude);
                setOriginInput(city); // Actualiza el campo de texto con la ciudad
            });
        } else {
            alert("Geolocalización no soportada en este navegador.");
        }
    };

    // Función para obtener el nombre de la ciudad a partir de las coordenadas
    const getCityFromCoordinates = async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            return response.data.address.city || response.data.address.town || response.data.address.village;
        } catch (error) {
            console.error('Error obteniendo la ciudad:', error);
            return '';
        }
    };

    // Buscar la ciudad y calcular la ruta
    const handleSearch = async () => {
        const city = originInput.trim();
        if (city) {
            // Buscar las coordenadas de la ciudad
            try {
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${city}`
                );
                if (response.data.length > 0) {
                    const { lat, lon } = response.data[0];
                    setDestination([parseFloat(lat), parseFloat(lon)]);
                    calculateRoute(start, [lat, lon]); // Calcula la ruta
                    setShowInfo(true); // Muestra el cuadro flotante
                }
            } catch (error) {
                console.error('Error en la búsqueda de la ciudad:', error);
            }
        } else {
            alert("Por favor, ingresa una ciudad válida.");
        }
    };

    // Calcular la ruta desde la ubicación actual a la ciudad
    const calculateRoute = async (startCoords, endCoords) => {
        try {
            const response = await axios.get(
                `http://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&steps=true&geometries=geojson`
            );
            const routeData = response.data.routes[0];
            setRoute(routeData);
        } catch (error) {
            console.error('Error calculando la ruta:', error);
        }
    };

    // Función para abrir la búsqueda de la ciudad en Google
    const handleOpenInGoogleSearch = () => {
        if (originInput) {
            window.open(`https://www.google.com/search?q=${originInput}`, '_blank');
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {/* Título flotante */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#32CD32',
                    fontFamily: 'Arial, sans-serif',
                }}
            >
                WellMap
            </div>

            {/* Buscador de ciudad */}
            <input
                type="text"
                placeholder="Buscar ciudad"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Buscar al presionar Enter
                style={{
                    position: 'absolute',
                    top: '70px',
                    left: '50px',
                    zIndex: 1000,
                    width: '250px',
                    padding: '10px',
                    borderRadius: '25px',
                    border: '1px solid #ccc',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    outline: 'none',
                    fontSize: '16px',
                }}
            />

            {/* Mapa */}
            <MapContainer center={start} zoom={13} style={{ width: '100%', height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={start}>
                    <Popup>Ubicación actual</Popup>
                </Marker>
                {destination && (
                    <Marker position={destination}>
                        <Popup>Destino</Popup>
                    </Marker>
                )}
                {route && (
                    <Polyline
                        positions={route.geometry.coordinates.map(([lon, lat]) => [lat, lon])}
                        color="blue"
                    />
                )}
            </MapContainer>

            {/* Cuadro flotante con información */}
            {showInfo && route && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        background: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        width: '250px',
                    }}
                >
                    <h3>{originInput}</h3>
                    <p><strong>Duración:</strong> {route.duration / 60} minutos</p>
                    <p><strong>Distancia:</strong> {route.distance / 1000} km</p>
                    <button
                        onClick={handleOpenInGoogleSearch}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#32CD32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%',
                            marginBottom: '10px',
                        }}
                    >
                        Buscar en Google
                    </button>
                    <button
                        onClick={() => calculateRoute(start, destination)}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#007BFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%',
                        }}
                    >
                        Calcular Ruta
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;