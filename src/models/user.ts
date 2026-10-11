import { prisma } from "../lib/db.js"

const LOCAL_USER = {
  email: "local@taxhacker",
  name: "Local User",
}

export async function getOrCreateUser() {
  const user = await prisma.user.upsert({
    where: { email: LOCAL_USER.email },
    update: {},
    create: LOCAL_USER,
  })
  return user
}
