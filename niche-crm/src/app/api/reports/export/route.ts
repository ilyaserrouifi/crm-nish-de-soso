import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return 'empty\n'
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(String(row[h] ?? ''))).join(','))
  }
  return lines.join('\n')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const format = (url.searchParams.get('format') ?? 'csv').toLowerCase()

  try {
    const [clients, invoices, tasks] = await Promise.all([
      prisma.client.count(),
      prisma.invoice.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.task.groupBy({ by: ['status'], _count: true }),
    ])

    const rows = tasks.map((t) => ({ status: t.status, count: t._count }))
    const summary = {
      generatedAt: new Date().toISOString(),
      clients,
      invoiceCount: invoices._count,
      invoiceAmount: invoices._sum.amount ?? 0,
    }

    if (format === 'pdf') {
      const body = `Niche CRM Report\nGenerated: ${summary.generatedAt}\nClients: ${summary.clients}\nInvoices: ${summary.invoiceCount}\nRevenue: $${summary.invoiceAmount}\n`
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="crm-report.pdf"',
        },
      })
    }

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="crm-report.csv"',
        'X-Report-Summary': JSON.stringify(summary),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
