import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface AuthState {
    auth: {
        user: {
            approvalStatus?: string;
            email?: string;
        } | null;
    };
}

const PendingApproval: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: AuthState) => state.auth?.user);
    const [checkInterval, setCheckInterval] = useState<NodeJS.Timer | null>(null);

    useEffect(() => {
        // Redirect to dashboard if already approved
        if (user?.approvalStatus === 'approved') {
            navigate('/dashboard');
            return;
        }

        // Redirect to home if rejected
        if (user?.approvalStatus === 'rejected') {
            navigate('/account-rejected');
            return;
        }

        // Check approval status every 30 seconds
        const interval = setInterval(() => {
            checkApprovalStatus();
        }, 30000);

        setCheckInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [user, navigate]);

    const checkApprovalStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/approval-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.approvalStatus === 'approved') {
                    // Update Redux store or redirect
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.error('Error checking approval status:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {/* Illustration */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-yellow-600"
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
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Status Title */}
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Pending Approval
                </h1>

                {/* Status Description */}
                <p className="text-center text-gray-600 mb-6">
                    Your account has been created successfully! An administrator will review your registration shortly.
                </p>

                {/* User Email */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-1">Account Email</p>
                    <p className="text-lg font-semibold text-gray-900 break-all">
                        {user?.email || 'Loading...'}
                    </p>
                </div>

                {/* What to Expect */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Our team will review your request</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">You'll receive an email once approved</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">This usually takes less than 24 hours</span>
                        </li>
                    </ul>
                </div>

                {/* Auto-check Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
                    <p className="flex items-center">
                        <svg className="w-4 h-4 text-blue-500 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        We'll automatically refresh your status every 30 seconds
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={checkApprovalStatus}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Check Status Now
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Contact Support */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Need help? Contact us at{' '}
                    <a href="mailto:support@leadstitch.com" className="text-blue-600 hover:underline">
                        support@leadstitch.com
                    </a>
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
