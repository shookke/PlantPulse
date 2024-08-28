// src/pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage = ({ baseUrl }) => {
    return (
        <div>
            <h1>User Login</h1>
            <LoginForm baseUrl={baseUrl} />
        </div>
    );
};

export default LoginPage;
