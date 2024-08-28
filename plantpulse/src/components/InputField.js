// src/components/InputField.js
import React from 'react';

const InputField = ({ label, type, name, value, onChange, error }) => {
    return (
        <div className="input-field">
            <label>{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
            />
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default InputField;
