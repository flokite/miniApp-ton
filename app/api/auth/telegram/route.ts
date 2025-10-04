// app/api/auth/telegram/route.ts
import { NextResponse } from 'next/server';
import { verifyTelegramInitData, issueJwt } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json(); // Aqui pega o body corretamente
    const { initData } = body;

    if (!initData || typeof initData !== 'string') {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const init = await verifyTelegramInitData(initData);

    if (!init.user) {
      return NextResponse.json({ error: 'Usuário não encontrado no initData' }, { status: 400 });
    }

    const { id, username, first_name, last_name } = init.user;

    // Verifica no banco se já existe
    let user = await prisma.user.findUnique({ where: { telegramId: id } });

    // Se não existir, cria
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: id,
          username,
          first_name,
          last_name,
        },
      });
    }

    // Gera o JWT
    const token = issueJwt({
      id: user.telegramId,
      username: user.username ?? undefined,
      first_name: user.first_name,
      last_name: user.last_name ?? undefined,
    });

    // Retorna o cookie httpOnly
    const response = NextResponse.json({ success: true, user });
    response.cookies.set('token', token, {
      httpOnly: true,
      //secure: true,
      path: '/',
      maxAge: 3600,
    });

    return response;
  } catch (err: any) {
    console.error('Telegram auth error:', err);
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }
}
