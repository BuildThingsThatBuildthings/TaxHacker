import { prisma } from "../lib/db.js"
import { config } from "../lib/config.js"
import JSZip from "jszip"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

export async function createBackup(userId: string, outputPath: string): Promise<string> {
  const zip = new JSZip()

  // Metadata
  zip.file(
    "metadata.json",
    JSON.stringify({ version: 1, date: new Date().toISOString() }, null, 2)
  )

  // Export each model
  const transactions = await prisma.transaction.findMany({ where: { userId } })
  zip.file("data/transactions.json", JSON.stringify(transactions, null, 2))

  const categories = await prisma.category.findMany({ where: { userId } })
  zip.file("data/categories.json", JSON.stringify(categories, null, 2))

  const projects = await prisma.project.findMany({ where: { userId } })
  zip.file("data/projects.json", JSON.stringify(projects, null, 2))

  const fields = await prisma.field.findMany({ where: { userId } })
  zip.file("data/fields.json", JSON.stringify(fields, null, 2))

  const currencies = await prisma.currency.findMany({ where: { userId } })
  zip.file("data/currencies.json", JSON.stringify(currencies, null, 2))

  const settings = await prisma.setting.findMany({ where: { userId } })
  zip.file("data/settings.json", JSON.stringify(settings, null, 2))

  const contacts = await prisma.contact.findMany({ where: { userId } })
  zip.file("data/contacts.json", JSON.stringify(contacts, null, 2))

  const invoices = await prisma.invoice.findMany({ where: { userId } })
  zip.file("data/invoices.json", JSON.stringify(invoices, null, 2))

  const bills = await prisma.bill.findMany({ where: { userId } })
  zip.file("data/bills.json", JSON.stringify(bills, null, 2))

  const bankAccounts = await prisma.bankAccount.findMany({ where: { userId } })
  zip.file("data/bankAccounts.json", JSON.stringify(bankAccounts, null, 2))

  const bankTransactions = await prisma.bankTransaction.findMany({ where: { userId } })
  zip.file("data/bankTransactions.json", JSON.stringify(bankTransactions, null, 2))

  const mileageLogs = await prisma.mileageLog.findMany({ where: { userId } })
  zip.file("data/mileageLogs.json", JSON.stringify(mileageLogs, null, 2))

  const timeEntries = await prisma.timeEntry.findMany({ where: { userId } })
  zip.file("data/timeEntries.json", JSON.stringify(timeEntries, null, 2))

  // Include uploaded files
  const files = await prisma.file.findMany({ where: { userId } })
  zip.file("data/files.json", JSON.stringify(files, null, 2))

  for (const file of files) {
    try {
      const fullPath = path.resolve(config.uploadPath, file.path)
      const fileData = await readFile(fullPath)
      zip.file(`uploads/${file.path}`, fileData)
    } catch {
      // Skip files that don't exist on disk
    }
  }

  const content = await zip.generateAsync({ type: "nodebuffer" })
  await writeFile(outputPath, content)
  return outputPath
}

