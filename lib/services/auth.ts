import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Student } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<Student> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid

    const userDoc = await getDoc(doc(db, 'users', uid))

    if (!userDoc.exists()) {
      await signOut(auth)
      throw new Error('No user account found. Please contact your administrator.')
    }

    const data = userDoc.data()
    if (data.role !== 'STUDENT') {
      await signOut(auth)
      throw new Error('Access denied. This app is for students only.')
    }

    return {
      uid,
      email: credential.user.email ?? email,
      name: data.name ?? '',
      role: 'STUDENT'
    }
  },

  async register(name: string, email: string, password: string): Promise<Student> {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid

    // Create user document so role check passes on future logins
    await setDoc(doc(db, 'users', uid), {
      uid,
      studentId: uid,
      email,
      name,
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    })

    return {
      uid,
      email: credential.user.email ?? email,
      name,
      role: 'STUDENT'
    }
  },

  async logout(): Promise<void> {
    await signOut(auth)
  }
}
