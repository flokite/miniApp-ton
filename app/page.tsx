'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { retrieveLaunchParams } from '@tma.js/sdk';

export default function HomePage() {
console.log('teste');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function login() {
      try {
        // Pega o initData do Telegram
        const { initDataRaw } = retrieveLaunchParams();

        if (!initDataRaw) {
          setError('Não foi possível obter initData do Telegram.');
          setLoading(false);
          return;
        }

        // Envia para o backend
        const resp = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: initDataRaw }),
        });

        const json = await resp.json();

        if (json.success) {
          // Redireciona para a página protegida
          router.push('/home'); // substitua por sua rota protegida
        } else {
          setError(json.error || 'Erro ao autenticar');
        }
      } catch (err) {
        console.error(err);
        setError('Erro inesperado ao autenticar');
      } finally {
        setLoading(false);
      }
    }

    login();
  }, [router]);

  if (loading) {
    return <div>Autenticando com Telegram...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return null; // não precisa renderizar nada se redirecionou
}
