// src/components/Histogram.js
import React from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Histogram = ({ title, data }) => {
    const formattedData = data.map((value, index) => ({ name: index, value }));
    console.log(formattedData);
    return (
        <div style={{ marginBottom: '24px' }}>
            <h3>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(date, 'yyyy-MM-dd HH:mm:ss')} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Histogram;
