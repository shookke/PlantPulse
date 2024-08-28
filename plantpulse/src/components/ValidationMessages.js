// src/components/ValidationMessages.js
import React from 'react';

const ValidationMessages = ({ messages }) => {
    return (
        <div className="validation-messages">
            {messages.map((message, index) => (
                <p key={index} className="error">
                    {message}
                </p>
            ))}
        </div>
    );
};

export default ValidationMessages;
