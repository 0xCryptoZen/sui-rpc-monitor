import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from './auth';

export async function validateServerAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const payload = await AuthService.verifyToken(token);
    if (!payload) {
      redirect('/login');
    }
    return payload;
  } catch (error) {
    console.error('Server auth validation error:', error);
    redirect('/login');
  }
}

export async function getServerUser() {
  try {
    const payload = await validateServerAuth();
    const user = await AuthService.getUserById(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
}