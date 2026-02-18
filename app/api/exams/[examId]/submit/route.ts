import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request, context: { params: { examId: string } }) {
  const { examId } = context.params
  try {
    const body = await request.json()
    const { answers } = body

    // Generate a mock hash
    const payload = JSON.stringify({ examId, answers, timestamp: new Date().toISOString() })
    const hash = crypto.createHash('sha256').update(payload).digest('hex')

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      submissionId: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      payloadHash: hash,
      blockchainStatus: 'pending', // Simulated status
      submittedAt: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Submission failed' },
      { status: 500 }
    )
  }
}
