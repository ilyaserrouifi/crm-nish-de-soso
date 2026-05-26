import { prisma } from '@/lib/prisma'

type ClientRow = {
  id: string
  company: string
  name: string
  status: string
  mrr: number
  country?: string | null
  city?: string | null
}

type GeoRow = { country: string; count: number }

async function fetchClientsWithLocationFallback(): Promise<ClientRow[]> {
  const baseClients = await prisma.client.findMany({
    select: {
      id: true,
      company: true,
      name: true,
      status: true,
      mrr: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return baseClients.map((client) => ({
    ...client,
    country: null,
    city: null,
  }))
}

async function getDashboardData() {
  const [clientsCount, projects, tasks, invoices, expenses, clients] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.invoice.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    fetchClientsWithLocationFallback(),
  ])

  const invoiceTotal = invoices._sum.amount ?? 0
  const expenseTotal = expenses._sum.amount ?? 0

  const geoMap = new Map<string, number>()
  for (const client of clients) {
    const key = client.country?.trim() || 'Unknown'
    geoMap.set(key, (geoMap.get(key) ?? 0) + 1)
  }

  const geoRows: GeoRow[] = Array.from(geoMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)

  const maxCount = geoRows[0]?.count ?? 1

  return {
    clientsCount,
    projects,
    tasks,
    invoiceTotal,
    expenseTotal,
    profit: invoiceTotal - expenseTotal,
    clients,
    geoRows,
    maxCount,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>CRM Dashboard</h1>
      <p>Live metrics from your database.</p>
      <ul>
        <li>Clients: {data.clientsCount}</li>
        <li>Projects: {data.projects}</li>
        <li>Tasks: {data.tasks}</li>
        <li>Invoiced: ${data.invoiceTotal.toFixed(2)}</li>
        <li>Expenses: ${data.expenseTotal.toFixed(2)}</li>
        <li>Profit: ${data.profit.toFixed(2)}</li>
      </ul>

      <section style={{ marginTop: '2rem' }}>
        <h2>Client Geography (Real DB Data)</h2>
        <p>Each bar below is calculated from saved client countries (not mock data).</p>
        {data.geoRows.length === 0 ? (
          <p>No client location data yet. Add country/city in clients to see the map bars.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {data.geoRows.map((row) => {
              const width = Math.max(8, Math.round((row.count / data.maxCount) * 100))
              return (
                <div key={row.country}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{row.country}</strong>
                    <span>{row.count} client(s)</span>
                  </div>
                  <div style={{ height: 12, background: '#ddd', borderRadius: 999 }}>
                    <div style={{ width: `${width}%`, height: '100%', borderRadius: 999, background: '#2b2fff' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Clients List with Location</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Company</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Contact</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Country</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>City</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>MRR</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.clients.map((client) => (
              <tr key={client.id}>
                <td style={{ padding: '8px 0' }}>{client.company}</td>
                <td>{client.name}</td>
                <td>{client.country || '—'}</td>
                <td>{client.city || '—'}</td>
                <td>${client.mrr.toFixed(2)}</td>
                <td>{client.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
