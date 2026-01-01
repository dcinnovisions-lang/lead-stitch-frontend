/**
 * LinkedIn Cookie Extractor Script
 * This script is injected into the LinkedIn popup window to extract cookies
 * after successful login and send them to the parent window via postMessage
 */

(function() {
  'use strict';

  // Only run in popup windows (not in main window)
  if (window.opener === null || window.opener === window) {
    return;
  }

  console.log('LinkedIn Cookie Extractor: Script loaded');

  // Function to extract all cookies
  function extractCookies() {
    const cookies = [];
    const cookieString = document.cookie;
    
    if (!cookieString) {
      return cookies;
    }

    // Parse cookies from document.cookie
    const cookiePairs = cookieString.split(';');
    cookiePairs.forEach(pair => {
      const trimmed = pair.trim();
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const name = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        if (name && value) {
          cookies.push({
            name: name,
            value: value,
            domain: window.location.hostname,
            path: '/',
          });
        }
      }
    });

    // Also try to get cookies from localStorage/sessionStorage if available
    try {
      // LinkedIn sometimes stores session info in storage
      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.toLowerCase().includes('session') || key.toLowerCase().includes('auth')) {
          cookies.push({
            name: `storage_${key}`,
            value: localStorage.getItem(key),
            domain: window.location.hostname,
            storage: 'localStorage',
          });
        }
      });
    } catch (e) {
      console.log('Could not access localStorage:', e);
    }

    return cookies;
  }

  // Function to check if user is logged in
  function isLoggedIn() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    // Check URL patterns that indicate successful login
    const loggedInPatterns = [
      '/feed',
      '/voyager',
      '/mynetwork',
      '/messaging',
      '/notifications',
      '/me',
    ];

    const isLoginPage = pathname.includes('/login') || pathname.includes('/checkpoint');
    
    // If we're not on login page and on a logged-in page, user is logged in
    if (!isLoginPage) {
      const isOnLoggedInPage = loggedInPatterns.some(pattern => pathname.includes(pattern));
      if (isOnLoggedInPage) {
        return true;
      }
      
      // Also check if we have LinkedIn session cookies
      const cookies = extractCookies();
      const hasSessionCookies = cookies.some(c => 
        c.name.toLowerCase().includes('li_at') || 
        c.name.toLowerCase().includes('jsessionid') ||
        c.name.toLowerCase().includes('bcookie')
      );
      
      if (hasSessionCookies) {
        return true;
      }
    }

    return false;
  }

  // Function to send cookies to parent window
  function sendCookiesToParent() {
    try {
      const cookies = extractCookies();
      const isLoggedInStatus = isLoggedIn();
      const currentUrl = window.location.href;

      console.log('LinkedIn Cookie Extractor: Extracted cookies:', cookies.length);
      console.log('LinkedIn Cookie Extractor: Is logged in:', isLoggedInStatus);

      if (cookies.length === 0 && !isLoggedInStatus) {
        console.log('LinkedIn Cookie Extractor: No cookies found and not logged in');
        return;
      }

      // Send message to parent window
      const message = {
        type: 'LINKEDIN_SESSION_CAPTURED',
        source: 'linkedin-cookie-extractor',
        data: {
          cookies: cookies,
          url: currentUrl,
          isLoggedIn: isLoggedInStatus,
          timestamp: new Date().toISOString(),
        }
      };

      // Send to parent window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, window.location.origin);
        console.log('LinkedIn Cookie Extractor: Sent cookies to parent window');
      } else {
        console.error('LinkedIn Cookie Extractor: Parent window is closed or not available');
      }
    } catch (error) {
      console.error('LinkedIn Cookie Extractor: Error sending cookies:', error);
    }
  }

  // Monitor URL changes (LinkedIn uses SPA navigation)
  let lastUrl = window.location.href;
  const urlCheckInterval = setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('LinkedIn Cookie Extractor: URL changed to:', currentUrl);
      
      // Check if user just logged in
      if (isLoggedIn()) {
        // Wait a bit for cookies to be set
        setTimeout(() => {
          sendCookiesToParent();
        }, 1000);
      }
    }
  }, 500);

  // Also check immediately and after a delay
  setTimeout(() => {
    if (isLoggedIn()) {
      sendCookiesToParent();
    }
  }, 2000);

  // Listen for storage events (LinkedIn might update storage on login)
  window.addEventListener('storage', (e) => {
    if (isLoggedIn()) {
      setTimeout(() => {
        sendCookiesToParent();
      }, 500);
    }
  });

  // Clean up interval when window closes
  window.addEventListener('beforeunload', () => {
    clearInterval(urlCheckInterval);
    // Send final cookies before closing
    if (isLoggedIn()) {
      sendCookiesToParent();
    }
  });

  console.log('LinkedIn Cookie Extractor: Monitoring started');
})();

