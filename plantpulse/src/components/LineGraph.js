// src/components/LineGraph.js
import React from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LineGraph = ({ title, data }) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <h3>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(date, 'MM/dd/yyyy hh:mm:ssaaa')}/>
                    <YAxis  />
                    <Tooltip tickFormatter={(date) => format(date, 'MM/dd/yy hh:mm:ssaaa')}/>
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LineGraph;
