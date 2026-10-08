import type { Request, Response } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { getSmsProvider } from "../services/smsService.js";
import { getPhoneDetector } from "../services/phoneDetectorService.js";

// E.164 phone regex (e.g. +14155552671 or national with country code, min 10 digits, max 15 digits)
const phoneRegex = /^\+[1-9]\d{7,14}$/;

const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => {
      // Normalize: remove spaces, hyphens, parentheses
      const clean = val.replace(/[\s\-()]/g, "");
      // If missing leading +, add it if it starts with country code, or keep clean
      return clean.startsWith("+") ? clean : `+${clean}`;
    })
    .refine((val) => phoneRegex.test(val), {
      message: "Phone number must be a valid international number in E.164 format (e.g., +14155552671)",
    }),
});

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => {
      const clean = val.replace(/[\s\-()]/g, "");
      return clean.startsWith("+") ? clean : `+${clean}`;
    })
    .refine((val) => phoneRegex.test(val), {
      message: "Phone number must be in E.164 format (e.g., +14155552671)",
    }),
  otp: z.string().trim().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

// Settings:
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SEND_PER_HOUR = 6;

function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export async function sendOtp(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { phone } = sendOtpSchema.parse(req.body);

  // 1. Check if user is already phone verified
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, phoneVerified: true },
  });

  if (!currentUser) {
    throw new HttpError(404, "User not found");
  }

  // 2. Prevent multiple accounts from using the same verified phone number
  const existingOwner = await prisma.user.findFirst({
    where: {
      phone,
      phoneVerified: true,
      NOT: { id: userId },
    },
  });

  if (existingOwner) {
    throw new HttpError(409, "This phone number is already verified with another account");
  }

  // 3. Disposable / Temporary number and suspicious line type detection
  const phoneDetector = getPhoneDetector();
  const detectionResult = await phoneDetector.checkPhone(phone);

  if (!detectionResult.isValid) {
    throw new HttpError(400, "Invalid phone number according to carrier validation.");
  }

  if (detectionResult.isDisposable) {
    throw new HttpError(
      400,
      detectionResult.reason ||
        "Temporary, virtual, or disposable phone numbers are not allowed. Please use a standard mobile number."
    );
  }

  if (detectionResult.isSuspicious && (detectionResult.riskScore ?? 0) >= 70) {
    throw new HttpError(
      400,
      detectionResult.reason ||
        "This number was flagged as suspicious or high risk (VoIP / virtual). Please provide a standard mobile phone number."
    );
  }

  // 4. Rate limiting: check recent OTP requests for this user in the past 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.phoneVerification.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= MAX_SEND_PER_HOUR) {
    throw new HttpError(429, "Too many OTP requests. Please try again in an hour.");
  }

  // 4b. Rate limiting per phone number across all accounts (prevent phone spam attack)
  const recentPhoneRequests = await prisma.phoneVerification.count({
    where: {
      phone,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentPhoneRequests >= MAX_SEND_PER_HOUR) {
    throw new HttpError(429, "Too many verification requests sent to this number. Please wait an hour.");
  }

  // 5. Check resend cooldown from the latest active record
  const latestVerification = await prisma.phoneVerification.findFirst({
    where: { userId, phone },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  if (latestVerification) {
    const elapsedSeconds = (now.getTime() - new Date(latestVerification.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitRemaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new HttpError(429, `Please wait ${waitRemaining}s before requesting a new code.`);
    }
  }

  // 5. Generate secure 6-digit numeric OTP (never expose to client)
  const otpNumber = crypto.randomInt(100000, 999999);
  const otpString = otpNumber.toString();
  const otpHash = await hashOtp(otpString);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 6. Save verification record
  await prisma.phoneVerification.create({
    data: {
      userId,
      phone,
      otpHash,
      attempts: 0,
      expiresAt,
      lastSentAt: now,
      verified: false,
    },
  });

  // 7. Send SMS via SMS Provider (safe abstraction)
  const smsProvider = getSmsProvider();
  const sendResult = await smsProvider.sendSms(
    phone,
    `Your CreatorHub AI verification code is ${otpString}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
  );

  if (!sendResult.success) {
    console.error("[SMS Delivery Failure]", sendResult.error);
    throw new HttpError(500, "Failed to send SMS. Please verify your phone number and try again.");
  }

  // Note: We never expose phone number or OTP in the response
  res.json({
    ok: true,
    message: "Verification code sent successfully",
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    isDevelopmentMode: detectionResult.isDevelopmentMode,
  });
}

export async function verifyOtp(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { phone, otp } = verifyOtpSchema.parse(req.body);

  // 1. Prevent duplicate phone check again before finalizing
  const existingOwner = await prisma.user.findFirst({
    where: {
      phone,
      phoneVerified: true,
      NOT: { id: userId },
    },
  });

  if (existingOwner) {
    throw new HttpError(409, "This phone number is already verified with another account");
  }

  // 2. Find latest active verification record for this user and phone
  const verification = await prisma.phoneVerification.findFirst({
    where: {
      userId,
      phone,
      verified: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new HttpError(400, "No pending verification found. Please request a new code.");
  }

  // 3. Check expiration
  if (new Date() > new Date(verification.expiresAt)) {
    throw new HttpError(400, "Verification code has expired. Please request a new one.");
  }

  // 4. Check maximum attempts
  if (verification.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "Maximum attempts exceeded. Please request a new code.");
  }

  // 5. Verify OTP hash
  const isValid = await verifyOtpHash(otp, verification.otpHash);

  if (!isValid) {
    const updatedAttempts = verification.attempts + 1;
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { attempts: updatedAttempts },
    });

    const attemptsRemaining = Math.max(0, MAX_VERIFY_ATTEMPTS - updatedAttempts);
    throw new HttpError(
      400,
      attemptsRemaining > 0
        ? `Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`
        : "Incorrect code. Maximum attempts reached. Please request a new one."
    );
  }

  // 6. Success: mark verification record as verified & update User
  await prisma.$transaction([
    prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: true,
      },
    }),
  ]);

  // Fetch updated user with sanitized data
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creatorProfile: { include: { verification: true, portfolio: true } },
      brandProfile: true,
    },
  });

  if (!updatedUser) {
    throw new HttpError(404, "User not found");
  }

  const { password: _p, phone: _rawPhone, ...safeUser } = updatedUser;

  res.json({
    ok: true,
    message: "Phone verified successfully",
    user: {
      ...safeUser,
      phoneVerified: true,
      // Provide only masked representation for privacy: e.g. +1415***2671
      phoneMasked: phone.length > 7 ? `${phone.slice(0, 5)}***${phone.slice(-3)}` : "***",
    },
  });
}

export async function getPhoneStatus(req: Request, res: Response) {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phoneVerified: true,
      phone: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const detector = getPhoneDetector();

  res.json({
    phoneVerified: user.phoneVerified,
    phoneMasked:
      user.phone && user.phone.length > 7 ? `${user.phone.slice(0, 5)}***${user.phone.slice(-3)}` : null,
    isDevelopmentMode: detector.name === "development",
  });
}
