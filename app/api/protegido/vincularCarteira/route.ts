// pages/api/protegido/depositar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // lê do cookie
    const token = req.cookies["token"];
    if (!token) return res.status(401).json({ error: "Token não encontrado" });

    // valida e decodifica
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as number;
    if (!userId) return res.status(401).json({ error: "Usuário inválido" });

    const { amount, walletAddress, boc } = req.body;

    const deposit = await prisma.deposito.create({
      data: {
        userId,
        wallet: walletAddress,
        amount,
        txHash: boc,
        status: "pending",
      },
    });

    return res.status(200).json(deposit);
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
