"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { toast } from "../ui/use-toast";
import { Shield, User, Mail, Search, UserPlus } from "lucide-react";

export function PromoteUser() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  const checkUserExists = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(`/api/proxy/auth/check-user-profile?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "User Found!",
          description: `User ${email} exists in profiles table. Role: ${data.role}, Admin: ${data.is_superuser}`,
          variant: "default",
        });
      } else {
        toast({
          title: "User Not Found",
          description: `User ${email} not found in profiles table. Status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error checking user:", error);
      toast({
        title: "Error",
        description: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const createProfile = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/proxy/auth/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log("👤 Create profile response:", { status: response.status, data });

      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message || "Profile created successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.detail || `Failed to create profile (Status: ${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error creating profile:", error);
      toast({
        title: "Error",
        description: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const promoteToAdmin = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "You must be logged in to promote a user",
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Error", 
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 🚨 SECURITY: Removed dangerous console log - console.log("🚀 Starting promotion process for:", ...;
      
      // First try the bootstrap endpoint (for first admin)
      console.log("📡 Trying bootstrap endpoint...");
      let response = await fetch("/api/proxy/auth/bootstrap-first-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      let data = await response.json();
      console.log("📡 Bootstrap response:", { status: response.status, data });

      // If bootstrap fails because admins already exist, try regular promotion
      if (!response.ok && data.detail?.includes("superusers already exist")) {
        console.log("📡 Bootstrap failed (admins exist), trying regular promotion...");
        response = await fetch("/api/proxy/auth/promote-superuser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: email,
          }),
        });

        data = await response.json();
        console.log("📡 Promotion response:", { status: response.status, data });
      }

      if (response.ok) {
        console.log("✅ Promotion successful!");
        toast({
          title: "Success!",
          description: `User ${email} has been promoted to admin. Please refresh the page.`,
          variant: "default",
        });
        
        // Refresh the page after a short delay to update the admin status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error("❌ Promotion failed:", data);
        toast({
          title: "Error",
          description: data.detail || `Failed to promote user (Status: ${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error promoting user:", error);
      toast({
        title: "Error",
        description: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#c4b5fd]" />
          Promote User to Admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-user">Current User</Label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user?.email || "Not logged in"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email to Promote</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={checkUserExists}
            disabled={checking || !email}
            variant="outline"
            className="w-full"
          >
            {checking ? (
              "Checking..."
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Check if User Exists
              </>
            )}
          </Button>

          <Button
            onClick={createProfile}
            disabled={creating || !session?.access_token}
            variant="outline"
            className="w-full"
          >
            {creating ? (
              "Creating..."
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create My Profile
              </>
            )}
          </Button>

          <Button
            onClick={promoteToAdmin}
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
          >
            {loading ? "Promoting..." : "Promote to Admin"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>⚠️ This is for development purposes only.</p>
          <p><strong>Step-by-step process:</strong></p>
          <p>1. Check if User Exists - Debug if you're in profiles table</p>
          <p>2. Create My Profile - If user doesn't exist, create it first</p>
          <p>3. Promote to Admin - Make yourself admin</p>
          <p>• First admin: Will be created automatically if no admins exist</p>
          <p>• Additional admins: Requires existing admin privileges</p>
        </div>
      </CardContent>
    </Card>
  );
} 