import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "../..")

export const config = {
  uploadPath: process.env.UPLOAD_PATH || path.join(PROJECT_ROOT, "uploads"),
  inboxPath: process.env.INBOX_PATH || path.join(PROJECT_ROOT, "inbox"),
  dataPath: process.env.DATA_PATH || path.join(PROJECT_ROOT, "data"),
} as const
