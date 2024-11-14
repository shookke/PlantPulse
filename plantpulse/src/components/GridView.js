// src/components/GridView.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const placeholderImage = 'https://via.placeholder.com/150';

const GridView = ({ plants }) => {
    return (
        <div className="grid grid-flow-col auto-cols-max">
            {plants.map(plant => (
                <PlantCard key={plant._id} plant={plant} />
            ))}
        </div>
    );
};

const PlantCard = ({ plant }) => {
    const navigate = useNavigate();
    const plantImage = () => {
        if (plant.latestReading && plant.latestReading.rgbImage){
            return plant.latestReading.rgbImage
        } else {
            return placeholderImage
        }
    }
    const handleClick = () => {
        navigate(`/plants/${plant._id}`);
    };

    return (
        <div className='border border-solid border-gray-200 rounded-lg shadow-md p-2 w-48' onClick={handleClick}>
            <img src={plantImage()} alt={plant.plantType.commonName} style={{ maxWidth: '100%', borderRadius: '8px' }} />
            <h6>{plant.plantType.commonName}</h6>
            {plant.latestReading ? (
                <div>
                    <p>{plant.plantType.watering} &bull; {plant.plantType.lighting}</p>
                </div>
            ) : (
                <p>Loading latest reading...</p>
            )}
        </div>
    );
};

export default GridView;
