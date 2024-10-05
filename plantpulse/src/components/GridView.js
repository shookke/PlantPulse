// src/components/GridView.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const placeholderImage = 'https://via.placeholder.com/150';

const GridView = ({ devices, baseUrl }) => {
    return (
        <div className="grid grid-flow-col auto-cols-max">
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
                    setLatestReading(data.readings[data.readings.length - 1]); // Assuming the last one is the latest
                }
            } catch (err) {
                console.error(err.message);
            }
        };
        return () => {
            fetchLatestReading();
        }
    }, [device._id, baseUrl]);

    const handleClick = () => {
        navigate(`/device/${device._id}`);
    };

    return (
        <div className='border border-solid border-gray-200 rounded-lg shadow-md p-2' onClick={handleClick}>
            <img src={device.image || placeholderImage} alt={device.plantType} style={{ width: '100%', borderRadius: '8px' }} />
            <h3>{device.plantType}</h3>
            {latestReading ? (
                <div>
                    <p>Temperature: {latestReading.temperature}°C</p>
                    <p>Humidity: {latestReading.humidity}%</p>
                    <p>UV A: {latestReading.uvA}%</p> 
                    <p>UV B: {latestReading.uvB}%</p> 
                    <p>UV C: {latestReading.uvC}%</p>
                </div>
            ) : (
                <p>Loading latest reading...</p>
            )}
        </div>
    );
};

export default GridView;
