/* import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

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

    // 2. Pega dados do depósito
    const { amount, walletAddress, boc } = await request.json();

    if (!amount || !walletAddress || !boc) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // 3. Salva o depósito no banco
    const deposito = await prisma.deposito.create({
      data: {
        userId: userId,
        wallet: walletAddress,
        amount: parseFloat(amount),
        txHash: boc, // ou extrair o hash real da BOC
        status: 'pending',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Depósito registrado',
      deposito: {
        id: deposito.id,
        amount: deposito.amount,
        status: deposito.status
      }
    });

  } catch (err) {
    console.error('Erro no depósito:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

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

    // 2. Pega dados do depósito
    const { amount, walletAddress, boc } = await request.json();

    if (!amount || !walletAddress || !boc) {
      return NextResponse.json(
        { error: 'Dados incompletos: amount, walletAddress e boc são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 4. Cria o registro de depósito com status "pending"
    const deposito = await prisma.deposito.create({
      data: {
        userId: userId,
        wallet: walletAddress,
        amount: parseFloat(amount),
        txHash: boc, // Guarda o BOC para verificação futura
        status: 'pending', // Será atualizado pelo worker de verificação
      }
    });

    // 5. Retorna sucesso
    return NextResponse.json({
      success: true,
      message: 'Depósito registrado com sucesso. Aguardando confirmação na blockchain.',
      deposito: {
        id: deposito.id,
        amount: deposito.amount,
        wallet: deposito.wallet,
        status: deposito.status,
        createdAt: deposito.createdAt
      }
    });

  } catch (err) {
    console.error('Erro ao criar depósito:', err);
    
    // Erro específico do Prisma
    if (err instanceof Error && err.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: err instanceof Error ? err.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}