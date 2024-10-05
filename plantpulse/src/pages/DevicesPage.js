// src/pages/DevicesPage.js
import React, { useEffect, useState } from 'react';
import GridView from '../components/GridView';
import ExpandableLeftMenu from '../components/ExpandableLeftMenu';

const DevicesPage = ({ baseUrl }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDevices = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }
    
            try {
                const response = await fetch(`${baseUrl}/devices/`, {
                    headers: {
                        Authorization: `${token}`,
                    },
                });
    
                if (!response.ok) {
                    throw new Error('Failed to fetch devices');
                }
    
                const data = await response.json();
                setDevices(data.devices);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        return () => {
            fetchDevices();
        }
    }, [baseUrl]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className='flex-1 p-4'>
            <h1>Your Devices</h1>
            <p>You have {devices.length} device{devices.length!==  1 ? 's' : ''}:</p>
            {devices.length ===  0 ? <p>No devices found.</p> : <GridView devices={devices} baseUrl={baseUrl} />}
        </div>
    );
};

export default DevicesPage;
