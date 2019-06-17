import authConfig from '@/modules/firebase-auth'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'

firebase.initializeApp(authConfig)

const db = firebase.firestore()
const auth = firebase.auth()
const storage = firebase.storage()

export {
  firebase,
  db,
  auth,
  storage
}