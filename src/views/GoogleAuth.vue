<template>
  <section id="login">
    <mu-flex justify-content="center">
      <img src="../static/img/ehanlin.png">
    </mu-flex>
    <mu-flex justify-content="center">
      <mu-button large color="primary" @click="authenticate">
        以 ehanlin 帳號登入
      </mu-button>
    </mu-flex>
  </section>
</template>

<script>
  import store from '@/store/store'
  import { mapActions } from 'vuex'
  import { db, firebase, auth } from '@/modules/firebase-config'
  import '@firebase/auth'
  import { AuthText } from '@/modules/modal-text'

  export default {
    store,
    name: 'GoogleAuth',
    data () {
      return {
        authorizedEmails: []
      }
    },

    methods: {
      ...mapActions('loginUser', ['assignLoginUserInfoAction']),
      ...{
        async authenticate () {
          const vueModel = this
          auth.useDeviceLanguage()
          try {
            const provider = new firebase.auth.GoogleAuthProvider()
            const loginResult = await auth.signInWithPopup(provider)
            const user = loginResult.user

            await vueModel.authenticateUserByAccessFirestore()
            vueModel.assignLoginUserInfoAction({
              email: user.email,
              name: user.displayName,
              avatar: user.photoURL
            })
            vueModel.$router.push(`/chat/space`)
          } catch (error) {
            vueModel.$modal.show({
              text: AuthText.WARNING
            })
            auth.signOut()
          }
        },

        async authenticateUserByAccessFirestore () {
          await db.collection('Identity').get()
        }
      }
    }
  }
</script>

<style lang="less">
  @import '../static/less/modal.less';
</style>