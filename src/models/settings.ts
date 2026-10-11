import { prisma } from "../lib/db.js"

export async function getAllSettings(userId: string): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { userId },
  })

  return settings.reduce((acc, setting) => {
    acc[setting.code] = setting.value || ""
    return acc
  }, {} as Record<string, string>)
}

export async function getSetting(userId: string, code: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { userId_code: { code, userId } },
  })
  return setting?.value ?? null
}

export async function setSetting(userId: string, code: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { userId_code: { code, userId } },
    update: { value },
    create: { code, value, userId },
  })
}
