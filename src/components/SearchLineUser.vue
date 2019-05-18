<template>
  <div id="search-line-user">
    <mu-flex align-items="center">
      <mu-text-field label="以使用者識別搜尋對話" v-model="identity" full-width
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
        const identityQuerySnapshot = await db.collection('Identity')
          .where('identity', '==', vueModel.identity)
          .get()

        let lineUserId = ''
        if (identityQuerySnapshot.empty) {
          vueModel.$modal.show({
            text: IdentityText.NOT_FOUND
          })
          return
        }

        identityQuerySnapshot.forEach(identityDoc => {
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