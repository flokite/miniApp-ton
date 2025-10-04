// lib/auth.ts
import { validate, parse, isValid } from '@telegram-apps/init-data-node';
import jwt from 'jsonwebtoken';

const BOT_TOKEN = process.env.BOT_TOKEN!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function verifyTelegramInitData(initDataRaw: string) {
  // Essa validação vai lançar erro se algo estiver errado
  validate(initDataRaw, BOT_TOKEN);
  const data = parse(initDataRaw);

  // Opcional: se quiser, também checar se auth_date não é muito antigo etc.
  
  return data;  // objeto contendo user, auth_date, etc
}

export function issueJwt(userData: { id: number; telegramId:number; username?: string; first_name: string; last_name?: string; }) {
  const payload = {
    id: userData.id,
    telegramId: userData.telegramId,
    username: userData.username,
    firstName: userData.first_name,
    lastName: userData.last_name,
  };
  // configurações de expiração conforme seu app
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  return token;
}
