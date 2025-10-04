// pages/api/createDeposit.ts
import { prisma } from "../../../../lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress, amount, txHash } = req.body;

  const user = await prisma.user.findUnique({ where: { wallet: walletAddress } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  await prisma.deposito.create({
    data: {
      userId: user.id,
      wallet: walletAddress,
      amount,
      txHash,
      status: "pending",
    },
  });

  res.status(200).json({ ok: true });
  
}
