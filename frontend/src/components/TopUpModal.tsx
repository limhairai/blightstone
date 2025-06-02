import React, { useState } from "react";

const FEE_PERCENT = 0.03;

export default function TopUpModal() {
  const [amount, setAmount] = useState(100);
  const fee = +(amount * FEE_PERCENT).toFixed(2);
  const net = +(amount - fee).toFixed(2);

  return (
    <div className="p-6 bg-white rounded shadow w-96">
      <h2 className="text-lg font-bold mb-4">Top Up Balance</h2>
      <label className="block mb-2">Enter amount to top up:</label>
      <input
        type="number"
        value={amount}
        min={1}
        onChange={e => setAmount(Number(e.target.value))}
        className="border rounded px-2 py-1 w-full mb-4"
      />
      <div className="mb-4">
        <p>You will be charged: <b>${amount.toFixed(2)}</b></p>
        <p>Platform fee (3%): <b>-${fee.toFixed(2)}</b></p>
        <p>Amount credited: <b>${net.toFixed(2)}</b></p>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Pay Now</button>
    </div>
  );
} 