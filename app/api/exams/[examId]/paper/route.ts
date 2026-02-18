import { NextResponse } from 'next/server'

export async function GET(request: Request, context: { params: Promise<{ examId: string }> }) {
  const { examId } = await context.params

  if (examId === 'mock-exam-001' || examId === 'mock-exam-future') {
    return NextResponse.json({
      questions: [
        {
          id: 'q1',
          text: 'Explain the concept of Proof of Work in blockchain technology.',
          type: 'text',
          marks: 10
        },
        {
          id: 'q2',
          text: 'Which of the following is NOT a consensus mechanism?',
          type: 'mcq',
          marks: 5,
          options: [
            'Proof of Work',
            'Proof of Stake',
            'Proof of History',
            'Proof of Coffee'
          ]
        },
        {
          id: 'q3',
          text: 'Describe the CAP theorem and its implications for distributed systems.',
          type: 'text',
          marks: 15
        }
      ],
      duration: 60,
      startTime: new Date().toISOString(), // Just for mock consistency
      endTime: new Date(Date.now() + 3600000).toISOString()
    })
  }

  return NextResponse.json(
    { error: 'Exam not found' },
    { status: 404 }
  )
}