export async function restoreBackup(userId: string, zipPath: string): Promise<void> {
  const data = await readFile(zipPath)
  const zip = await JSZip.loadAsync(data)

  // Validate metadata
  const metadataFile = zip.file("metadata.json")
  if (!metadataFile) {
    throw new Error("Invalid backup: missing metadata.json")
  }
  const metadata = JSON.parse(await metadataFile.async("string"))
  if (!metadata.version || !metadata.date) {
    throw new Error("Invalid backup: malformed metadata")
  }

  // Restore order matters: settings, currencies, categories, projects, fields first, then files, then transactions

  // Settings
  const settingsFile = zip.file("data/settings.json")
  if (settingsFile) {
    const records = JSON.parse(await settingsFile.async("string"))
    for (const record of records) {
      await prisma.setting.upsert({
        where: { userId_code: { code: record.code, userId } },
        update: { value: record.value },
        create: { code: record.code, value: record.value, userId },
      })
    }
  }

  // Currencies
  const currenciesFile = zip.file("data/currencies.json")
  if (currenciesFile) {
    const records = JSON.parse(await currenciesFile.async("string"))
    for (const record of records) {
      await prisma.currency.upsert({
        where: { userId_code: { code: record.code, userId } },
        update: { symbol: record.symbol },
        create: { code: record.code, symbol: record.symbol, userId },
      })
    }
  }

  // Categories
  const categoriesFile = zip.file("data/categories.json")
  if (categoriesFile) {
    const records = JSON.parse(await categoriesFile.async("string"))
    for (const record of records) {
      await prisma.category.upsert({
        where: { userId_code: { code: record.code, userId } },
        update: { name: record.name, color: record.color, prompt: record.prompt },
        create: {
          code: record.code,
          name: record.name,
          color: record.color,
          prompt: record.prompt,
          userId,
        },
      })
    }
  }

  // Projects
  const projectsFile = zip.file("data/projects.json")
  if (projectsFile) {
    const records = JSON.parse(await projectsFile.async("string"))
    for (const record of records) {
      await prisma.project.upsert({
        where: { userId_code: { code: record.code, userId } },
        update: { name: record.name, color: record.color, prompt: record.prompt },
        create: {
          code: record.code,
          name: record.name,
          color: record.color,
          prompt: record.prompt,
          userId,
        },
      })
    }
  }

  // Fields
  const fieldsFile = zip.file("data/fields.json")
  if (fieldsFile) {
    const records = JSON.parse(await fieldsFile.async("string"))
    for (const record of records) {
      await prisma.field.upsert({
        where: { userId_code: { code: record.code, userId } },
        update: {
          name: record.name,
          type: record.type,
          prompt: record.prompt,
          required: record.required,
          isExtra: record.isExtra,
        },
        create: {
          code: record.code,
          name: record.name,
          type: record.type,
          prompt: record.prompt,
          required: record.required,
          isExtra: record.isExtra,
          userId,
        },
      })
    }
  }

  // Contacts
  const contactsFile = zip.file("data/contacts.json")
  if (contactsFile) {
    const records = JSON.parse(await contactsFile.async("string"))
    for (const record of records) {
      try {
        await prisma.contact.upsert({
          where: { userId_name: { name: record.name, userId } },
          update: {
            type: record.type,
            email: record.email,
            phone: record.phone,
            address: record.address,
            taxId: record.taxId,
            w9Received: record.w9Received,
            paymentTerms: record.paymentTerms,
            defaultCategory: record.defaultCategory,
            defaultProject: record.defaultProject,
            notes: record.notes,
          },
          create: {
            id: record.id,
            name: record.name,
            type: record.type,
            email: record.email,
            phone: record.phone,
            address: record.address,
            taxId: record.taxId,
            w9Received: record.w9Received || false,
            paymentTerms: record.paymentTerms,
            defaultCategory: record.defaultCategory,
            defaultProject: record.defaultProject,
            notes: record.notes,
            userId,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  // Files - restore records and copy files to uploads directory
  const filesFile = zip.file("data/files.json")
  if (filesFile) {
    const records = JSON.parse(await filesFile.async("string"))
    for (const record of records) {
      // Restore file to disk if it exists in the zip
      const zipFile = zip.file(`uploads/${record.path}`)
      if (zipFile) {
        const destPath = path.resolve(config.uploadPath, record.path)
        await mkdir(path.dirname(destPath), { recursive: true })
        const fileContent = await zipFile.async("nodebuffer")
        await writeFile(destPath, fileContent)
      }

      // Upsert file record
      try {
        await prisma.file.upsert({
          where: { id: record.id },
          update: {
            filename: record.filename,
            path: record.path,
            mimetype: record.mimetype,
            reviewed: record.reviewed,
          },
          create: {
            id: record.id,
            filename: record.filename,
            path: record.path,
            mimetype: record.mimetype,
            reviewed: record.reviewed,
            userId,
          },
        })
      } catch {
        // Skip duplicate files
      }
    }
  }

  // Transactions
  const transactionsFile = zip.file("data/transactions.json")
  if (transactionsFile) {
    const records = JSON.parse(await transactionsFile.async("string"))
    for (const record of records) {
      try {
        await prisma.transaction.upsert({
          where: { id: record.id },
          update: {
            name: record.name,
            description: record.description,
            merchant: record.merchant,
            total: record.total,
            currencyCode: record.currencyCode,
            type: record.type,
            items: record.items,
            note: record.note,
            files: record.files,
            extra: record.extra,
            categoryCode: record.categoryCode,
            projectCode: record.projectCode,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            text: record.text,
          },
          create: {
            id: record.id,
            name: record.name,
            description: record.description,
            merchant: record.merchant,
            total: record.total,
            currencyCode: record.currencyCode,
            type: record.type,
            items: record.items || "[]",
            note: record.note,
            files: record.files || "[]",
            extra: record.extra,
            categoryCode: record.categoryCode,
            projectCode: record.projectCode,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            text: record.text,
            userId,
          },
        })
      } catch {
        // Skip records that fail to restore
      }
    }
  }

  // Invoices (after transactions, since they reference transactionId)
  const invoicesFile = zip.file("data/invoices.json")
  if (invoicesFile) {
    const records = JSON.parse(await invoicesFile.async("string"))
    for (const record of records) {
      try {
        await prisma.invoice.upsert({
          where: { id: record.id },
          update: {
            invoiceNumber: record.invoiceNumber,
            contactId: record.contactId,
            clientName: record.clientName,
            clientEmail: record.clientEmail,
            lineItems: record.lineItems,
            subtotal: record.subtotal,
            taxRate: record.taxRate,
            taxAmount: record.taxAmount,
            total: record.total,
            currencyCode: record.currencyCode,
            status: record.status,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            dueDate: record.dueDate ? new Date(record.dueDate) : null,
            paidAt: record.paidAt ? new Date(record.paidAt) : null,
            transactionId: record.transactionId,
            projectCode: record.projectCode,
            notes: record.notes,
          },
          create: {
            id: record.id,
            invoiceNumber: record.invoiceNumber,
            contactId: record.contactId,
            clientName: record.clientName,
            clientEmail: record.clientEmail,
            lineItems: record.lineItems || "[]",
            subtotal: record.subtotal,
            taxRate: record.taxRate,
            taxAmount: record.taxAmount,
            total: record.total,
            currencyCode: record.currencyCode,
            status: record.status,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            dueDate: record.dueDate ? new Date(record.dueDate) : null,
            paidAt: record.paidAt ? new Date(record.paidAt) : null,
            transactionId: record.transactionId,
            projectCode: record.projectCode,
            notes: record.notes,
            userId,
          },
        })
      } catch {
        // Skip records that fail to restore
      }
    }
  }

  // Bills (after transactions, since they reference transactionId)
  const billsFile = zip.file("data/bills.json")
  if (billsFile) {
    const records = JSON.parse(await billsFile.async("string"))
    for (const record of records) {
      try {
        await prisma.bill.upsert({
          where: { id: record.id },
          update: {
            contactId: record.contactId,
            vendorName: record.vendorName,
            billNumber: record.billNumber,
            lineItems: record.lineItems,
            total: record.total,
            currencyCode: record.currencyCode,
            status: record.status,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            dueDate: record.dueDate ? new Date(record.dueDate) : null,
            paidAt: record.paidAt ? new Date(record.paidAt) : null,
            transactionId: record.transactionId,
            categoryCode: record.categoryCode,
            projectCode: record.projectCode,
            notes: record.notes,
          },
          create: {
            id: record.id,
            contactId: record.contactId,
            vendorName: record.vendorName,
            billNumber: record.billNumber,
            lineItems: record.lineItems || "[]",
            total: record.total,
            currencyCode: record.currencyCode,
            status: record.status,
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            dueDate: record.dueDate ? new Date(record.dueDate) : null,
            paidAt: record.paidAt ? new Date(record.paidAt) : null,
            transactionId: record.transactionId,
            categoryCode: record.categoryCode,
            projectCode: record.projectCode,
            notes: record.notes,
            userId,
          },
        })
      } catch {
        // Skip records that fail to restore
      }
    }
  }

  // Bank Accounts
  const bankAccountsFile = zip.file("data/bankAccounts.json")
  if (bankAccountsFile) {
    const records = JSON.parse(await bankAccountsFile.async("string"))
    for (const record of records) {
      try {
        await prisma.bankAccount.upsert({
          where: { userId_name: { name: record.name, userId } },
          update: {
            institution: record.institution,
            accountType: record.accountType,
            currencyCode: record.currencyCode,
            lastBalance: record.lastBalance,
            lastBalanceDate: record.lastBalanceDate ? new Date(record.lastBalanceDate) : null,
          },
          create: {
            id: record.id,
            name: record.name,
            institution: record.institution,
            accountType: record.accountType,
            currencyCode: record.currencyCode,
            lastBalance: record.lastBalance,
            lastBalanceDate: record.lastBalanceDate ? new Date(record.lastBalanceDate) : null,
            userId,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  // Bank Transactions
  const bankTransactionsFile = zip.file("data/bankTransactions.json")
  if (bankTransactionsFile) {
    const records = JSON.parse(await bankTransactionsFile.async("string"))
    for (const record of records) {
      try {
        await prisma.bankTransaction.upsert({
          where: { id: record.id },
          update: {
            bankAccountId: record.bankAccountId,
            date: new Date(record.date),
            description: record.description,
            amount: record.amount,
            reference: record.reference,
            status: record.status,
            matchedTxId: record.matchedTxId,
            importBatch: record.importBatch,
          },
          create: {
            id: record.id,
            bankAccountId: record.bankAccountId,
            date: new Date(record.date),
            description: record.description,
            amount: record.amount,
            reference: record.reference,
            status: record.status,
            matchedTxId: record.matchedTxId,
            importBatch: record.importBatch,
            userId,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  // Mileage Logs
  const mileageFile = zip.file("data/mileageLogs.json")
  if (mileageFile) {
    const records = JSON.parse(await mileageFile.async("string"))
    for (const record of records) {
      try {
        await prisma.mileageLog.upsert({
          where: { id: record.id },
          update: {
            date: new Date(record.date),
            origin: record.origin,
            destination: record.destination,
            miles: record.miles,
            purpose: record.purpose,
            projectCode: record.projectCode,
            roundTrip: record.roundTrip,
          },
          create: {
            id: record.id,
            date: new Date(record.date),
            origin: record.origin,
            destination: record.destination,
            miles: record.miles,
            purpose: record.purpose,
            projectCode: record.projectCode,
            roundTrip: record.roundTrip || false,
            userId,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  // Time Entries
  const timeFile = zip.file("data/timeEntries.json")
  if (timeFile) {
    const records = JSON.parse(await timeFile.async("string"))
    for (const record of records) {
      try {
        await prisma.timeEntry.upsert({
          where: { id: record.id },
          update: {
            date: new Date(record.date),
            minutes: record.minutes,
            description: record.description,
            projectCode: record.projectCode,
            categoryCode: record.categoryCode,
            billable: record.billable,
            invoiceId: record.invoiceId,
            hourlyRate: record.hourlyRate,
          },
          create: {
            id: record.id,
            date: new Date(record.date),
            minutes: record.minutes,
            description: record.description,
            projectCode: record.projectCode,
            categoryCode: record.categoryCode,
            billable: record.billable ?? true,
            invoiceId: record.invoiceId,
            hourlyRate: record.hourlyRate,
            userId,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }
}
