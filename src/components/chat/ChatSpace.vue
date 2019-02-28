<template>
  <div id="space" class="layout">
    <Layout>
      <Sider class="sider" :width="siderWidth" breakpoint="md"
             :collapsible="isCollapsible" :collapsed-width="0" v-model="isCollapsed">
        <UsersList></UsersList>
        <div slot="trigger"></div>
      </Sider>
      <Layout>
        <Content class="content">
          <ChatRoom></ChatRoom>
        </Content>
      </Layout>
    </Layout>
  </div>
</template>

<script>
  import UsersList from './ChatUsersList'
  import ChatRoom from './ChatRoom'

  export default {
    name: 'Space',
    components: {
      UsersList,
      ChatRoom
    },
    data () {
      return {
        isCollapsible: true,
        isCollapsed: false
      }
    },
    computed: {
      siderWidth () {
        if (window.innerWidth < window.innerHeight) {
          return window.innerWidth
        } else {
          return '280'
        }
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
      min-height: 90vh;
    }
  }

</style>