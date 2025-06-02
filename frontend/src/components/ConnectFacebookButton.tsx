"use client";
import { useEffect } from 'react';

const FACEBOOK_APP_ID = '659164973596972';

export default function ConnectFacebookButton({
  onFbLogin,
  connected,
}: {
  onFbLogin: (response: any) => void;
  connected: boolean;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || window.FB) return;
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) return;
    window.FB.login(function (response) {
      if (response.authResponse) {
        // Get user info with the access token
        window.FB.api('/me', { 
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

  // Classic Facebook button
  return (
    <button
      onClick={handleFacebookLogin}
      disabled={connected}
      className={`
        w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors
        ${connected
          ? 'bg-blue-200 text-white cursor-not-allowed'
          : 'bg-[#1877f3] text-white hover:bg-[#166fe0]'}
      `}
      style={{ minHeight: 40 }}
    >
      {/* Facebook logo SVG */}
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#fff"/>
        <path d="M22 16.001C22 12.134 18.866 9 15 9C11.134 9 8 12.134 8 16.001C8 19.134 10.134 21.866 13 22.732V18.001H11V16.001H13V14.501C13 12.843 14.343 11.501 16 11.501H18V13.501H16C15.448 13.501 15 13.949 15 14.501V16.001H18L17.5 18.001H15V22.732C17.866 21.866 20 19.134 20 16.001H22Z" fill="#1877f3"/>
      </svg>
      {connected ? (
        <span className="flex items-center gap-1">Connected <span className="text-white">●</span></span>
      ) : (
        <span>Log in with Facebook</span>
      )}
    </button>
  );
} 