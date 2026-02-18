import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    // Mock validation logic
    if (code === '123456') {
      const now = new Date()
      // Start time is 1 minute ago, end time is 1 hour from now
      const startTime = new Date(now.getTime() - 60000).toISOString()
      const endTime = new Date(now.getTime() + 3600000).toISOString()

      return NextResponse.json({
        valid: true,
        examId: 'mock-exam-001',
        title: 'Mock Final Examination 2024',
        candidateId: 'CAND-998877',
        duration: 60,
        startTime,
        endTime
      })
    }

    if (code === 'FUTURE') {
      const now = new Date()
      // Start time is 5 minutes from now
      const startTime = new Date(now.getTime() + 300000).toISOString()
      const endTime = new Date(now.getTime() + 3900000).toISOString()

      return NextResponse.json({
        valid: true,
        examId: 'mock-exam-future',
        title: 'Upcoming Exam Test',
        candidateId: 'CAND-998877',
        duration: 60,
        startTime,
        endTime
      })
    }

    return NextResponse.json(
      { valid: false, error: 'Invalid exam code' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
