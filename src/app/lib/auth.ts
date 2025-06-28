import { query, queryOne } from './database';

export interface User {
  id: number;
  username: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// JWT secret key
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const crypto = await import('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const crypto = await import('crypto');
    const [salt, hash] = hashedPassword.split(':');
    const hashToCompare = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === hashToCompare;
  }

  static async generateToken(user: User): Promise<string> {
    const { SignJWT } = await import('jose');
    const jwt = await new SignJWT({ 
      userId: user.id, 
      username: user.username 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    
    return jwt;
  }

  static async verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        userId: payload.userId as number,
        username: payload.username as string,
      };
    } catch (error) {
      return null;
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    const user = await queryOne<User>(
      'SELECT id, username, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return user;
  }

  static async getUserByUsername(username: string): Promise<User & { password_hash: string } | null> {
    const user = await queryOne<User & { password_hash: string }>(
      'SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = $1',
      [username]
    );
    return user;
  }

  static async login(username: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid username or password' };
      }

      const token = await this.generateToken(user);
      
      // Remove password_hash from user object
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  static async createUser(username: string, password: string): Promise<AuthResult> {
    try {
      const existingUser = await this.getUserByUsername(username);
      
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      const passwordHash = await this.hashPassword(password);
      
      const users = await query<User>(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at, updated_at',
        [username, passwordHash]
      );

      const newUser = users[0];
      const token = await this.generateToken(newUser);

      return {
        success: true,
        user: newUser,
        token,
      };
    } catch (error) {
      console.error('User creation error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }
}