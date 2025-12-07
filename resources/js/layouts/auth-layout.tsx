import React from 'react';
import logo from '../../../public/logo.jpg'
interface AuthSimpleLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function AuthSimpleLayout({ 
    title, 
    description, 
    children 
}: AuthSimpleLayoutProps) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
            {/* Logo Section */}
            <div className="mb-8 text-center">
                <a href="/" className="inline-block">
                    <img 
                        src={logo}
                        alt="Lixnet" 
                        className="h-20 w-auto"
                    />
                </a>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-md">
                {/* Title and Description */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {title}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {description}
                    </p>
                </div>

                {/* Form Content */}
                <div>
                    {children}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-gray-500">
                <p>© 2025 Lixnet Marketplace. All rights reserved.</p>
            </div>
        </div>
    );
}