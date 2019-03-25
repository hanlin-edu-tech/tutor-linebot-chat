<template>
  <section id="login">
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
  import { firebase, db, auth } from '@/modules/firebase-config'
  import 'firebase/auth'
  import { mapActions } from 'vuex'
  import { showModal } from '@/modules/modal'

  export default {
    name: 'GoogleAuth',
    data () {
      return {
        authorizedEmails: [],
        warningText: '使用者沒有權限'
      }
    },

    methods: Object.assign(
      {
        async authenticate () {
          const vueModel = this
          auth.useDeviceLanguage()
          try {
            let provider = new firebase.auth.GoogleAuthProvider()
            let loginResult = await auth.signInWithPopup(provider)
            console.log(loginResult)
            let querySnapshot = await db.collection('AuthorizedUsers').get()
            let user = loginResult.user
            vueModel.assignLoginUserInfoAction({
              email: user.email,
              name: user.displayName,
              avatar: user.photoURL
            })
            vueModel.$router.push(`/chat/space`)
          } catch (error) {
            showModal(vueModel, '使用者沒有權限')
            auth.signOut()
          }
        },

        async validateEhanlinUser (loginResult) {
          const vueModel = this
          let querySnapshot = await db.collection('AuthorizedUsers').get()
          if (!querySnapshot) {
            console.log('使用者沒有權限')
            auth.signOut()
            return
          }

          querySnapshot.forEach(doc =>
            vueModel.authorizedEmails.push(doc.data().email)
          )

          if (loginResult.user) {
            let user = loginResult.user
            if (user.email && vueModel.authorizedEmails.includes(user.email)) {
              vueModel.assignLoginUserInfoAction({
                email: user.email,
                name: user.displayName,
                avatar: user.photoURL
              })
              vueModel.$router.push(`/chat/space`)
            } else {
              showModal(vueModel, '使用者沒有權限')
            }
          }
        }
      },

      mapActions('loginUser', ['assignLoginUserInfoAction'])
    )
  }
</script>

<style lang="less">
  @import '../static/less/modal.less';
</style>