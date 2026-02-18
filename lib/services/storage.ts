import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { ProctoringEvent } from '../types'

interface VeridictDB extends DBSchema {
  answers: {
    key: [string, string] // [examId, questionId]
    value: {
      examId: string
      questionId: string
      value: string
      savedAt: string
      changeCount: number
      synced: number // 0 = false, 1 = true
    }
  }
  proctoring_logs: {
    key: number
    value: {
      examId: string
      type: string
      timestamp: string
      metadata?: string
      synced: number
    }
    indexes: { 'by-exam': string }
  }
}

const DB_NAME = 'veridict_student_db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<VeridictDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VeridictDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('answers')) {
          db.createObjectStore('answers', { keyPath: ['examId', 'questionId'] })
        }
        if (!db.objectStoreNames.contains('proctoring_logs')) {
          const store = db.createObjectStore('proctoring_logs', { autoIncrement: true })
          store.createIndex('by-exam', 'examId')
        }
      },
    })
  }
  return dbPromise
}

export const storageService = {
  async saveAnswer(examId: string, questionId: string, value: string) {
    const db = await getDB()
    const tx = db.transaction('answers', 'readwrite')
    const existing = await tx.store.get([examId, questionId])
    
    await tx.store.put({
      examId,
      questionId,
      value,
      savedAt: new Date().toISOString(),
      changeCount: (existing?.changeCount || 0) + 1,
      synced: 0
    })
    await tx.done
  },

  async loadAnswers(examId: string) {
    const db = await getDB()
    // IDB getAll doesn't filter by partial key easily without index.
    // For simplicity, getAll and filter in memory (expecting < 100 answers per exam).
    const all = await db.getAll('answers')
    const relevant = all.filter((a) => a.examId === examId)
    
    // Transform to record format expected by store
    const record: Record<string, { value: string; savedAt: string }> = {}
    for (const item of relevant) {
      record[item.questionId] = { value: item.value, savedAt: item.savedAt }
    }
    return record
  },

  async logProctoringEvent(examId: string, event: ProctoringEvent) {
    const db = await getDB()
    await db.add('proctoring_logs', {
      examId,
      type: event.type,
      timestamp: event.timestamp,
      metadata: event.metadata,
      synced: 0
    })
  },

  async getUnsyncedAnswers() {
    const db = await getDB()
    // Ideally use index on 'synced', but for prototype just filter
    const all = await db.getAll('answers')
    return all.filter((a) => a.synced === 0)
  },

  async markAnswersSynced(keys: [string, string][]) {
    const db = await getDB()
    const tx = db.transaction('answers', 'readwrite')
    for (const key of keys) {
      const record = await tx.store.get(key)
      if (record) {
        record.synced = 1
        tx.store.put(record)
      }
    }
    await tx.done
  }
}
