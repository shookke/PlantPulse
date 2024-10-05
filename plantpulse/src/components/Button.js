import React from 'react';

const Button = ({ type = "button", theme = "default", onClick = null, disabled = false , children}) => {
    const getButtonClass = () => {
        switch (theme) {
            case "action":
                return "bg-green-700 text-white rounded-md";
            case "primary":
                return "bg-blue-500 text-white rounded-md";
            case "secondary":
                return "bg-gray-500 text-white rounded-md";
            case "danger":
                return "bg-red-500 text-white rounded-md";
            default:
                return "bg-gray-300 text-black rounded-md";
        }
    };

    return (
        <button
            type={type}
            className={`${getButtonClass()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={!disabled ? onClick : null}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;