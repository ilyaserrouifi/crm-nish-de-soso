import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const projects = await prisma.project.findMany({ where: { clientId: params.id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
