import React from 'react';


interface ButtonProps {
  label: string;          
  onClick?: () => void;    
  type?: "button" | "submit" | "reset"; 
  variant?: "primary" | "secondary" | "danger"; 
  fullWidth?: boolean;  
}

export default function Button({ 
  label, 
  onClick, 
  type = "button", 
  variant = "primary", 
  fullWidth = false 
}: ButtonProps) {
  
  
  const baseStyles = "py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {label}
    </button>
  );
}