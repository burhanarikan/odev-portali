import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../utils/validators';
import { createError } from '../middleware/errorHandler';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw createError('Email already registered', 409);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      }
    });

    if (data.role === 'STUDENT') {
      const classId = data.classId ?? (await prisma.class.findFirst())?.id;
      if (classId) {
        await prisma.student.create({
          data: { userId: user.id, classId },
        });
      }
    } else if (data.role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
        }
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          include: {
            class: {
              include: {
                level: true,
              }
            }
          }
        },
        teacher: true,
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  }
}
