"use client";

import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { useState } from "react";

export function DepositoButton() {
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeposito = async () => {
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
      // 1. Prepara a transação
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutos
        messages: [
          {
            address: "UQDruo1aWGYnmBDQ-jsavW-YdPQh5XC7Lty8w7TAyDEyciOE",
            amount: (parseFloat(amount) * 1000000000).toString(), // Converte para nanoTONs
            // payload: "deposito" // Opcional: adicione uma mensagem
          }
        ]
      };

      // 2. Abre a carteira para assinar
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log("Transação assinada:", result);

      // 3. Envia para sua API salvar o depósito
      const response = await fetch("/api/protegido/depositar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletAddress: walletAddress,
          boc: result.boc // Binary payload da transação
        }),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Depósito realizado com sucesso!");
        setAmount(""); // Limpa o campo
      } else {
        throw new Error(data.error || "Erro ao processar depósito");
      }

    } catch (error) {
      console.error("Erro no depósito:", error);
      setMessage("❌ Erro: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Fazer Depósito</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de TON
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
        onClick={handleDeposito}
        disabled={loading || !walletAddress}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Processando..." : "Fazer Depósito"}
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
          ⚠️ Conecte sua carteira para depositar
        </p>
      )}
    </div>
  );
}