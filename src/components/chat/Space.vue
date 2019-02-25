<template>
  <div id="space" class="layout">
    <Layout>
      <Sider class="sider" width="300" breakpoint="md"
             :collapsible="isCollapsible" :collapsed-width="78" v-model="isCollapsed">
        <UsersList></UsersList>
      </Sider>
      <Layout>
        <Content class="content">

        </Content>
      </Layout>
    </Layout>
  </div>
</template>

<script>
  import UsersList from './UsersList'

  export default {
    name: 'Space',
    components: {
      UsersList
    },
    data () {
      return {
        isCollapsible: false,
        isCollapsed: false
      };
    },
    computed: {
      menuitemClasses: function () {
        return [
          'menu-item',
          this.isCollapsed ? 'collapsed-menu' : ''
        ]
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