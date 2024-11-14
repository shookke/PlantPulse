// src/components/LineGraph.js
import React from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LineGraph = ({ title, data }) => {
    console.log(data);
    return (
        <div className='bg-white shadow-md rounded-lg w-full'>
            <h3 className='text-center mb-4'>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'hh:mmaaa')}/>
                    <YAxis  />
                    <Tooltip labelFormatter={(date) => format(new Date(date), 'MM/dd/yy hh:mm:ssaaa')}/>
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    <Line type="monotone" dataKey="uvA" stroke="#8884d8" name="UV A" />
                    <Line type="monotone" dataKey="uvB" stroke="#82ca9d" name="UV B" />
                    <Line type="monotone" dataKey="uvC" stroke="#ff4d4d" name="UV C" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LineGraph;
