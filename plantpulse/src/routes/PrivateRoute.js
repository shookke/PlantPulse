// src/routes/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    let token = localStorage.getItem('token');
    let expiration = parseInt(localStorage.getItem('expiration'));
    let time = Date.now();

    if (expiration <= time) { 
        token = null
        expiration = null;
        localStorage.clear();
    };
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
