import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded shadow-lg text-white font-medium z-50 animate-bounce ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}>
            {message}
        </div>
    );
};

export default Toast;
