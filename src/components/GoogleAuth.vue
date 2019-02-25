<template>
  <section>
    <mu-flex justify-content="center">
      <img src="../static/img/ehanlin.png">
    </mu-flex>
    <mu-flex justify-content="center">
      <mu-button large color="primary" @click="authenticate">
        以 Google 帳號登入
      </mu-button>
    </mu-flex>
  </section>
</template>

<script>
  import { firebase, db, auth } from '../modules/firebase-config'
  import 'firebase/auth'
  import { mapActions } from 'vuex'

  export default {
    name: 'GoogleAuth',
    data () {
      return {
        authorizedEmails: []
      }
    },

    methods: Object.assign(
      {
        async authenticate () {
          auth.useDeviceLanguage()
          try {
            let provider = new firebase.auth.GoogleAuthProvider()
            let loginResult = await auth.signInWithPopup(provider)
            let querySnapshot = await db.collection('AuthorizedUsers').get()
            if(!querySnapshot) {
              console.log('使用者沒有權限')
              auth.signOut()
              return
            }

            querySnapshot.forEach(doc =>
              this.authorizedEmails.push(doc.data().email)
            )

            if (loginResult.user) {
              let loginUserEmail = loginResult.user.email
              console.log(loginUserEmail)
              if (loginUserEmail && this.authorizedEmails.includes(loginUserEmail)) {
                this.assignLoginUserEmailAction(loginUserEmail)
                this.$router.push(`/chat/space`)
              } else {

              }
            }
          } catch (error) {
            console.log(error)
            console.log('使用者沒有權限')
            auth.signOut()
          }

        }
      },

      mapActions('loginUser', ['assignLoginUserEmailAction'])
    )
  }
</script>

<style lang="less" scoped>
  .login {
    width: 350px;
    height: 350px;

    .mu-button, span {
      font-size: 18px;
    }
  }
</style>