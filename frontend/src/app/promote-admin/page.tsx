"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PromoteAdminPage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const promoteToAdmin = async () => {
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
        toast.success(`Successfully promoted ${email} to admin`);
        setEmail("");
        
        // Redirect to admin panel after short delay
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        toast.error(data.error || `Failed to promote user (Status: ${response.status})`);
      }
    } catch (error) {
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Bootstrap Admin</h1>
            <p className="text-muted-foreground">Quick setup for first admin access</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            onClick={promoteToAdmin}
            disabled={loading || !email.trim()}
            className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background"
          >
            {loading ? "Promoting..." : "Promote to Admin"}
          </Button>
        </div>

        {/* Link to full admin management */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Already have admin access?
          </p>
          <Link 
            href="/admin/settings" 
            className="inline-flex items-center gap-2 text-sm text-foreground hover:underline"
          >
            Manage Admin Team
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
} 