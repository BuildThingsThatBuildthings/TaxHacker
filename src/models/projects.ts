import { prisma } from "../lib/db.js"
import { codeFromName } from "../lib/utils.js"

export type ProjectData = {
  name: string
  color?: string
  prompt?: string
}

export async function listProjects(userId: string) {
  return await prisma.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
}

export async function createProject(userId: string, data: ProjectData) {
  const code = codeFromName(data.name)
  return await prisma.project.create({
    data: {
      code,
      name: data.name,
      color: data.color ?? "#000000",
      prompt: data.prompt,
      userId,
    },
  })
}

export async function updateProject(userId: string, code: string, data: Partial<ProjectData>) {
  return await prisma.project.update({
    where: { userId_code: { userId, code } },
    data,
  })
}

export async function deleteProject(userId: string, code: string) {
  // Unlink transactions from this project
  await prisma.transaction.updateMany({
    where: { userId, projectCode: code },
    data: { projectCode: null },
  })

  return await prisma.project.delete({
    where: { userId_code: { userId, code } },
  })
}
