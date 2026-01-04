import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store/hooks';

export interface CampaignProgress {
    status: string;
    total: number;
    sent: number;
    failed: number;
    progress: number;
    error?: string;
    timestamp?: string;
}

export interface CampaignStats {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    failed: number;
    timestamp?: string;
}

export interface RecipientUpdate {
    recipientId: string;
    status: string;
    email?: string;
    name?: string;
    error?: string;
    timestamp?: string;
}

export interface CampaignStatusChange {
    campaignId: string;
    status: string;
    timestamp?: string;
}

/**
 * Custom hook for Socket.io connection and real-time updates
 */
export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const { token } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!token) {
            console.log('⚠️ No token available, skipping socket connection');
            return;
        }

        // Socket.io connects to root URL, not /api
        // Extract base URL from VITE_API_URL (remove /api if present)
        let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Remove /api suffix if present since Socket.io is mounted at root
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4); // Remove '/api'
        }
        // Ensure no trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');
        console.log('🔌 Connecting to Socket.io server:', baseUrl);

        // Initialize socket connection
        const socket = io(baseUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'], // Fallback to polling
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            setIsConnected(true);
            setConnectionError(null);
        });

        // Listen for campaign-joined confirmation
        socket.on('campaign-joined', (data: { campaignId: string }) => {
            console.log(`✅ Successfully joined campaign room: ${data.campaignId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected, reconnect manually
                socket.connect();
            }
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);
            setConnectionError(error.message);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
            setConnectionError(null);
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Socket reconnection failed');
            setConnectionError('Failed to reconnect. Please refresh the page.');
        });

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up socket connection');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    const joinCampaignRoom = useCallback((campaignId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join-campaign', campaignId);
            console.log(`📊 Joining campaign room: ${campaignId}`);
        } else {
            console.warn('⚠️ Cannot join campaign room: socket not connected');
        }
    }, [isConnected]);

    const leaveCampaignRoom = useCallback((campaignId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('leave-campaign', campaignId);
            console.log(`📊 Leaving campaign room: ${campaignId}`);
        }
    }, []);

    const onCampaignProgress = useCallback((callback: (data: CampaignProgress) => void) => {
        if (socketRef.current) {
            console.log('📊 Setting up campaign-progress listener');
            // Store the wrapper function so we can remove it later
            const listener = (data: CampaignProgress) => {
                console.log('📊 Received campaign-progress event:', data);
                callback(data);
            };
            socketRef.current.on('campaign-progress', listener);
            return () => {
                console.log('📊 Removing campaign-progress listener');
                socketRef.current?.off('campaign-progress', listener);
            };
        } else {
            console.warn('⚠️ Cannot set up campaign-progress listener: socket not connected');
        }
        return () => { };
    }, []);

    const onCampaignStats = useCallback((callback: (data: CampaignStats) => void) => {
        if (socketRef.current) {
            console.log('📊 Setting up campaign-stats listener');
            // Store the wrapper function so we can remove it later
            const listener = (data: CampaignStats) => {
                console.log('📊 Received campaign-stats event:', data);
                callback(data);
            };
            socketRef.current.on('campaign-stats', listener);
            return () => {
                console.log('📊 Removing campaign-stats listener');
                socketRef.current?.off('campaign-stats', listener);
            };
        } else {
            console.warn('⚠️ Cannot set up campaign-stats listener: socket not connected');
        }
        return () => { };
    }, []);

    const onRecipientUpdate = useCallback((callback: (data: RecipientUpdate) => void) => {
        if (socketRef.current) {
            console.log('👤 Setting up recipient-update listener');
            // Store the wrapper function so we can remove it later
            const listener = (data: RecipientUpdate) => {
                console.log('👤 Received recipient-update event:', data);
                callback(data);
            };
            socketRef.current.on('recipient-update', listener);
            return () => {
                console.log('👤 Removing recipient-update listener');
                socketRef.current?.off('recipient-update', listener);
            };
        } else {
            console.warn('⚠️ Cannot set up recipient-update listener: socket not connected');
        }
        return () => { };
    }, []);

    const onCampaignStatusChange = useCallback((callback: (data: CampaignStatusChange) => void) => {
        if (socketRef.current) {
            console.log('🔄 Setting up campaign-status-change listener');
            // Store the wrapper function so we can remove it later
            const listener = (data: CampaignStatusChange) => {
                console.log('🔄 Received campaign-status-change event:', data);
                callback(data);
            };
            socketRef.current.on('campaign-status-change', listener);
            return () => {
                console.log('🔄 Removing campaign-status-change listener');
                socketRef.current?.off('campaign-status-change', listener);
            };
        } else {
            console.warn('⚠️ Cannot set up campaign-status-change listener: socket not connected');
        }
        return () => { };
    }, []);

    const onCampaignJoined = useCallback((callback: (data: { campaignId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('campaign-joined', callback);
            return () => {
                socketRef.current?.off('campaign-joined', callback);
            };
        }
        return () => { };
    }, []);

    return {
        isConnected,
        connectionError,
        joinCampaignRoom,
        leaveCampaignRoom,
        onCampaignProgress,
        onCampaignStats,
        onRecipientUpdate,
        onCampaignStatusChange,
        onCampaignJoined
    };
}
















