import { WalletContractV4, internal, TonClient, Address } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { beginCell } from "@ton/core";

export class TonSender {
  private wallet: WalletContractV4 | null = null;
  private keyPair: any = null;
  private tonClient: TonClient;

  constructor() {
    this.tonClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRpc',
      // apiKey: process.env.TONCENTER_API_KEY // Descomente se tiver API key
    });
  }

  // Inicializa com sua mnemonic
  async initialize(mnemonic: string[]) {
    try {
      this.keyPair = await mnemonicToWalletKey(mnemonic);
      this.wallet = WalletContractV4.create({ 
        workchain: 0, 
        publicKey: this.keyPair.publicKey 
      });
      
      console.log('✅ TonSender inicializado com sucesso');
      console.log('📧 Endereço da wallet:', this.getAddress());
    } catch (error) {
      console.error('❌ Erro ao inicializar TonSender:', error);
      throw error;
    }
  }

  // Envia TON para um endereço
  async sendTon(toAddress: string, amount: number, message?: string) {
    try {
      if (!this.wallet || !this.keyPair) {
        throw new Error('TonSender não inicializado. Chame initialize() primeiro.');
      }

      const walletContract = this.tonClient.open(this.wallet);
      const seqno = await walletContract.getSeqno();
      
      // Prepara a mensagem
      const transfer = walletContract.createTransfer({
        seqno,
        secretKey: this.keyPair.secretKey,
        messages: [
          internal({
            to: toAddress,
            value: (amount * 1000000000).toString(), // Converte para nanoTON
            body: message ? beginCell().storeUint(0, 32).storeStringTail(message).endCell() : undefined,
            bounce: false,
          })
        ]
      });

      // Envia a transação
      await walletContract.send(transfer);
      
      console.log('📤 Transação enviada. Seqno:', seqno);

      // Aguarda confirmação (opcional)
      const txHash = await this.waitForTransaction(seqno);

      return {
        success: true,
        hash: txHash || `seqno_${seqno}`,
        seqno: seqno
      };

    } catch (error) {
      console.error('❌ Erro ao enviar TON:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar transação'
      };
    }
  }

  // Aguarda confirmação da transação
  private async waitForTransaction(seqno: number, maxAttempts: number = 10): Promise<string> {
    if (!this.wallet) return `seqno_${seqno}`;

    const walletContract = this.tonClient.open(this.wallet);
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos
      
      const currentSeqno = await walletContract.getSeqno();
      if (currentSeqno > seqno) {
        console.log('✅ Transação confirmada');
        return `confirmed_seqno_${seqno}`;
      }
      
      console.log(`⏳ Aguardando confirmação... (${i + 1}/${maxAttempts})`);
    }
    
    console.log('⚠️ Timeout aguardando confirmação');
    return `timeout_seqno_${seqno}`;
  }

  // Verifica saldo da sua wallet
  async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('TonSender não inicializado');
    }

    const walletContract = this.tonClient.open(this.wallet);
    const balance = await walletContract.getBalance();
    
    // Converte para TON
    return Number(balance) / 1000000000;
  }

  // Obtém endereço da sua wallet
  getAddress(): string {
    if (!this.wallet) {
      throw new Error('TonSender não inicializado');
    }
    
    return this.wallet.address.toString();
  }
}