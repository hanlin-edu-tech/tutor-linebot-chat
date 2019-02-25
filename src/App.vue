<template>
  <div id="app">
    <mu-container>
      <router-view></router-view>
    </mu-container>
  </div>
</template>

<script>
  import { util } from './modules/util'

  util.arrayLast()

  export default {
    name: 'app',
  }
</script>


<style lang="less" scoped>
  .dialog {
    padding: 20px;
    width: 300px;
    word-break: break-all;
  }
</style>
