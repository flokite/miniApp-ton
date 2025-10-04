import { prisma } from "../../lib/prisma";

export default async function home ()
{
    const pessoas = await prisma.pessoa.findMany();

    return (
        <main>
            {pessoas.map((pessoa) => (
                <li key={pessoa.id}>
                    {pessoa.email}
                </li>
            ))}
        </main>
    );

}