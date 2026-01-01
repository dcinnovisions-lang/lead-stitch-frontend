import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { getCampaignById, getCampaignRecipients } from '../store/slices/campaignsSlice';

/**
 * Fallback polling hook for campaign updates when WebSocket is not available
 * @param campaignId - Campaign ID to poll
 * @param enabled - Whether polling is enabled
 * @param interval - Polling interval in milliseconds (default: 2000ms)
 */
export function useCampaignPolling(
  campaignId: string | undefined, 
  enabled: boolean,
  interval: number = 2000
) {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!campaignId || !enabled) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    dispatch(getCampaignById(campaignId));
    dispatch(getCampaignRecipients(campaignId));

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      dispatch(getCampaignById(campaignId));
      dispatch(getCampaignRecipients(campaignId));
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [campaignId, enabled, interval, dispatch]);
}
















