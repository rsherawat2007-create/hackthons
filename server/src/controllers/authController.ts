import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["CREATOR", "BRAND"]),
  companyName: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user: { id: string; role: "CREATOR" | "BRAND"; email: string }) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
  );
}

function sanitize(user: { password?: string; phone?: string | null; phoneVerified?: boolean }) {
  const { password: _p, phone, ...rest } = user;
  const phoneMasked =
    phone && phone.length > 7 ? `${phone.slice(0, 5)}***${phone.slice(-3)}` : null;
  return { ...rest, phoneMasked };
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const password = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password,
      role: data.role,
      creatorProfile:
        data.role === "CREATOR"
          ? { create: { headline: "AI creator", commercialUse: true } }
          : undefined,
      brandProfile:
        data.role === "BRAND"
          ? { create: { companyName: data.companyName || data.name } }
          : undefined,
    },
    include: { creatorProfile: true, brandProfile: true },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: sanitize(user) });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: { creatorProfile: true, brandProfile: true },
  });
  if (!user) throw new HttpError(401, "Invalid email or password");
  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw new HttpError(401, "Invalid email or password");
  const token = signToken(user);
  res.json({ token, user: sanitize(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { creatorProfile: { include: { verification: true, portfolio: true } }, brandProfile: true },
  });
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: sanitize(user) });
}
