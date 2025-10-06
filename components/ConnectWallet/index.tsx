"use client";

import {
  TonConnectButton,
  TonConnectUIProvider,
  useTonAddress,
} from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { DepositoButton } from "../FormDeposito";

function WalletButtonInner() {
  const walletAddress = useTonAddress();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (walletAddress) {
      console.log("Carteira conectada:", walletAddress);
      setLoading(true);
      setMessage("");

      // Envia o endereço pro backend
      fetch("/api/protegido/vincular-carteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
        credentials: "include"
      })
        .then(async (response) => {
          if (!response.ok) {
            // Se a resposta não é OK, tenta ler o erro
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setMessage("✅ Carteira vinculada com sucesso!");
          console.log("Carteira salva:", data);
        })
        .catch((error) => {
          console.error("Erro completo:", error);
          setMessage("❌ Erro ao vincular carteira");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [walletAddress]);

  return (
    <div className="flex flex-col items-center gap-2">
      <TonConnectButton />
      
      {loading && (
        <p className="text-sm text-blue-600 font-medium">
          ⏳ Vinculando carteira...
        </p>
      )}
      
      {message && (
        <p className={`text-sm font-medium ${
          message.includes("✅") ? "text-green-600" : "text-red-600"
        }`}>
          {message}
        </p>
      )}

      {walletAddress && !loading && !message && (
        <p className="text-sm text-green-600 font-medium">
          ✅ Conectado: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
      )}
    </div>
  );
}

export default function ConnectWalletButton() {
  return (
    <TonConnectUIProvider 
      manifestUrl="https://gist.githubusercontent.com/flokite/5f72700cfc5ec957dbf1ab31cb3e3258/raw/218b641c012088ef4e9dd7b223186ed35d4a3823/tonconnect-manifest.json"
    >
      <WalletButtonInner />
      <DepositoButton />
    </TonConnectUIProvider>
  );
}