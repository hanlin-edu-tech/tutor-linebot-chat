import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'

const config = {
  apiKey: "AIzaSyBk-4Q04RLbZzzn2ml9KAUOEfVt6_eIcX4",
  authDomain: "ehanlin-linebot-chat.firebaseapp.com",
  databaseURL: "https://ehanlin-linebot-chat.firebaseio.com",
  projectId: "ehanlin-linebot-chat",
  storageBucket: "ehanlin-linebot-chat.appspot.com",
  messagingSenderId: "394962262744"
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