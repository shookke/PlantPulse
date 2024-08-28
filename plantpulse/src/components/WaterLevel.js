import React from 'react';

const WaterLevel = ({ level }) => {
  return (
    <div className="water-level-container">
      <span className="raindrop-icon" />
      <div 
        style={{
          height: `${level  * 100}%`,
          backgroundColor: 'blue',
          borderRadius: '5px'
        }}
      />
      <div
        style={{
          height: `calc(100% - ${(level * 100).toString()})`,
          backgroundColor: 'lightgrey'
        }}
      />
    </div>
  );
};

export default WaterLevel;
