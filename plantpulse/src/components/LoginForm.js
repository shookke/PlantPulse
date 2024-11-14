// src/components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import Button from './Button';

const getExpirationDate = (expiration) => {
    let  date  = new Date();
    let unit = expiration.slice(-1); // Get the unit of time
    let  value = parseInt(expiration.slice(0, -1), 10); // Get the value of time
    
    if (isNaN(value)) {
        throw new Error("Invalid expiresIn format");
    }
    
    switch (unit) {
        case 'y':
            date.setFullYear(date.getFullYear() + value);
            break;
        case'm':
           date.setMonth(date.getMonth() + value);
           break;
        case'd':
           date.setDate(date.getDate() + value);
           break;
        case'h':
          date.setHours(date.getHours() + value);
          break;
        default:
            date.setDate(date.getDate() + value);
            break;
    }
    return  date;
};

const LoginForm = ({ baseUrl }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        stayLoggedIn: false,
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${baseUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('expiration', getExpirationDate(data.expiresIn).getTime());
                navigate('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            setError('Login failed. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <InputField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
            />
            <InputField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
            />
            <div>
                <label>Remember me:</label>
                <input 
                    type="checkbox" 
                    name="stayLoggedIn"
                    checked={formData.stayLoggedIn}
                    onChange={handleInputChange}
                />
            </div>
            <Button theme="action" disabled={loading} type="submit">
                {loading ? 'Logging in...' : 'Login'}
            </Button>
        </form>
    );
};

export default LoginForm;
