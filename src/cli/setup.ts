import { execSync } from "child_process"
import { getOrCreateUser } from "../models/user.js"
import { createUserDefaults, isDatabaseEmpty } from "../models/defaults.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const { positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "init": {
      execSync("npx prisma migrate deploy --schema src/prisma/schema.prisma", { stdio: "inherit" })
      const user = await getOrCreateUser()
      const empty = await isDatabaseEmpty(user.id)
      if (empty) {
        await createUserDefaults(user.id)
      }
      outputJSON({ success: true, message: "Database initialized", userId: user.id, seeded: empty })
      break
    }
    case "reset": {
      const user = await getOrCreateUser()
      await prisma.transaction.deleteMany({ where: { userId: user.id } })
      await prisma.file.deleteMany({ where: { userId: user.id } })
      await prisma.category.deleteMany({ where: { userId: user.id } })
      await prisma.project.deleteMany({ where: { userId: user.id } })
      await prisma.field.deleteMany({ where: { userId: user.id } })
      await prisma.currency.deleteMany({ where: { userId: user.id } })
      await prisma.setting.deleteMany({ where: { userId: user.id } })
      await createUserDefaults(user.id)
      outputJSON({ success: true, message: "All data reset and defaults re-seeded", userId: user.id })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: init, reset`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
