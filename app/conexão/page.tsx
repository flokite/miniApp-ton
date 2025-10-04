"use client";

import { useEffect, useState } from "react";
import {
  TonConnectButton,
  TonConnectUIProvider,
  useTonAddress,
  useTonConnectUI
} from "@tonconnect/ui-react";

export default function WalletConnect() {
  const [amount, setAmount] = useState<number>(0);

  // hook para pegar o endereço conectado
  const walletAddress = useTonAddress();

  // hook para interagir com a carteira (enviar transações)
  const [tonConnectUI] = useTonConnectUI();

  // persistência local (opcional)
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem("walletAddress", walletAddress);
      // envia pro backend pra registrar/atualizar a carteira do usuário
      fetch("/api/connectWallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
    }
  }, [walletAddress]);

  const createDeposit = async () => {
    if (!walletAddress || amount <= 0) return;

    // cria a transação para o endereço definido no .env
    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: process.env.NEXT_PUBLIC_TON_RECEIVE_ADDRESS!,
          amount: (amount * 1e9).toString(), // TON -> nanotons
        },
      ],
    };

    try {
      // dispara a transação na carteira do usuário
      const result = await tonConnectUI.sendTransaction(tx);

      // salva como pending no backend
      await fetch("/api/protegido/depositar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount,
          txHash: result.boc, // a carteira retorna um BOC (base64 tx body)
        }),
      });

      alert("Depósito criado! Aguarde confirmação.");
    } catch (err) {
      console.error("Erro ao criar depósito:", err);
      alert("Erro ao enviar a transação.");
    }
  };

  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <TonConnectButton />
      {walletAddress && (
        <div>
          <p>Conectado: {walletAddress}</p>
          <input
            type="number"
            placeholder="Valor em TON"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <button onClick={createDeposit}>Depositar</button>
        </div>
      )}
    </TonConnectUIProvider>
  );
}
