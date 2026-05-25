import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const tasks = await prisma.task.findMany({
      where: { visibleToClient: true, project: { clientId: id } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, status: true, priority: true, deadline: true, updatedAt: true, project: { select: { name: true } } },
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch visible tasks' }, { status: 500 })
  }
}
