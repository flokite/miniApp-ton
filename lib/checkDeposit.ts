import { TonClient, Address } from "@ton/ton";
import { Cell, CurrencyCollection } from "@ton/core";
import { prisma } from "@/lib/prisma";

// Cliente para Testnet
const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

// Timeout para considerar depósito como falhado (ms)
const DEPOSIT_TIMEOUT = 1000 * 60 * 60 * 2; // 2 horas

export async function checkPendingDeposits() {
  const pendingDeposits = await prisma.deposito.findMany({
    where: { status: "pending" },
  });

  const now = Date.now();

  for (const deposit of pendingDeposits) {
    if (!deposit.txHash) continue;

    try {
      // Converte BOC → hash
      const hashHex = Cell.fromBase64(deposit.txHash).hash().toString("hex");

      // Busca últimas 20 transações do endereço do usuário
      const txs = await client.getTransactions(Address.parse(deposit.wallet), { limit: 20 });

      // Procura transação pelo hash
      const found = txs.find((tx) => tx.hash().toString("hex") === hashHex);

      if (found) {
        // Pega a primeira mensagem interna (internal message)
        const message =
          found.inMessage ||
          (found.outMessages.size > 0 ? Array.from(found.outMessages.values())[0] : undefined);

        if (!message) continue;

        // Só processa se for mensagem interna
        if (message.info.type === "internal") {
          const valueCC: CurrencyCollection = message.info.value;
          const receivedAmount = valueCC.coins; // valor em nanoTON
          const expectedAmount = BigInt(deposit.amount * 1e9);

          if (receivedAmount === expectedAmount) {
            // Depósito confirmado
            await prisma.deposito.update({
              where: { id: deposit.id },
              data: { status: "completed" },
            });
          } else {
            // Valor não bate → falhou
            await prisma.deposito.update({
              where: { id: deposit.id },
              data: { status: "failed" },
            });
          }
        }
      } else {
        // Transação não encontrada → verifica timeout
        const depositAge = now - deposit.createdAt.getTime();
        if (depositAge > DEPOSIT_TIMEOUT) {
          await prisma.deposito.update({
            where: { id: deposit.id },
            data: { status: "failed" },
          });
        }
      }
    } catch (err) {
      console.error(`Erro ao processar depósito ${deposit.id}:`, err);
      // Opcional: adicionar retry count ou lógica de alert
    }
  }
}
