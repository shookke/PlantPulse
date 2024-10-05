// src/components/RegistrationForm.js
import React, { useState } from 'react';
import InputField from './InputField';
import ValidationMessages from './ValidationMessages';
import Button from './Button';

const RegistrationForm = ({ baseUrl }) => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState([]);
    const [apiError, setApiError] = useState('');

    const validateForm = () => {
        let newErrors = [];

        if (!formData.firstname) {
            newErrors.push('First name is required');
        }

        if (!formData.lastname) {
            newErrors.push('Last name is required');
        }

        if (!formData.email) {
            newErrors.push('Email is required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.push('Email is invalid');
        }

        if (!formData.password) {
            newErrors.push('Password is required');
        } else if (formData.password.length < 6) {
            newErrors.push('Password must be at least 6 characters');
        }

        if (!formData.confirmPassword) {
            newErrors.push('Please confirm your password');
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.push('Passwords do not match');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            const dataToSend = {
                name: {
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                },
                email: formData.email,
                password: formData.password,
            };

            try {
                const response = await fetch(`${baseUrl}/users/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                });

                if (response.ok) {
                    alert('Registration successful!');
                    setFormData({
                        firstname: '',
                        lastname: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                    });
                    setErrors([]);
                    setApiError('');
                } else {
                    const data = await response.json();
                    setApiError(data.message || 'Registration failed');
                }
            } catch (error) {
                setApiError('Registration failed. Please try again later.');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {apiError && <p className="error">{apiError}</p>}
            <ValidationMessages messages={errors} />
            <InputField
                label="First Name"
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
            />
            <InputField
                label="Last Name"
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
            />
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
            <InputField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
            />
            <Button theme="action" type="submit">
                Register
            </Button>
        </form>
    );
};

export default RegistrationForm;
