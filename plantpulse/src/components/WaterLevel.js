import React from 'react';

const WaterLevel = ({ level, min, max }) => {
  const percentage = ((level - 200) / 1800) * 100;
  const minPercentage = ((min - 200) / 1800) * 100;
  const maxPercentage = ((max - 200) / 1800) * 100;
  console.log(min);
  console.log(max);
  return (
    <div className="water-level-container">
      <span className="raindrop-icon">💧</span>
      <div className="water-level-meter">
        {/* Water Level Fill */}
        <div
          className="water-level-fill"
          style={{
            height: `${percentage}%`,
          }}
        />
        {/* Min Level Indicator */}
        <div
          className="level-indicator min-line"
          style={{
            bottom: `${minPercentage}%`,
          }}
        >
          Min
        </div>
        {/* Max Level Indicator */}
        <div
          className="level-indicator max-line"
          style={{
            bottom: `${maxPercentage}%`,
          }}
        >
          Max
        </div>
      </div>
    </div>
  );
};

export default WaterLevel;
