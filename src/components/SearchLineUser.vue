<template>
  <div id="search-line-user">
    <mu-text-field label="搜尋使用者" v-model="identity" full-width
                   action-icon="search" @keyup.enter="retrieveSpecificLineUser"></mu-text-field>
  </div>
</template>

<script>
  import { db } from '@/modules/firebase-config'

  export default {
    name: 'SearchLineUser',
    data () {
      return {
        identity: ''
      }
    },

    props: {
      onSearchedFn: { type: Function },
    },

    methods: {
      async retrieveSpecificLineUser () {
        const vueModel = this
        const identityQuerySnapshot = await db.collection('Identity')
          .where('identity', '==', vueModel.identity)
          .get()

        let lineUserId = ''
        identityQuerySnapshot.forEach(identityDoc => {
          lineUserId = identityDoc.id
        })

        vueModel.onSearchedFn(lineUserId)
      }
    }
  }
</script>

<style lang="less">
  #search-line-user {
    .mu-input-label {
      font-size: 19px;
      font-weight: 700;
    }
  }
</style>