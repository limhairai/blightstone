"use client";
import { useEffect, useState } from 'react';

const FACEBOOK_APP_ID = '659164973596972';

export default function ConnectFacebookButton({
  onFbLogin,
  connected,
}: {
  onFbLogin: (response: any) => void;
  connected: boolean;
}) {
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    if (window.FB && typeof window.FB.getUserID === 'function') {
      setIsSdkReady(true);
      return;
    }

    if (!window.fbAsyncInit) {
      window.fbAsyncInit = function () {
        if (window.FB) {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });
          setIsSdkReady(true);
        } else {
          console.error("Facebook SDK loaded but window.FB is not available in fbAsyncInit.");
        }
      };
    }

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error("Failed to load Facebook SDK script.");
      };
      document.head.appendChild(script);
    }

  }, []);

  const handleFacebookLogin = () => {
    if (!isSdkReady || !window.FB) {
      console.warn("Facebook SDK not ready or window.FB not available.");
      return;
    }
    window.FB!.login(function (response) {
      if (response.authResponse) {
        window.FB!.api('/me', {
          fields: 'id,name,email',
          access_token: response.authResponse.accessToken 
        }, function (profile) {
          onFbLogin({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            accessToken: response.authResponse.accessToken
          });
        });
      } else {
        onFbLogin({ status: 'unknown' });
      }
    }, { scope: 'public_profile,email,ads_management,business_management' });
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={!isSdkReady || connected}
      className={`
        w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors
        ${!isSdkReady || connected
          ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70'
          : 'bg-[#1877f3] text-white hover:bg-[#166fe0]'}
      `}
      style={{ minHeight: 40 }}
    >
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#fff"/>
        <path d="M22 16.001C22 12.134 18.866 9 15 9C11.134 9 8 12.134 8 16.001C8 19.134 10.134 21.866 13 22.732V18.001H11V16.001H13V14.501C13 12.843 14.343 11.501 16 11.501H18V13.501H16C15.448 13.501 15 13.949 15 14.501V16.001H18L17.5 18.001H15V22.732C17.866 21.866 20 19.134 20 16.001H22Z" fill="#1877f3"/>
      </svg>
      {connected 
        ? <span className="flex items-center gap-1">Connected <span className="text-green-400">●</span></span> 
        : isSdkReady 
          ? <span>Log in with Facebook</span> 
          : <span>Loading Facebook...</span>}
    </button>
  );
} 