"use client";

import { useTonAddress } from "@tonconnect/ui-react";
import { useState } from "react";

export function SaqueButton() {
  const walletAddress = useTonAddress();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaque = async () => {
    if (!walletAddress) {
      setMessage("❌ Conecte sua carteira primeiro");
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setMessage("❌ Insira um valor válido");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/protegido/sacar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount)
        }),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Saque de ${amount} TON realizado com sucesso!`);
        setAmount("");
        
        // Log adicional
        console.log("Transação:", data.transactionHash);
        console.log("Novo saldo:", data.saque.newBalance);
      } else {
        throw new Error(data.error || "Erro ao processar saque");
      }

    } catch (error) {
      console.error("Erro no saque:", error);
      setMessage("❌ Erro: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-center">Sacar TON</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de TON para sacar
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 1.5"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleSaque}
        disabled={loading || !walletAddress}
        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Processando..." : "Sacar TON"}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${
          message.includes("✅") ? "text-green-600" : "text-red-600"
        }`}>
          {message}
        </p>
      )}

      {!walletAddress && (
        <p className="mt-2 text-sm text-orange-600">
          ⚠️ Conecte sua carteira para sacar
        </p>
      )}
    </div>
  );
}