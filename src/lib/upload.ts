import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { getEnv } from "@/lib/env";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 2MB).");
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const env = getEnv();

  if (env.UPLOAD_DRIVER === "blob") {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
    }
    const blob = await put(`products/${filename}`, file, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/products/${filename}`;
}
