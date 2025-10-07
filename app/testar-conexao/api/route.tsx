import { NextResponse } from 'next/server';
// ⚠️ CORREÇÃO: WalletContractV4 é importado de '@ton/ton'
import { TonClient, WalletContractV4 } from '@ton/ton'; 
import { mnemonicToWalletKey } from '@ton/crypto';
import { Address } from '@ton/core'; // Usamos o Address de @ton/core

export const dynamic = 'force-dynamic'; // Garante que a rota é dinâmica

export async function GET() {
    const mnemonic = process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
        return NextResponse.json(
            { error: "Erro: Variável MNEMONIC ausente. Verifique seu arquivo .env" },
            { status: 500 }
        );
    }

    // Cria o cliente para a Testnet
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        //apiKey: process.env.TONCENTER_API_KEY || ''
    });

    try {
        // 1. Gerar a Chave Pública e o Contrato da Carteira
        const key = await mnemonicToWalletKey(mnemonic.split(' '));
        
        // Criamos a instância do Contrato V4
        const walletContract = WalletContractV4.create({ 
            publicKey: key.publicKey, 
            workchain: 0 
        });

        // Abrir o contrato (necessário para ler o estado)
        const wallet = client.open(walletContract);
        
        // Obter o endereço para exibição, no formato de Testnet
        const walletAddress = wallet.address.toString({ testOnly: true, bounceable: false });

        // 2. Obter o Saldo
        const balanceNano = await wallet.getBalance();
        const balanceTON = Number(balanceNano) / 10**9;
        
        // 3. Retornar sucesso
        return NextResponse.json({
            success: true,
            address: walletAddress,
            balance: balanceTON.toFixed(4) // Retorna o saldo formatado
        });

    } catch (e) {
        console.error("Erro ao obter saldo da TON Testnet:", e);
        return NextResponse.json(
            { error: "Falha ao conectar ou obter saldo da Testnet." },
            { status: 500 }
        );
    }
}