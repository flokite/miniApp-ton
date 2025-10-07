// app/api/create-wallet/route.ts
import { NextResponse } from 'next/server';
import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

export async function GET() {
  try {
    console.log('🛠 Criando nova wallet...');
    
    // Gera nova wallet
    const mnemonic = await mnemonicNew(24);
    const key = await mnemonicToWalletKey(mnemonic);
    const wallet = WalletContractV4.create({ 
      publicKey: key.publicKey, 
      workchain: 0 
    });
    
    const address = wallet.address.toString();
    
    console.log('✅ Wallet criada:', address);
    
    return NextResponse.json({
      success: true,
      wallet: {
        mnemonic: mnemonic, // ⚠️ Em produção, NÃO retorne a mnemonic!
        address: address,
        publicKey: key.publicKey.toString('hex')
      },
      instructions: {
        step1: 'Guarde as 24 palavras em local seguro',
        step2: `Envie TON para: ${address} para ativar a wallet`,
        step3: 'Use as palavras no WALLET_MNEMONIC do .env'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar wallet:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}