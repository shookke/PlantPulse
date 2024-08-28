// src/routes/AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import RegistrationPage from '../pages/RegistrationPage';
import LoginPage from '../pages/LoginPage';
import DevicesPage from '../pages/DevicesPage';
import DeviceDetailsPage from '../pages/DeviceDetailsPage';
import PrivateRoute from '../routes/PrivateRoute';

const AppRouter = () => {
    const apiBaseUrl = 'http://localhost:8687/api';

    return (
        <Router>
            <Routes>
            <Route path="/" element={
                    <PrivateRoute>
                        <DevicesPage baseUrl={apiBaseUrl} />
                    </PrivateRoute>
                } />
                <Route path="/device/:deviceId" element={
                    <PrivateRoute>
                        <DeviceDetailsPage baseUrl={apiBaseUrl} />
                    </PrivateRoute>
                } />
                <Route path="/register" element={<RegistrationPage baseUrl={apiBaseUrl} />} />
                <Route path="/login" element={<LoginPage baseUrl={apiBaseUrl} />} />
                <Route path="*" element={<Navigate to="/" />} />
                {/* Add more routes as needed */}
            </Routes>
        </Router>
    );
};

export default AppRouter;
