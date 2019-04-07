<template>
  <section style="width: 80vw">
    <mu-container>
      <mu-row>
        <mu-col span="12">
          <SearchLineUser :on-searched-fn="retrieveSpecificUserProfile"></SearchLineUser>
          <vue-good-table v-show="isShowSearchResult"
                          :columns="messagesInfo" :rows="messages"
                          :search-options="searchOptions"
                          :pagination-options="paginationOptions">
          </vue-good-table>
        </mu-col>
      </mu-row>

    </mu-container>
  </section>
</template>

<script>
  // import { VueGoodTable } from 'vue-good-table'
  import SearchLineUser from '@/components/SearchLineUser'
  import { db } from '@/modules/firebase-config'

  export default {
    name: 'Admin',
    data () {
      return {
        lineUserName: '',
        isShowSearchResult: false,
        messages: [],
        messagesInfo: [
          {
            label: '對象',
            field: 'name'
          },
          {
            label: '訊息',
            field: 'text'
          }
        ],
        searchOptions: {
          enabled: true,
          trigger: 'enter',
          skipDiacritics: true,
          placeholder: '搜尋訊息中關鍵字'
        },
        paginationOptions: {
          enabled: true,
          mode: 'pages',
          perPage: 30,
          position: 'top',
          perPageDropdown: [30, 50],
          dropdownAllowAll: false,
          nextLabel: '下一頁',
          prevLabel: '上一頁',
          rowsPerPageLabel: '每頁筆數',
          pageLabel: ''
        },
        chatRef: db.collection('Chat'),
      }
    },

    components: {
      SearchLineUser
    },

    methods: {
      retrieveSpecificUserProfile: async function (lineUserId) {
        const vueModel = this
        const chatDocSnapshot = await vueModel.chatRef.doc(lineUserId).get()
        const searchedUserProfile = chatDocSnapshot.data()
        vueModel.lineUserName = searchedUserProfile.lineUserName

        console.log(lineUserId)
        await vueModel.retrieveMessages(lineUserId)
        vueModel.isShowSearchResult = true
      },

      async retrieveMessages (lineUserId) {
        const vueModel = this
        const halfYearsAgo = new Date(Date.now() - (604800000 * 24))
        const messageQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .where('updateTime', '>', halfYearsAgo)
          .orderBy('updateTime', 'desc')
          .limit(1500)
          .get()

        let messages = []
        messageQuerySnapshot.forEach(messageDoc => {
          const message = messageDoc.data()
          messages.push({
            name: message.ehanlinCustomerService ?
              message.ehanlinCustomerService.name : vueModel.lineUserName,
            text: message.text
          })
        })
        vueModel.messages = messages
      },
    },
  }
</script>

<style scoped>

</style>