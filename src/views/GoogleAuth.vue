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
  import { db, firebase, auth } from '@/modules/firebase-config'
  import '@firebase/auth'
  import store from '@/store/store'
  import { mapActions } from 'vuex'
  import showModal from '@/modules/modal'

  export default {
    store,
    name: 'GoogleAuth',
    data () {
      return {
        authorizedEmails: [],
        warningText: '使用者沒有權限'
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
            showModal(vueModel, vueModel.warningText)
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