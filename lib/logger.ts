import crypto from "crypto";

/**
 * 🔒 SECURITY: Structured logger that sanitizes PII before logging
 * Prevents GDPR/CCPA violations and insider threats from accessing user data in logs
 */

function hashPII(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").substring(0, 16);
}

function sanitizeMeta(meta?: Record<string, any>): Record<string, any> {
  if (!meta) return {};

  const sanitized = { ...meta };

  // Hash email addresses (convert to short hash for correlation without exposing PII)
  if (sanitized.email) {
    sanitized.emailHash = hashPII(sanitized.email);
    delete sanitized.email;
  }

  if (sanitized.userEmail) {
    sanitized.userEmailHash = hashPII(sanitized.userEmail);
    delete sanitized.userEmail;
  }

  // Remove sensitive fields entirely
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.resetToken;
  delete sanitized.verifyToken;

  return sanitized;
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    const sanitized = sanitizeMeta(meta);
    const logEntry = {
      level: "info",
      message,
      ...sanitized,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(logEntry));
    } else {
      // Pretty print in development
      console.log(`[INFO] ${message}`, sanitized);
    }
  },

  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    const sanitized = sanitizeMeta(meta);
    const logEntry = {
      level: "error",
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      ...sanitized,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "production") {
      console.error(JSON.stringify(logEntry));
    } else {
      // Pretty print in development
      console.error(`[ERROR] ${message}`, { error, ...sanitized });
    }
  },

  warn: (message: string, meta?: Record<string, any>) => {
    const sanitized = sanitizeMeta(meta);
    const logEntry = {
      level: "warn",
      message,
      ...sanitized,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "production") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(`[WARN] ${message}`, sanitized);
    }
  },
};

