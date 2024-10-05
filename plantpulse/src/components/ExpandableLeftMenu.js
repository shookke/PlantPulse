import React, { useState } from 'react';

const ExpandableLeftMenu = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleMenu = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`h-screen bg-gray-800 text-white ${isExpanded ? 'w-64' : 'w-20'} transition-all duration-300`}>
            <div className="flex items-center justify-between px-4 py-3">
                <button 
                    className="focus:outline-none" 
                    onClick={toggleMenu}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            <nav className="mt-5">
                <ul>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <span className={`${!isExpanded ? 'hidden' : 'inline'} ml-2`}>Dashboard</span>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <span className={`${!isExpanded ? 'hidden' : 'inline'} ml-2`}>Profile</span>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <span className={`${!isExpanded ? 'hidden' : 'inline'} ml-2`}>Settings</span>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <span className={`${!isExpanded ? 'hidden' : 'inline'} ml-2`}>Logout</span>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default ExpandableLeftMenu;
