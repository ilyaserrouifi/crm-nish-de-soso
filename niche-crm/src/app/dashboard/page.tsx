import { prisma } from '@/lib/prisma'

async function getDashboardData() {
  const [clients, projects, tasks, invoices, expenses] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.invoice.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ])

  const invoiceTotal = invoices._sum.amount ?? 0
  const expenseTotal = expenses._sum.amount ?? 0

  return {
    clients,
    projects,
    tasks,
    invoiceTotal,
    expenseTotal,
    profit: invoiceTotal - expenseTotal,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>CRM Dashboard</h1>
      <p>Live metrics from your database.</p>
      <ul>
        <li>Clients: {data.clients}</li>
        <li>Projects: {data.projects}</li>
        <li>Tasks: {data.tasks}</li>
        <li>Invoiced: ${data.invoiceTotal.toFixed(2)}</li>
        <li>Expenses: ${data.expenseTotal.toFixed(2)}</li>
        <li>Profit: ${data.profit.toFixed(2)}</li>
      </ul>
    </main>
  )
}
