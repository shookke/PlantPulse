// src/pages/RegistrationPage.js
import React from 'react';
import RegistrationForm from '../components/RegistrationForm';

const RegistrationPage = ({ baseUrl }) => {
    return (
        <div>
            <h1>User Registration</h1>
            <RegistrationForm baseUrl={baseUrl} />
        </div>
    );
};

export default RegistrationPage;
