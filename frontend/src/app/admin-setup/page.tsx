"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowRight, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/stores/supabase-client";

export default function AdminSetupPage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const createFirstAdmin = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully created admin account for ${email}`);
        setSuccess(true);
        setEmail("");
        
        // Force refresh the user session to get updated admin privileges
        if (session) {
          try {
            const { data: { session: newSession } } = await supabase.auth.refreshSession();
            if (newSession) {
              // Session refreshed successfully
              console.log('Session refreshed with new admin privileges');
            }
          } catch (refreshError) {
            console.log('Session refresh failed, but admin creation succeeded');
          }
        }
        
        // Redirect to admin panel after short delay
        setTimeout(() => {
          window.location.href = "/admin";
        }, 3000);
      } else {
        toast.error(data.error || `Failed to create admin account (Status: ${response.status})`);
      }
    } catch (error) {
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-[#34D197]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Admin Account Created!</h1>
            <p className="text-muted-foreground mt-2">Redirecting to admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Admin Setup</h1>
            <p className="text-muted-foreground">Set up your first administrator account</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">First Admin Setup</p>
              <p className="text-xs text-muted-foreground">
                Enter the email address of the user you want to promote to administrator. 
                This user must already have an account.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Administrator Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              disabled={loading}
            />
          </div>

          <Button
            onClick={createFirstAdmin}
            disabled={loading || !email.trim()}
            className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background"
          >
            {loading ? "Setting up admin..." : "Create Administrator"}
          </Button>
        </div>

        {/* Link to full admin management */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Already have admin access?
          </p>
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-sm text-foreground hover:underline"
          >
            Go to Admin Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
} 