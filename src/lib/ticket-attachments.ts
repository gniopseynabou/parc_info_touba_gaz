import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_TICKET_PHOTOS = 5;
export const MAX_TICKET_PHOTO_SIZE = 5 * 1024 * 1024;
export const MAX_TICKET_REQUEST_SIZE = 27 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export interface ValidatedTicketPhoto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

export class TicketPhotoValidationError extends Error {}

function validDimensions(width: number, height: number) {
  return width > 0 && height > 0 && width * height <= MAX_IMAGE_PIXELS;
}

function detectJpeg(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return false;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) return false;
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) return false;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return false;
    if (startOfFrame.has(marker)) {
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return validDimensions(width, height);
    }
    offset += segmentLength;
  }
  return false;
}

function detectPng(buffer: Buffer) {
  if (
    buffer.length < 24 ||
    !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    buffer.toString("ascii", 12, 16) !== "IHDR"
  ) return false;
  return validDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
}

function detectWebp(buffer: Buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return false;
  }
  const chunk = buffer.toString("ascii", 12, 16);
  let width = 0;
  let height = 0;
  if (chunk === "VP8X") {
    width = 1 + buffer.readUIntLE(24, 3);
    height = 1 + buffer.readUIntLE(27, 3);
  } else if (chunk === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    width = buffer.readUInt16LE(26) & 0x3fff;
    height = buffer.readUInt16LE(28) & 0x3fff;
  } else if (chunk === "VP8L" && buffer[20] === 0x2f) {
    width = 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]);
    height = 1 + (((buffer[23] & 0x0f) << 10) | (buffer[22] >> 6) | (buffer[24] << 2));
  }
  return validDimensions(width, height);
}

export async function validateTicketPhotos(files: File[]): Promise<ValidatedTicketPhoto[]> {
  if (files.length > MAX_TICKET_PHOTOS) {
    throw new TicketPhotoValidationError(`Vous pouvez joindre au maximum ${MAX_TICKET_PHOTOS} photos.`);
  }

  const validated: ValidatedTicketPhoto[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_TICKET_PHOTO_SIZE) {
      throw new TicketPhotoValidationError("Chaque photo doit peser au maximum 5 Mo.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    let mimeType: string | null = null;
    let extension: string | null = null;
    if (detectJpeg(buffer)) {
      mimeType = "image/jpeg";
      extension = "jpg";
    } else if (detectPng(buffer)) {
      mimeType = "image/png";
      extension = "png";
    } else if (detectWebp(buffer)) {
      mimeType = "image/webp";
      extension = "webp";
    }
    if (!mimeType || (file.type && file.type !== mimeType)) {
      throw new TicketPhotoValidationError(`${file.name || "Un fichier"} n'est pas une image JPEG, PNG ou WEBP valide.`);
    }
    validated.push({
      buffer,
      originalName: path.basename(file.name).slice(0, 255) || "photo",
      mimeType,
      sizeBytes: buffer.length,
      storageKey: `${randomUUID()}.${extension}`,
    });
  }
  return validated;
}

export function getTicketUploadDirectory() {
  return path.resolve(process.env.TICKET_UPLOAD_DIR || path.join(process.cwd(), "private_uploads", "tickets"));
}

export async function storeTicketPhoto(ticketId: string, photo: ValidatedTicketPhoto) {
  const root = getTicketUploadDirectory();
  const directory = path.resolve(root, ticketId);
  if (!directory.startsWith(`${root}${path.sep}`)) throw new Error("Identifiant de ticket invalide.");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path.join(directory, photo.storageKey), photo.buffer, { flag: "wx", mode: 0o600 });
}

export async function removeStoredTicketPhotos(ticketId: string, storageKeys: string[]) {
  const root = getTicketUploadDirectory();
  const directory = path.resolve(root, ticketId);
  if (!directory.startsWith(`${root}${path.sep}`)) throw new Error("Identifiant de ticket invalide.");
  await Promise.all(storageKeys.map(async (key) => {
    if (path.basename(key) !== key) throw new Error("Référence de photo invalide.");
    await rm(path.join(directory, key), { force: true });
  }));
}

export function getStoredTicketPhotoPath(ticketId: string, storageKey: string) {
  const root = getTicketUploadDirectory();
  const directory = path.resolve(root, ticketId);
  if (!directory.startsWith(`${root}${path.sep}`) || path.basename(storageKey) !== storageKey) {
    throw new Error("Référence de photo invalide.");
  }
  return path.join(directory, storageKey);
}
