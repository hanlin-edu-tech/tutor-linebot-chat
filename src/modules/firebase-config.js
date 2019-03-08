import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'

const config = {
  apiKey: 'AIzaSyB6vCtgA3G0l1UaeL1VpthGfnLldfT1mXY',
  authDomain: 'friendlychat-a97f5.firebaseapp.com',
  databaseURL: 'https://friendlychat-a97f5.firebaseio.com',
  projectId: 'friendlychat-a97f5',
  storageBucket: 'friendlychat-a97f5.appspot.com',
  messagingSenderId: '847240468324'
}
firebase.initializeApp(config)

const db = firebase.firestore()
const auth = firebase.auth()

export {
  firebase,
  db,
  auth
}