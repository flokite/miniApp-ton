// services/createWallet.ts
import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

export async function createNewWallet() {
  try {
    // 1. Gera 24 palavras novas
    const mnemonic = await mnemonicNew(24);
    
    // 2. Converte para chaves
    const key = await mnemonicToWalletKey(mnemonic);
    
    // 3. Cria a wallet V4 (mais moderna)
    const wallet = WalletContractV4.create({ 
      publicKey: key.publicKey, 
      workchain: 0 
    });
    
    const address = wallet.address.toString();
    
    console.log('🎉 NOVA WALLET CRIADA:');
    console.log('📝 Mnemonic (24 palavras):', mnemonic.join(' '));
    console.log('📧 Endereço:', address);
    console.log('🔑 Chave pública:', key.publicKey.toString('hex'));
    
    return {
      mnemonic: mnemonic,
      address: address,
      publicKey: key.publicKey,
      privateKey: key.secretKey
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar wallet:', error);
    throw error;
  }
}

// Uso
createNewWallet().then(wallet => {
  console.log('✅ Wallet criada com sucesso!');
});