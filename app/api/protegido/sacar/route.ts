import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, amount } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (!user.wallet) return res.status(400).json({ error: "Usuário não tem carteira cadastrada" });
    if (user.saldo < amount) return res.status(400).json({ error: "Saldo insuficiente" });

    // Cria saque pendente e decrementa saldo
    const saque = await prisma.saque.create({
      data: { userId, amount, status: "pending" },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { saldo: { decrement: amount } },
    });

    // TonClient + Wallet V4
    const client = new TonClient({ endpoint: process.env.TON_RPC_URL! });
    const mnemonicArray = process.env.WALLET_MNEMONICS!.split(" "); // ⚠️ array
    const keyPair = await mnemonicToPrivateKey(mnemonicArray);

    const walletContract = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(walletContract);

    const seqno = await contract.getSeqno();

    // Cria transferência interna
    const transferCell = await contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [internal({
        value: String(amount),
        to: user.wallet,
        body: "Saque dev/testnet",
      })]
    });

    const bocBase64 = transferCell.toBoc().toString("base64");

    // Atualiza saque com BOC e status broadcasted
    await prisma.saque.update({
      where: { id: saque.id },
      data: { txHash: bocBase64, status: "broadcasted" },
    });

    res.status(200).json({ ok: true, boc: bocBase64, saqueId: saque.id });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
}
