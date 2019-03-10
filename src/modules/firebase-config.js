import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'

const config = {
  apiKey: "AIzaSyACd0utVIIjEO6voLC2NaGDL6RKHa1-0EA",
  authDomain: "ehanlinlinebotchat.firebaseapp.com",
  databaseURL: "https://ehanlinlinebotchat.firebaseio.com",
  projectId: "ehanlinlinebotchat",
  storageBucket: "ehanlinlinebotchat.appspot.com",
  messagingSenderId: "21244896240"
};
firebase.initializeApp(config)

const db = firebase.firestore()
const auth = firebase.auth()
const storage = firebase.storage()

export {
  firebase,
  db,
  auth,
  storage
}