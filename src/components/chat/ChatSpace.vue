<template>
  <div id="space" class="layout">
    <Layout>
      <Sider class="sider" :width="siderWidth" breakpoint="md"
             :collapsible="isCollapsible" :collapsed-width="0" v-model="isCollapsed">
        <UsersList @retrieve-chat-messages="retrieveChatMessages"></UsersList>
        <div slot="trigger"></div>
      </Sider>
      <Layout>
        <Content class="content">
          <ChatRoom :lineUserId="lineUserId"></ChatRoom>
        </Content>
      </Layout>
    </Layout>
  </div>
</template>

<script>
  import UsersList from './ChatUsersList'
  import ChatRoom from './ChatRoom'
  import { auth } from '../../modules/firebase-config'
  import { mapState } from 'vuex'

  export default {
    name: 'Space',
    components: {
      UsersList,
      ChatRoom
    },

    data () {
      return {
        isCollapsible: true,
        isCollapsed: false,
        lineUserId: ''
      }
    },

    computed: Object.assign(
      {
        siderWidth () {
          if (window.innerWidth < window.innerHeight) {
            return window.innerWidth
          } else {
            return '280'
          }
        }
      },
      mapState('loginUser', ['loginUserInfo'])
    ),

    mounted () {
      let vueModel = this
      if (Object.keys(vueModel.loginUserInfo).length === 0) {
        auth.signOut()
        vueModel.$router.replace(`/googleAuth`)
      }
    },

    methods: {
      retrieveChatMessages (lineUserId) {
        let vueModel = this
        vueModel.lineUserId = lineUserId
      }
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