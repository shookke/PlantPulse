// src/pages/DeviceDetailsPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LineGraph from '../components/LineGraph';
import WaterLevel from '../components/WaterLevel';

const DeviceDetailsPage = ({ baseUrl }) => {
    const { deviceId } = useParams();
    const [device, setDevice] = useState({});
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const page = 1
    const limit = 24;

    useEffect(() => {
        const fetchReadings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/readings/${deviceId}?page=${page}&limit=${limit}`, {
                    headers: {
                        Authorization: `${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch readings');
                }

                const data = await response.json();
                setDevice(data.device);
                setReadings(data.readings);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReadings();
    }, [deviceId, page, limit, baseUrl]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Device Details</h1>
            <img src={`${device.image}`} alt={`${device.plantType}`} />
            <WaterLevel title="Water Level" level={readings[0].waterLevel}/>
            <h2>Plant Type: {device.plantType}</h2>
            <div className='columns-3'>
                <LineGraph title="Temperature" data={readings.map(r => ({date: new Date(r.createdAt), value: r.temperature}))} />
                <LineGraph title="Humidity" data={readings.map(r => ({date: new Date(r.createdAt), value: r.humidity}))} />
                <LineGraph title="Light Level" data={readings.map(r => ({date: new Date(r.createdAt), value: r.lightLevel}))} />
            </div>
        </div>
    );
};

export default DeviceDetailsPage;
