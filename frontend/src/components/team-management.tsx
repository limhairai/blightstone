import React, { useEffect, useState } from "react";
import { permissions } from "@/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/components/organization-context";

export function TeamManagement({ orgId, currentUserRole }: { orgId: string; currentUserRole: string }) {
  const { organizations } = useOrganization();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteEmailError, setInviteEmailError] = useState("");
  const [inviteRoleError, setInviteRoleError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
    fetchCurrentUser().then((user) => {
      setCurrentUserId(user?.id || null);
    });
    // eslint-disable-next-line
  }, [orgId]);

  async function fetchMembers() {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adhub_token') : null;
      const res = await fetch(`/api/organizations/members?orgId=${orgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message || "Error loading members");
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adhub_token");
      const res = await fetch(`/api/proxy/v1/invites/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setInvites(data);
      else setError(data.detail || "Failed to fetch invites");
    } catch (e) {
      setError("Failed to fetch invites");
    } finally {
      setLoading(false);
    }
  }

  // Email validation helper
  function validateEmail(email: string) {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Role validation helper
  function validateRole(role: string) {
    return ["owner", "admin", "member"].includes(role);
  }

  // Validate on change
  useEffect(() => {
    if (inviteEmail && !validateEmail(inviteEmail)) {
      setInviteEmailError("Please enter a valid email address.");
    } else {
      setInviteEmailError("");
    }
    if (!validateRole(inviteRole)) {
      setInviteRoleError("Please select a valid role.");
    } else {
      setInviteRoleError("");
    }
  }, [inviteEmail, inviteRole]);

  async function handleInvite() {
    // Validate before submit
    if (!validateEmail(inviteEmail)) {
      setInviteEmailError("Please enter a valid email address.");
      return;
    }
    if (!validateRole(inviteRole)) {
      setInviteRoleError("Please select a valid role.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("adhub_token");
      const res = await fetch("/api/proxy/v1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, orgId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Invite sent!");
        setInviteEmail("");
        fetchInvites();
      } else {
        setError(data.detail || "Failed to send invite");
      }
    } catch (e) {
      setError("Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  const removeMember = async (userId: string) => {
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adhub_token') : null;
      const res = await fetch(`/api/organizations/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, orgId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to remove member");
      }
      setSuccess("Member removed");
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Error removing member");
    }
  };

  // Helper to fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    } catch {
      return null;
    }
  };

  // Resend invite
  const resendInvite = async (token: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to resend invite");
      setSuccess("Invite resent");
    } catch (err: any) {
      setError(err.message || "Error resending invite");
    }
  };

  // Cancel invite
  const cancelInvite = async (token: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/invites/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to cancel invite");
      setSuccess("Invite cancelled");
      fetchInvites();
    } catch (err: any) {
      setError(err.message || "Error cancelling invite");
    }
  };

  // Change invite role
  const changeInviteRole = async (token: string, newRole: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/invites/change-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_role: newRole, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to change invite role");
      setSuccess("Invite role updated");
      fetchInvites();
    } catch (err: any) {
      setError(err.message || "Error changing invite role");
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-white dark:bg-[#18181b] shadow-none">
      {/* Invite Form */}
      {permissions[currentUserRole]?.invite && (
        <div className="flex flex-col sm:flex-row gap-2 items-end mb-4 w-full max-w-xl">
          <div className="flex-1 w-full">
            <Input
              type="email"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full"
              aria-invalid={!!inviteEmailError}
            />
            {inviteEmailError && <div className="text-red-500 text-xs mt-1">{inviteEmailError}</div>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">{inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["owner", "admin", "member"].map(role => (
                <DropdownMenuItem key={role} onClick={() => setInviteRole(role)}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleInvite}
            disabled={loading || !inviteEmail || !!inviteEmailError || !!inviteRoleError}
            className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black"
          >
            Invite
          </Button>
        </div>
      )}
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
      {/* Pending Invites */}
      <div>
        <h3 className="font-semibold mb-1">Pending Invites</h3>
        {invites.length === 0 ? (
          <div className="text-muted-foreground text-sm">No pending invites</div>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite, i) => (
              <li key={i} className="flex items-center justify-between bg-white dark:bg-[#18181b] rounded px-3 py-2 gap-2">
                <span>{invite.email} ({invite.role})</span>
                <span className="text-xs text-muted-foreground">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                {permissions[currentUserRole]?.invite && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Change Role</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {["owner", "admin", "member"].map(role => (
                          <DropdownMenuItem key={role} onClick={() => changeInviteRole(invite.token, role)}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" onClick={() => resendInvite(invite.token)}>
                      Resend
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => cancelInvite(invite.token)}>
                      Cancel
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Team Members */}
      <div>
        <h3 className="font-semibold mb-1">Team Members</h3>
        {members.length === 0 ? (
          <div className="text-muted-foreground text-sm">No team members yet.</div>
        ) : (
          <ul className="space-y-2">
            {members.map((member, i) => (
              <li key={i} className="flex items-center justify-between bg-white dark:bg-[#18181b] rounded px-3 py-2 gap-2">
                <span>{member.email} ({member.role})</span>
                {permissions[currentUserRole]?.remove && member.userId !== currentUserId && (
                  <Button variant="destructive" size="sm" onClick={() => removeMember(member.userId)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
} 