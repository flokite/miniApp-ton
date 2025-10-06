import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { TonSender } from '@/lib/tonSender';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Inicializa o sender
const tonSender = new TonSender();

async function initializeSender() {
  if (!process.env.WALLET_MNEMONIC) {
    throw new Error('WALLET_MNEMONIC não configurada');
  }
  
  const mnemonic = process.env.WALLET_MNEMONIC.split(' ');
  await tonSender.initialize(mnemonic);
}

initializeSender().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    // 1. Verifica autenticação
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as number;
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário inválido' }, { status: 401 });
    }

    // 2. Pega dados do saque
    const { amount } = await request.json();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido para saque' },
        { status: 400 }
      );
    }

    const saqueAmount = parseFloat(amount);

    // 3. Busca usuário com saldo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, wallet: true, saldo: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.wallet) {
      return NextResponse.json(
        { error: 'Carteira não vinculada' },
        { status: 400 }
      );
    }

    // 4. Verifica saldo disponível
    if (!user.saldo || user.saldo < saqueAmount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      );
    }

    // 5. Inicia transação no banco
    const saque = await prisma.saque.create({
      data: {
        userId: userId,
        amount: saqueAmount,
        status: 'pending',
      }
    });

    try {
      // 6. ENVIA TON da sua carteira para a carteira do usuário
      const sendResult = await tonSender.sendTon(
        user.wallet, 
        saqueAmount,
        `Saque - User ${userId}`
      );

      if (!sendResult.success) {
        // Atualiza saque como failed
        await prisma.saque.update({
          where: { id: saque.id },
          data: { status: 'failed' }
        });

        return NextResponse.json(
          { error: `Falha ao processar saque: ${sendResult.error}` },
          { status: 500 }
        );
      }

      // 7. Atualiza saldo do usuário e status do saque
      await prisma.$transaction([
        // Diminui saldo do usuário
        prisma.user.update({
          where: { id: userId },
          data: { 
            saldo: { decrement: saqueAmount }
          }
        }),
        // Atualiza saque para completed
        prisma.saque.update({
          where: { id: saque.id },
          data: { 
            status: 'completed',
            txHash: sendResult.hash
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        message: 'Saque realizado com sucesso!',
        transactionHash: sendResult.hash,
        saque: {
          id: saque.id,
          amount: saque.amount,
          status: 'completed',
          newBalance: user.saldo - saqueAmount
        }
      });

    } catch (error) {
      // Em caso de erro na transação TON, marca como failed
      await prisma.saque.update({
        where: { id: saque.id },
        data: { status: 'failed' }
      });

      throw error;
    }

  } catch (err) {
    console.error('Erro no saque:', err);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: err instanceof Error ? err.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}