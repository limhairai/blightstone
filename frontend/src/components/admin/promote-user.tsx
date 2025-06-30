"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Shield, User, Mail, Search, UserPlus, AlertTriangle } from "lucide-react";

export function PromoteUser() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  const checkUserExists = async () => {
    toast.info("User checking temporarily disabled. Just enter the email and click promote.")
  };

  const createProfile = async () => {
    toast.info("Profile creation is handled automatically during promotion.")
  };

  const promoteToAdmin = async () => {
    if (!session?.access_token) {
      toast.error("You must be logged in to promote a user")
      return;
    }

    if (!email) {
      toast.error("Please enter an email address")
      return;
    }

    setLoading(true);

    try {
      // 🚨 SECURITY: Removed dangerous console log - console.log("🚀 Starting promotion process for:", ...;
      
      // Use the unified promotion endpoint
      const response = await fetch("/api/auth/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User ${email} has been promoted to admin. Please refresh the page.`)
        
        // Refresh the page after a short delay to update the admin status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error("❌ Promotion failed:", data);
        toast.error(data.error || `Failed to promote user (Status: ${response.status})`)
      }
    } catch (error) {
      console.error("💥 Error promoting user:", error);
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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