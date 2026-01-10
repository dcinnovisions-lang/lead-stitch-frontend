import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface AuthState {
    auth: {
        user: {
            rejectionReason?: string;
            email?: string;
        } | null;
    };
}

const AccountRejected: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: AuthState) => state.auth?.user);

    const handleGoHome = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleContactSupport = () => {
        window.location.href = 'mailto:support@leadstitch.com';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {/* Error Illustration */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Access Denied
                </h1>

                {/* Subtitle */}
                <p className="text-center text-gray-600 mb-6">
                    Your account registration has been rejected.
                </p>

                {/* Reason Box */}
                {user?.rejectionReason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <h3 className="text-sm font-semibold text-red-800 mb-2">Reason:</h3>
                        <p className="text-sm text-red-700">
                            {user.rejectionReason}
                        </p>
                    </div>
                )}

                {/* Email Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-1">Account Email</p>
                    <p className="text-lg font-semibold text-gray-900 break-all">
                        {user?.email || 'Loading...'}
                    </p>
                </div>

                {/* What Now */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">What now?</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                            <span className="mr-3">•</span>
                            <span>You can contact our support team to appeal this decision</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-3">•</span>
                            <span>Provide additional information that may help your application</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-3">•</span>
                            <span>Try registering with a different email address</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleContactSupport}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Contact Support
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>

                {/* Support Contact */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Need immediate assistance?</p>
                    <a
                        href="mailto:support@leadstitch.com"
                        className="inline-block text-blue-600 hover:text-blue-700 font-medium"
                    >
                        support@leadstitch.com
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AccountRejected;
