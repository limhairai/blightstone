import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TwoFactorSetup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch user");
      const user = await res.json();
      setEnabled(user?.twofa?.enabled || false);
    } catch (e: any) {
      setError(e.message || "Error loading 2FA status");
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/twofa/generate-secret", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate secret");
      const data = await res.json();
      setSecret(data.secret);
      setQr(data.qr);
      setUri(data.uri);
      setShowSetup(true);
    } catch (e: any) {
      setError(e.message || "Error generating secret");
    } finally {
      setLoading(false);
    }
  }

  function validateCode(val: string) {
    if (!/^[0-9]{6}$/.test(val)) return "Code must be exactly 6 digits.";
    return "";
  }

  useEffect(() => {
    if (showSetup) setCodeError(validateCode(code));
  }, [code, showSetup]);

  async function enable2fa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setCodeError(validateCode(code));
    if (validateCode(code)) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/twofa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to enable 2FA");
      setSuccess("2FA enabled!");
      setEnabled(true);
      setShowSetup(false);
    } catch (e: any) {
      setError(e.message || "Error enabling 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function disable2fa() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/twofa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to disable 2FA");
      setSuccess("2FA disabled");
      setEnabled(false);
    } catch (e: any) {
      setError(e.message || "Error disabling 2FA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4 bg-white dark:bg-[#18181b] shadow-none">
      <h2 className="text-lg font-bold mb-2">Two-Factor Authentication</h2>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}
      {enabled ? (
        <>
          <div className="mb-2">2FA is <span className="text-green-400 font-semibold">enabled</span> on your account.</div>
          <Button variant="destructive" onClick={disable2fa} disabled={loading}>Disable 2FA</Button>
        </>
      ) : showSetup ? (
        <form onSubmit={enable2fa} className="space-y-4">
          <div>
            <div className="mb-2">Scan this QR code with your authenticator app:</div>
            {qr && <Image src={qr} alt="2FA QR" width={160} height={160} className="mx-auto w-40 h-40" />}
            <div className="mt-2 text-xs break-all">Or enter this code: <span className="font-mono">{secret}</span></div>
          </div>
          <Input
            placeholder="Enter 6-digit code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          {codeError && <div className="text-red-500 text-xs mt-1">{codeError}</div>}
          <Button type="submit" className="w-full" disabled={loading || !!codeError}>Enable 2FA</Button>
        </form>
      ) : (
        <>
          <div className="mb-2">2FA is <span className="text-red-400 font-semibold">not enabled</span> on your account.</div>
          <Button onClick={startSetup} disabled={loading}>Set up 2FA</Button>
        </>
      )}
    </Card>
  );
} 