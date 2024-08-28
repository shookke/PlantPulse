// src/components/GridView.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const placeholderImage = 'https://via.placeholder.com/150';

const GridView = ({ devices, baseUrl }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {devices.map(device => (
                <DeviceCard key={device._id} device={device} baseUrl={baseUrl} />
            ))}
        </div>
    );
};

const DeviceCard = ({ device, baseUrl }) => {
    const [latestReading, setLatestReading] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatestReading = async () => {
            try {
                const response = await fetch(`${baseUrl}/readings/${device._id}`, {
                    headers: {
                        Authorization: `${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch latest reading');
                }

                const data = await response.json();
                if (data.readings.length > 0) {
                    setLatestReading(data.readings[0]); // Assuming the first one is the latest
                }
            } catch (err) {
                console.error(err.message);
            }
        };

        fetchLatestReading();
    }, [device._id, baseUrl]);

    const handleClick = () => {
        navigate(`/device/${device._id}`);
    };

    return (
        <div onClick={handleClick} style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', cursor: 'pointer' }}>
            <img src={device.image || placeholderImage} alt={device.plantType} style={{ width: '100%', borderRadius: '8px' }} />
            <h3>{device.plantType}</h3>
            {latestReading ? (
                <div>
                    <p>Temperature: {latestReading.temperature}°C</p>
                    <p>Humidity: {latestReading.humidity}%</p>
                    <p>Light Level: {latestReading.lightLevel}%</p>
                </div>
            ) : (
                <p>Loading latest reading...</p>
            )}
        </div>
    );
};

export default GridView;
