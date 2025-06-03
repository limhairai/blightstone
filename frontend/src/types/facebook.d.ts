// frontend/src/types/facebook.d.ts
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