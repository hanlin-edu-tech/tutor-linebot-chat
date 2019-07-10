<template>
  <div id="search-line-user">
    <mu-flex align-items="center">
      <mu-text-field label="按 Enter 以使用者識別搜尋" v-model="identity" full-width
                     action-icon="search" @keyup.enter="retrieveSpecificLineUser"></mu-text-field>
      <mu-icon size="22" value="cancel" @click="cancelSearch()"></mu-icon>
    </mu-flex>
  </div>
</template>

<script>
  import { IdentityText } from '@/modules/modal-text'
  import { db } from '@/modules/firebase-config'

  export default {
    name: 'SearchLineUser',
    data () {
      return {
        identity: ''
      }
    },

    props: {
      onSearchedFn: Function,
      onCancelFn: Function
    },

    methods: {
      async retrieveSpecificLineUser () {
        const vueModel = this
        const chatQuerySnapshot = await db.collection('Chat')
          .where('identity', '==', vueModel.identity)
          .get()

        let lineUserId = ''
        if (chatQuerySnapshot.empty) {
          vueModel.$modal.show({
            text: IdentityText.NOT_FOUND
          })
          return
        }

        chatQuerySnapshot.forEach(identityDoc => {
          lineUserId = identityDoc.id
        })

        vueModel.onSearchedFn(lineUserId)
      },

      cancelSearch () {
        const vueModel = this
        vueModel.identity = ''
        vueModel.onCancelFn()
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