import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { usersRepository } from '../users/users.repository.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';
import { sessionsRepository } from './sessions.repository.ts';
import { User, Role } from '../../types/index.ts';
import { env } from '../../config/env.ts';

const TOKEN_EXPIRY_SECONDS = 8 * 60 * 60; // 8 hours

// In-memory failed attempts tracker for brute force mitigation
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

export interface AuthSession {
  token: string;
  user: User;
  expiresIn: string;
}

export interface JwtTokenPayload {
  sub: string;
  instanceId?: string;
  name: string;
  email: string;
  role: Role;
  sessionId: string;
}

class AuthService {
  async login(
    email: string,
    rawPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthSession> {
    const normalizedEmail = email.toLowerCase().trim();
    const rateKey = `${ipAddress || 'unknown'}:${normalizedEmail}`;

    // 1. Check brute force lock
    const attemptRecord = failedAttempts.get(rateKey);
    if (attemptRecord && attemptRecord.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
      throw new Error(`Muitas tentativas incorretas. Tente novamente em ${waitSeconds} segundos.`);
    }

    // 2. Query user with auth hash
    const userWithAuth = await usersRepository.getByEmailWithAuth(normalizedEmail);
    if (!userWithAuth) {
      this.recordFailedAttempt(rateKey);
      throw new Error('Credenciais inválidas.');
    }

    // 3. Verify password hash using strict bcrypt
    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(rawPassword, userWithAuth.passwordHash);
    } catch {
      passwordMatches = false;
    }

    // Proibição estrita: NUNCA usar senhas master ou universais
    if (!passwordMatches) {
      this.recordFailedAttempt(rateKey);
      throw new Error('Credenciais inválidas.');
    }

    // Reset failed attempts on success
    failedAttempts.delete(rateKey);

    const user: User = {
      id: userWithAuth.id,
      instanceId: userWithAuth.instanceId,
      name: userWithAuth.name,
      email: userWithAuth.email,
      role: userWithAuth.role,
      avatar: userWithAuth.avatar,
      department: userWithAuth.department,
      status: userWithAuth.status
    };

    // 4. Generate unique session ID & token
    const sessionId = `ses_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000);

    const tokenPayload: JwtTokenPayload = {
      sub: user.id,
      instanceId: user.instanceId,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY_SECONDS
    });

    // 5. Persist session in sessions repository
    await sessionsRepository.createSession({
      id: sessionId,
      userId: user.id,
      instanceId: user.instanceId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
      createdAt: new Date()
    });

    // 6. Audit login event
    await auditoriaService.logEvent({
      instanceId: user.instanceId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.id,
      details: `Login efetuado com sucesso via Web CRM (${user.email}). Sessão: ${sessionId}`,
      ipAddress,
      userAgent
    });

    return {
      token,
      user,
      expiresIn: '8h'
    };
  }

  async verifyToken(token: string): Promise<JwtTokenPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;

      // Validate session persistence & revocation
      const session = await sessionsRepository.findValidSession(token);
      if (!session) {
        throw new Error('Sessão expirada ou revogada pelo servidor.');
      }

      return decoded;
    } catch (err: any) {
      throw new Error(err.message || 'Token de autenticação inválido ou expirado.');
    }
  }

  async logout(token: string, user?: User, ipAddress?: string, userAgent?: string): Promise<void> {
    await sessionsRepository.revokeSession(token);

    if (user) {
      await auditoriaService.logEvent({
        instanceId: user.instanceId,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'AUTH_LOGOUT',
        entityType: 'AUTH',
        entityId: user.id,
        details: `Sessão encerrada com sucesso e token revogado (${user.email})`,
        ipAddress,
        userAgent
      });
    }
  }

  private recordFailedAttempt(key: string) {
    const current = failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lock
      console.warn(`[AuthService] Limite de tentativas excedido para ${key}. Bloqueado por 5 minutos.`);
    }
    failedAttempts.set(key, current);
  }
}

export const authService = new AuthService();
