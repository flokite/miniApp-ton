// app/testar-conexão/page.tsx
'use client'; // Deve ser Client Component para usar useState e useEffect

import React, { useState, useEffect } from 'react';

// Define o formato dos dados que esperamos da nossa API Route
interface BalanceData {
  success: boolean;
  address: string;
  balance: string;
}

export default function ConexaoTestPage() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Função assíncrona para chamar a API Route
    const fetchBalance = async () => {
      try {
        // Chamada para a nossa API Route: app/testar-conexão/route.ts
        const response = await fetch('/testar-conexao/api');
        const result = await response.json();
        
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Falha ao buscar dados.');
        }

        setData(result);
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('Erro desconhecido ao carregar o saldo.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []); // Executa apenas na montagem do componente

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste de Conexão TON Testnet</h1>
      <p>Tentando obter o saldo da carteira com base na variável **MNEMONIC** do servidor.</p>
      
      <hr style={{ margin: '20px 0' }} />

      {loading && (
        <p style={{ color: '#0098EA', fontSize: '1.2em' }}>
          ⏳ Conectando e buscando saldo...
        </p>
      )}

      {error && (
        <div style={{ color: 'red', border: '1px solid red', padding: '15px', borderRadius: '5px' }}>
          <h2>❌ Erro de Conexão</h2>
          <p>Não foi possível obter o saldo. Verifique se o seu `.env` está correto e se o serviço TON está ativo.</p>
          <p>Detalhes: <strong>{error}</strong></p>
        </div>
      )}

      {data && !loading && !error && (
        <div style={{ border: '2px solid #0098EA', padding: '20px', borderRadius: '10px' }}>
          <h2>✅ Conexão Bem-Sucedida!</h2>
          <p><strong>Endereço da Carteira (Testnet):</strong> 
            <code style={{ display: 'block', padding: '5px', background: '#f0f0f0', marginTop: '5px', wordBreak: 'break-all', color: 'black' }}>
                {data.address}
            </code>
          </p>
          <h3 style={{ fontSize: '2.5em', margin: '20px 0', color: '#0098EA' }}>
            {data.balance} tTON
          </h3>
          <p style={{ color: 'green' }}>O saldo acima foi lido diretamente da Testnet.</p>
        </div>
      )}
    </div>
  );
}