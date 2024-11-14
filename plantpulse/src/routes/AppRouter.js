// src/routes/AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import RegistrationPage from '../pages/RegistrationPage';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import PlantDetailsPage from '../pages/PlantDetailsPage';
import DevicesPage from '../pages/DevicesPage';
import DeviceDetailsPage from '../pages/DeviceDetailsPage';
import PrivateRoute from '../routes/PrivateRoute';

const AppRouter = () => {
    
    const apiBaseUrl = "https://plantpulse.app/api/v1";

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    <PrivateRoute>
                        <HomePage baseUrl={apiBaseUrl} />
                    </PrivateRoute>
                } />
                 <Route path="/plants/:plantId" element={
                    <PrivateRoute>
                        <PlantDetailsPage baseUrl={apiBaseUrl} />
                    </PrivateRoute>
                } />
                <Route path="/devices" element={
                    <PrivateRoute>
                        <DevicesPage baseUrl={apiBaseUrl} />
                    </PrivateRoute>
                } />
                <Route path="/devices/:deviceId" element={
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
