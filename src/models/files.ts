import { prisma } from "../lib/db.js"
import { config } from "../lib/config.js"
import { generateUUID } from "../lib/utils.js"
import { access, copyFile, mkdir, stat, unlink } from "fs/promises"
import path from "path"

export async function registerFile(userId: string, sourcePath: string) {
  const resolvedPath = path.resolve(sourcePath)
  const basename = path.basename(resolvedPath)

  if (basename.includes("..")) {
    throw new Error("Invalid filename: must not contain '..'")
  }

  try {
    await access(resolvedPath)
  } catch {
    throw new Error(`File not found: ${resolvedPath}`)
  }

  const fileStat = await stat(resolvedPath)
  if (!fileStat.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`)
  }

  const now = new Date()
  const year = now.getFullYear().toString()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const ext = path.extname(sourcePath)
  const id = generateUUID()
  const filename = path.basename(sourcePath)

  const relativeDir = path.join(year, month)
  const destDir = path.join(config.uploadPath, relativeDir)
  await mkdir(destDir, { recursive: true })

  const destFilename = `${id}${ext}`
  const destPath = path.join(destDir, destFilename)
  const relativePath = path.join(relativeDir, destFilename)

  await copyFile(sourcePath, destPath)

  // Detect mimetype from extension
  const mimetype = getMimeType(ext)

  const file = await prisma.file.create({
    data: {
      id,
      filename,
      path: relativePath,
      mimetype,
      reviewed: false,
      userId,
    },
  })

  return file
}

export async function listUnsortedFiles(userId: string) {
  return await prisma.file.findMany({
    where: { userId, reviewed: false },
    orderBy: { createdAt: "desc" },
  })
}

export async function getFile(id: string, userId: string) {
  return await prisma.file.findFirst({
    where: { id, userId },
  })
}

export async function linkFileToTransaction(
  fileId: string,
  transactionId: string,
  userId: string
): Promise<void> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  })
  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`)
  }

  let files: string[] = []
  try {
    files = JSON.parse(transaction.files || "[]")
  } catch {
    files = []
  }

  if (!files.includes(fileId)) {
    files.push(fileId)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { files: JSON.stringify(files) },
    })
  }

  // Mark file as reviewed
  await prisma.file.update({
    where: { id: fileId },
    data: { reviewed: true },
  })
}

export async function deleteFile(id: string, userId: string) {
  const file = await getFile(id, userId)
  if (!file) return

  // Remove from disk
  try {
    const fullPath = path.resolve(config.uploadPath, file.path)
    await unlink(fullPath)
  } catch {
    // File may already be deleted from disk
  }

  return await prisma.file.delete({
    where: { id },
  })
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".json": "application/json",
    ".xml": "application/xml",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
  return map[ext.toLowerCase()] || "application/octet-stream"
}
