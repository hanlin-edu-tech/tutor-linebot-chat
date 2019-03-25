<template>
  <mu-container>
    <router-view></router-view>
  </mu-container>
</template>

<script>
  import { util } from './modules/util'

  util.arrayLast()

  export default {
    name: 'app',
  }
</script>