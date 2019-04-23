<template>
  <section id="space" class="layout">
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
  </section>
</template>

<script>
  import ChatUsersList from '@/components/chat/ChatUsersList'
  import ChatRoom from '@/components/chat/ChatRoom'
  import { mapActions } from 'vuex'

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

    computed: {
      siderWidth () {
        if (window.innerWidth < window.innerHeight) {
          return window.innerWidth
        } else {
          return '315'
        }
      }
    },

    mounted () {
      document.querySelector('.ivu-layout-sider-zero-width-trigger').innerHTML =
        '<span style="font-size: 15px;">收合</span>'

      const vueModel = this
      /* 還原訊息提醒之鈴鐺顏色 */
      vueModel.assignNotificationColorAction('#BFC9CA')
    },

    methods: Object.assign({
      async routeChatRoom (messageInfo, lineUserId, resetZeroing) {
        const vueModel = this
        vueModel.$router.replace({ path: `/chat/space/` })

        await vueModel.$delay(300)
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

        resetZeroing(lineUserId)

        if (window.innerWidth < 500) {
          vueModel.isCollapsed = true
        }
      }
    }, mapActions('reminder', ['assignNotificationColorAction']))
  }
</script>

<style lang="less" scoped>
  #space {
    .sider {
      background: #fff;
    }

    .content {
      margin: 10px 5px;
      background: #fff;
    }
  }

</style>