// components/CreateWallet.tsx
'use client';

import { useState } from 'react';

interface WalletData {
  mnemonic: string[];
  address: string;
  publicKey: string;
}

export default function CreateWallet() {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState('');

  const createWallet = async () => {
    setLoading(true);
    setError('');
    setWallet(null);

    try {
      const response = await fetch('/criar-wallet/api');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar wallet');
      }

      setWallet(data.wallet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🛠 Criar Nova Wallet TON</h1>
      <p>Crie uma nova wallet programaticamente para usar no seu app</p>

      <button
        onClick={createWallet}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Criando...' : '🛠 Criar Nova Wallet'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '15px', padding: '10px', background: '#ffe6e6' }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {wallet && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f0f8ff', border: '2px solid #0070f3', borderRadius: '8px' }}>
          <h3>✅ Wallet Criada com Sucesso!</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>📧 Endereço:</strong>
            <div style={{ padding: '8px', background: 'white', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {wallet.address}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>📝 Mnemonic (24 palavras):</strong>
            <div style={{ padding: '12px', background: '#fffacd', borderRadius: '4px', border: '1px solid #ffd700' }}>
              <strong style={{ color: 'red' }}>⚠️ GUARDE EM LOCAL SEGURO!</strong>
              <div style={{ marginTop: '8px', fontFamily: 'monospace', lineHeight: '1.5' }}>
                {wallet.mnemonic.join(' ')}
              </div>
            </div>
          </div>

          <div style={{ background: '#e6ffe6', padding: '10px', borderRadius: '4px' }}>
            <h4>📋 Próximos Passos:</h4>
            <ol>
              <li><strong>Copie as 24 palavras</strong> e cole no .env como WALLET_MNEMONIC</li>
              <li><strong>Envie TON</strong> para o endereço acima para ativar a wallet</li>
              <li><strong>Reinicie o servidor</strong> e teste as transferências</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}