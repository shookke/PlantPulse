// src/routes/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    var token = localStorage.getItem('token');
    var expiration = localStorage.getItem('expiration');
    if (expiration <= Date.now()) { 
        token = null
        expiration = null;
        localStorage.clear();
    };
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
