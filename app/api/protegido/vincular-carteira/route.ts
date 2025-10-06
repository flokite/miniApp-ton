import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    // 1. Verifica o token do cookie
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // 2. Decodifica o token
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as number;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário inválido' },
        { status: 401 }
      );
    }

    // 3. Pega os dados do body
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Endereço da carteira é obrigatório' },
        { status: 400 }
      );
    }

    // 4. Atualiza o usuário com a wallet
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wallet: walletAddress
      }
    });

    // 5. Retorna sucesso
    return NextResponse.json({
      success: true,
      message: 'Carteira vinculada com sucesso',
      user: {
        id: updatedUser.id,
        wallet: updatedUser.wallet
      }
    });

  } catch (err) {
    console.error('Erro ao vincular carteira:', err);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: err instanceof Error ? err.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Opcional: Para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}