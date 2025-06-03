// frontend/src/types/facebook.d.ts

// Based on common Facebook SDK response structures
interface FBAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
  grantedScopes?: string; // Comma-separated string of scopes
  reauthorize_required_in?: number; // In seconds
}

interface FBLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: FBAuthResponse | null; // Can be null if status is not 'connected'
}

interface FBProfileResponse {
  id: string;
  name: string;
  email?: string; // Email might not always be present depending on permissions
  // Add other profile fields as needed
  [key: string]: any; // For any other fields that might be returned
}

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string; // e.g., 'v19.0'
      }) => void;
      login: (callback: (response: FBLoginResponse) => void, options?: { scope: string }) => void;
      api: (
        path: string, 
        params: { fields: string; access_token?: string; [key: string]: any }, 
        callback: (response: FBProfileResponse) => void
      ) => void;
      getUserID: () => string; // Added from previous usage context
      // Add other Facebook SDK methods here as they are used and cause type errors
      // For now, allow any other properties to prevent cascading errors if other methods
      // are called immediately after init in the same component.
      [key: string]: any;
    };
  }
}

// This export {} is important to make it a module file,
// which then allows augmenting the global scope.
export {}; 