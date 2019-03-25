<template>
  <div id="space" class="layout">
    <Layout>
      <Sider class="sider" :width="siderWidth" breakpoint="md"
             :collapsible="isCollapsible" :collapsed-width="0" v-model="isCollapsed">
        <ChatUsersList @route-chat-room="routeChatRoom"></ChatUsersList>
        <div slot="trigger"></div>
      </Sider>
      <Layout>
        <Content class="content">
          <router-view></router-view>
        </Content>
      </Layout>
    </Layout>
  </div>
</template>

<script>
  import ChatUsersList from './ChatUsersList'
  import ChatRoom from './ChatRoom'
  import { db, auth } from '../../modules/firebase-config'
  import { mapState } from 'vuex'

  export default {
    name: 'ChatSpace',
    components: {
      ChatUsersList,
      ChatRoom
    },

    data () {
      return {
        isCollapsible: true,
        isCollapsed: false,
      }
    },

    computed: Object.assign(
      {
        siderWidth () {
          if (window.innerWidth < window.innerHeight) {
            return window.innerWidth
          } else {
            return '310'
          }
        }
      },
      mapState('loginUser', ['loginUserInfo'])
    ),

    mounted () {
      const vueModel = this
      if (Object.keys(vueModel.loginUserInfo).length === 0) {
        auth.signOut()
        vueModel.$router.replace(`/googleAuth`)
      }
    },

    methods: {
      delay (millisecond) {
        return new Promise(resolve => {
          setTimeout(resolve, millisecond)
        })
      },

      async routeChatRoom (messageInfo, lineUserId) {
        const vueModel = this
        vueModel.$router.replace({ path: `/chat/space/` })

        await vueModel.delay(300)
        vueModel.$router.replace(
          {
            name: 'ChatRoom',
            params: {
              specificLineUser: lineUserId,
              lineUserAvatar: messageInfo.lineUserAvatar,
              lineUserName: messageInfo.lineUserName,
            }
          }
        )
        await vueModel.delay(300)
        vueModel.$root.$emit('assign-line-user', lineUserId)
      },
    }
  }
</script>

<style lang="less" scoped>
  #space {
    .sider {
      background: #fff;
    }

    .content {
      margin: 20px;
      background: #fff;
      /*min-height: 90vh;*/
    }
  }

</style>