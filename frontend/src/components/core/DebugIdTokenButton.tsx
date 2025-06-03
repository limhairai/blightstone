import { useAuth } from "@/contexts/AuthContext";

export function DebugIdTokenButton() {
  const { user } = useAuth();
  return (
    <button
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, padding: 12, background: '#b4a0ff', color: '#222', borderRadius: 8, fontWeight: 'bold' }}
      onClick={async () => {
        if (user) {
          const token = await user.getIdToken();
          window.prompt("Copy your Firebase ID token:", token);
        } else {
          alert("No user logged in");
        }
      }}
    >
      Get Firebase ID Token
    </button>
  );
} 