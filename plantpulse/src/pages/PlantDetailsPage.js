// src/pages/plantDetailsPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LineGraph from '../components/LineGraph';
import WaterLevel from '../components/WaterLevel';

const PlantDetailsPage = ({ baseUrl }) => {
    const { plantId } = useParams();
    const [plant, setplant] = useState({});
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
                const response = await fetch(`${baseUrl}/readings/${plantId}?page=${page}&limit=${limit}`, {
                    headers: {
                        Authorization: `${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch readings');
                }

                const data = await response.json();
                setplant(data.plant);
                setReadings(data.readings);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReadings();
    }, [plantId, page, limit, baseUrl]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className='flex flex-col grow p-4'>
            <div className='flex flex-row grow'>
                <h1>Plant Details</h1>
            </div>
            {readings.length !== 0 ? (<>
            <div className='flex flex-row items-center space-x-4 w-full mb-6'>
                <img src={`${readings[0].rgbImage}`} alt={`${plant.plantName}`} className='w-48' />
                <img src={`${readings[0].ndviImage}`} alt={`${plant.plantName}`} className='w-48' />
                <WaterLevel title="Water Level" level={readings[0].soilMoisture} min={plant.plantType.minSoilMoisture} max={plant.plantType.maxSoilMoisture}/>
            </div>
            <div className='flex flex-row flex-wrap w-full py-10 gap-4'>
                <h2 className='w-full'>Plant Type: {plant.plantType.scientificName}</h2>
                <div className='flex flex-row w-full'>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <LineGraph title="Temperature" data={readings.map(r => ({date: new Date(r.createdAt), value: r.temperature}))} />
                    </div>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <LineGraph title="Humidity" data={readings.map(r => ({date: new Date(r.createdAt), value: r.humidity}))} />
                    </div>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <LineGraph title="Light Level" data={readings.map(r => ({date: new Date(r.createdAt), value: r.lux}))} />
                    </div>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <LineGraph title="UV Levels" data={readings.map(r => ({date: new Date(r.createdAt), uvA: r.uvA, uvB: r.uvB, uvC: r.uvC}))} />
                    </div>
                </div>
            </div></> ) : (<></>) }
        </div>
    );
};

export default PlantDetailsPage;
