import { prisma } from "../../lib/prisma";

import { cookies } from "next/headers";

export default async function home ()
{
    const cookieStore = cookies();
    const token = (await cookieStore).get('token')?.value ?? 'Não encontrado';
    
    const pessoa = await prisma.user.findFirst();
    const qnt = await prisma.user.count();


    return (
        <div>
            <li>Id: { pessoa?.id }</li>
            <li>Telegram ID: { pessoa?.telegramId }</li>
            <li>Usuario: { pessoa?.username }</li>
            <li>Nome: { pessoa?.first_name }</li>
            <li>Sobrenome: { pessoa?.last_name }</li>
            <li>Quantidade de cadastros: { qnt }</li>
            <li>Token JWT: {token}</li>
        </div>
    );
}