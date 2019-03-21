<template>
  <div>
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

</style>
