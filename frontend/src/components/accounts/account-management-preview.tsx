"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"

// Define accounts outside the component so it's a stable reference
const accountsData = [
      { id: 1, name: "Client-Account-01", status: "active", balance: 12450, spend: 8920 },
  { id: 2, name: "Client-Account-02", status: "active", balance: 8920, spend: 5680 },
  { id: 3, name: "Client-Account-03", status: "warning", balance: 2450, spend: 1200 },
  { id: 4, name: "Client-Account-04", status: "active", balance: 15750, spend: 12300 },
];

export function AccountManagementPreview() {
  const [selectedAccount, setSelectedAccount] = useState(0); // Index for accountsData
  const [animatedBalance, setAnimatedBalance] = useState(accountsData[0].balance); // Initial balance

  useEffect(() => {
    // Ensure selectedAccount is a valid index
    if (selectedAccount < 0 || selectedAccount >= accountsData.length) {
        if (accountsData.length > 0) setSelectedAccount(0); // Reset to first if possible
        return; 
    }
    const targetBalance = accountsData[selectedAccount].balance;
    const currentAnimatedBalance = animatedBalance; // Capture current animated balance for the animation cycle
    const diff = targetBalance - currentAnimatedBalance;
    
    if (diff === 0) return; // No change needed

    const duration = 700; // Animation duration in ms
    const steps = 30;     // Number of steps in the animation
    const increment = diff / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextBalance = currentAnimatedBalance + (increment * currentStep);
      
      if (currentStep >= steps) {
        setAnimatedBalance(targetBalance);
        clearInterval(timer);
      } else {
        setAnimatedBalance(Math.round(nextBalance));
      }
    }, duration / steps);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, accountsData]); // animatedBalance is intentionally omitted because this effect should only re-run
                                     // and re-calculate the animation parameters when selectedAccount changes.
                                     // The animation itself uses the animatedBalance from the moment selectedAccount changed.
                                     // accountsData is added as it's used to derive targetBalance.

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-400";
      case "warning": return "bg-yellow-400";
      case "error": return "bg-red-400";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black w-full max-w-4xl">
      <div className="absolute inset-0 bg-muted"></div>
      <div className="relative z-10 p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-white">Account Management</h3>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div><span className="text-sm text-white/60">Live</span></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {accountsData.map((account, index) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(index)}
              className={`p-5 rounded-lg border transition-all duration-200 text-left ${
                selectedAccount === index ? "border-[#b4a0ff] bg-[#b4a0ff]/10" : "border-white/10 bg-black/50 hover:bg-[#3a3a3a]" 
              }`}
            >
              <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`}></div><span className="text-white text-base font-medium truncate">{account.name}</span></div>
              <div className="text-white/60 text-xs">${account.balance.toLocaleString()}</div>
            </button>
          ))}
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-black/50 rounded-lg p-6">
              <div className="text-sm text-white/70 mb-2">Current Balance</div>
              <div className="text-3xl font-bold text-white">${animatedBalance.toLocaleString()}</div>
            </div>
            <div className="bg-black/50 rounded-lg p-6">
              <div className="text-sm text-white/70 mb-2">Total Spend</div>
              <div className="text-3xl font-bold text-green-400">${accountsData[selectedAccount]?.spend.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <Button size="default" className="flex-1 bg-primary text-black hover:opacity-90">Top Up</Button>
            <Button size="default" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">View Details</Button>
          </div>
        </div>
      </div>
    </div>
  );
} 