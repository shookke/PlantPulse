// src/components/InputField.js
import React from 'react';

const InputField = ({ label, type, name, value, onChange, error }) => {
    return (
        <div>
            <label>{label}
            <input
                className='border-2 border-solid border-gray-200 rounded-md p-2'
                type={type}
                name={name}
                value={value}
                onChange={onChange}
            />
            </label>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default InputField;
