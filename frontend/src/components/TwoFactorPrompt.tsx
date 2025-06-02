import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TwoFactorPrompt({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/twofa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid code");
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <Card className="p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold mb-2">Two-Factor Authentication Required</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Enter 2FA code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            autoFocus
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black" disabled={loading}>
              Verify
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 