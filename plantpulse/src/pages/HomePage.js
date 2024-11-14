// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import GridView from '../components/GridView';

const HomePage = ({ baseUrl }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlants = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }
    
            try {
                const response = await fetch(`${baseUrl}/plants/`, {
                    headers: {
                        Authorization: `${token}`,
                    },
                });
    
                if (!response.ok) {
                    throw new Error('Failed to fetch plants');
                }
    
                const data = await response.json();
                setPlants(data.plants);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        return () => {
            fetchPlants();
        }
    }, [baseUrl]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className='flex-1 p-4'>
            <h1>My Plants</h1>
            {plants.length ===  0 ? <p>No plants found.</p> : <GridView plants={plants} />}
        </div>
    );
};

export default HomePage;
