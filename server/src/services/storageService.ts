import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredFileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  storageUrl: string;
  isPublic: boolean;
  ownerUserId: string;
  createdAt: Date;
}

const UPLOADS_ROOT = path.resolve(process.cwd(), "data", "uploads");

// Ensure directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

export class SecureStorageService {
  /**
   * Save a base64 encoded document securely
   */
  async saveFile(options: {
    ownerUserId: string;
    originalName: string;
    mimeType: string;
    base64Data: string;
    isPublic: boolean;
    category: "resume" | "certificate";
  }): Promise<StoredFileMetadata> {
    const fileId = `${options.category}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    
    // Sanitize extension and filename
    const safeExt = path.extname(options.originalName).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 8) || ".bin";
    const storedFileName = `${fileId}${safeExt}`;
    const targetDir = path.join(UPLOADS_ROOT, options.category);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullFilePath = path.join(targetDir, storedFileName);

    // Strip data URL scheme prefix if present (e.g. data:application/pdf;base64,)
    const cleanBase64 = options.base64Data.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    await fs.promises.writeFile(fullFilePath, fileBuffer);

    // Controlled endpoint URL: downloads/views pass through authorization check
    const storageUrl = `/api/files/${fileId}`;

    return {
      id: fileId,
      originalName: options.originalName,
      mimeType: options.mimeType || "application/octet-stream",
      sizeBytes: fileBuffer.length,
      filePath: fullFilePath,
      storageUrl,
      isPublic: options.isPublic,
      ownerUserId: options.ownerUserId,
      createdAt: new Date(),
    };
  }

  /**
   * Resolve an internal file ID to disk path
   */
  async getFilePath(fileId: string): Promise<{ fullPath: string; mimeType: string } | null> {
    // Prevent directory traversal
    const safeId = path.basename(fileId);
    for (const sub of ["resume", "certificate"]) {
      const dir = path.join(UPLOADS_ROOT, sub);
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        const match = files.find((f) => f.startsWith(safeId));
        if (match) {
          const fullPath = path.join(dir, match);
          const ext = path.extname(match).toLowerCase();
          const mimeType =
            ext === ".pdf"
              ? "application/pdf"
              : ext === ".png"
              ? "image/png"
              : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
          return { fullPath, mimeType };
        }
      }
    }
    return null;
  }
}

export const storageService = new SecureStorageService();
