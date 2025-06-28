// Dynamic imports for server-only modules to avoid build issues

export async function getBcryptJs() {
  if (typeof window !== 'undefined') {
    throw new Error('bcryptjs can only be used on the server side');
  }
  const bcrypt = await import('bcryptjs');
  return bcrypt.default;
}

export async function getJose() {
  if (typeof window !== 'undefined') {
    throw new Error('jose can only be used on the server side');
  }
  const jose = await import('jose');
  return jose;
}

export async function getPg() {
  if (typeof window !== 'undefined') {
    throw new Error('pg can only be used on the server side');
  }
  const pg = await import('pg');
  return pg;
}