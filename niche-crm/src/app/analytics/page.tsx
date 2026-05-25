import { prisma } from '@/lib/prisma'

type StageItem = { stage: string; _count: { stage: number }; _sum: { dealValue: number | null } }

function pct(part: number, total: number) {
  if (!total) return 0
  return (part / total) * 100
}

export default async function AnalyticsPage() {
  const [
    coldCallers,
    leadsTotal,
    leadsByStage,
    clients,
    invoices,
    expenses,
    topCallers,
    monthlyClients,
  ] = await Promise.all([
    prisma.coldCaller.findMany({ orderBy: { callsMade: 'desc' } }),
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ['stage'], _count: { stage: true }, _sum: { dealValue: true } }),
    prisma.client.findMany({ select: { id: true, niche: true, mrr: true, createdAt: true, status: true } }),
    prisma.invoice.findMany({ select: { amount: true, status: true, dueDate: true, recurring: true } }),
    prisma.expense.findMany({ select: { amount: true } }),
    prisma.coldCaller.findMany({ take: 10, orderBy: [{ closes: 'desc' }, { meetingsBooked: 'desc' }] }),
    prisma.client.findMany({ select: { createdAt: true, status: true } }),
  ])

  const paidRevenue = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const mrr = clients.reduce((s, c) => s + c.mrr, 0)
  const meetings = coldCallers.reduce((s, c) => s + c.meetingsBooked, 0)
  const calls = coldCallers.reduce((s, c) => s + c.callsMade, 0)
  const closes = coldCallers.reduce((s, c) => s + c.closes, 0)

  const stageMap = new Map(leadsByStage.map((s) => [s.stage, s] as const))
  const orderedStages = ['LEAD', 'CONTACTED', 'MEETING', 'PROPOSAL', 'NEGOTIATING', 'CLOSED_WON']
  const pipeline: StageItem[] = orderedStages.map((stage) =>
    stageMap.get(stage) ?? { stage, _count: { stage: 0 }, _sum: { dealValue: 0 } }
  )

  const nicheRevenue: Record<string, number> = {}
  for (const c of clients) {
    const key = c.niche || 'Unknown'
    nicheRevenue[key] = (nicheRevenue[key] ?? 0) + c.mrr
  }
  const nicheRows = Object.entries(nicheRevenue).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })
  const cohortMap = new Map<string, { started: number; active: number }>()
  for (const c of monthlyClients) {
    const key = monthFmt.format(c.createdAt)
    const row = cohortMap.get(key) ?? { started: 0, active: 0 }
    row.started += 1
    if (c.status === 'active') row.active += 1
    cohortMap.set(key, row)
  }

  const cohorts = Array.from(cohortMap.entries()).map(([month, row]) => ({
    month,
    started: row.started,
    active: row.active,
    retention: pct(row.active, row.started),
  }))

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Analytics</h1>
      <p>Live analytics connected to your real CRM database.</p>

      <h2>KPIs</h2>
      <ul>
        <li>Total calls: {calls}</li>
        <li>Meeting rate: {pct(meetings, calls).toFixed(1)}%</li>
        <li>Close rate: {pct(closes, meetings).toFixed(1)}%</li>
        <li>MRR: ${mrr.toFixed(2)}</li>
        <li>Paid revenue: ${paidRevenue.toFixed(2)}</li>
        <li>Expenses: ${totalExpenses.toFixed(2)}</li>
        <li>Net profit: ${(paidRevenue - totalExpenses).toFixed(2)}</li>
      </ul>

      <h2>Top Cold Callers</h2>
      <table><thead><tr><th>Name</th><th>Calls</th><th>Meetings</th><th>Closes</th></tr></thead><tbody>
        {topCallers.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.callsMade}</td><td>{c.meetingsBooked}</td><td>{c.closes}</td></tr>)}
      </tbody></table>

      <h2>Pipeline by Stage</h2>
      <table><thead><tr><th>Stage</th><th>Leads</th><th>Deal Value</th><th>Share</th></tr></thead><tbody>
        {pipeline.map((s) => <tr key={s.stage}><td>{s.stage}</td><td>{s._count.stage}</td><td>${(s._sum.dealValue ?? 0).toFixed(2)}</td><td>{pct(s._count.stage, leadsTotal).toFixed(1)}%</td></tr>)}
      </tbody></table>

      <h2>Revenue by Niche (MRR)</h2>
      <table><thead><tr><th>Niche</th><th>MRR</th></tr></thead><tbody>
        {nicheRows.map(([niche, value]) => <tr key={niche}><td>{niche}</td><td>${value.toFixed(2)}</td></tr>)}
      </tbody></table>

      <h2>Client Cohorts</h2>
      <table><thead><tr><th>Month</th><th>Started</th><th>Active</th><th>Retention</th></tr></thead><tbody>
        {cohorts.map((c) => <tr key={c.month}><td>{c.month}</td><td>{c.started}</td><td>{c.active}</td><td>{c.retention.toFixed(1)}%</td></tr>)}
      </tbody></table>
    </main>
  )
}
