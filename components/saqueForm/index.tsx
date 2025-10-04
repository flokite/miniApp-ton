"use client";

import { useState } from "react";

export function SaqueForm({ userId }: { userId: number }) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSaque = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/saque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });
      const data = await resp.json();
      if (data.ok) alert("Saque criado! Transação pronta para broadcast.");
      else alert("Erro: " + data.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Valor em TON"
      />
      <button onClick={handleSaque} disabled={loading || amount <= 0}>
        {loading ? "Processando..." : "Solicitar Saque"}
      </button>
    </div>
  );
}
