<template>
  <section id="linebot-chat-admin" style="width: 80vw">
    <mu-container>
      <mu-row gutter>
        <mu-col span="3">
          <mu-date-input label="起始日期" v-model="startDate" full-width landscape></mu-date-input>
        </mu-col>
        <mu-col span="3">
          <mu-date-input label="截止日期" v-model="expiryDate" full-width landscape></mu-date-input>
        </mu-col>
        <mu-col span="6">
          <SearchLineUser :on-searched-fn="retrieveSpecificUserProfile"></SearchLineUser>
        </mu-col>
      </mu-row>
      <mu-row v-show="isShowSearchResult">
        <mu-col span="12">
          <div class="vgt-global-search vgt-clearfix">
            <div class="vgt-global-search__input vgt-pull-left">
              <span class="input__icon">
                <div class="magnifying-glass"></div>
              </span>
              <input type="text" placeholder="鍵入 Enter 搜尋訊息中關鍵字"
                     class="vgt-input vgt-pull-left" v-model="searchTerm">
            </div>
            <div class="vgt-global-search__actions vgt-pull-right"></div>
          </div>
          <vue-good-table :columns="headerInfo" :rows="messages"
                          :search-options="{
                            enabled: true,
                            externalQuery: searchTerm
                          }"
                          :pagination-options="paginationOptions"
                          styleClass="vgt-table condensed">
            <template slot="table-row" slot-scope="props">
              <div v-if="props.row['ehanlin'] === true" style="color: #004ec4; font-weight: 500">
                {{ props.row[props.column.field] }}
              </div>
              <div v-else>
                {{ props.row[props.column.field] }}
              </div>
            </template>
          </vue-good-table>
        </mu-col>
      </mu-row>
    </mu-container>
  </section>
</template>

<script>
  import SearchLineUser from '@/components/SearchLineUser'
  import { db } from '@/modules/firebase-config'

  export default {
    name: 'Admin',
    data () {
      const vueModel = this
      return {
        startDate: vueModel.$dayjs().format('YYYY-MM-DD'),
        expiryDate: vueModel.$dayjs().format('YYYY-MM-DD'),
        searchTerm: '',
        isShowSearchResult: false,
        messages: [],
        headerInfo: [
          {
            label: '對象',
            field: 'name',
            width: '20vw',
            thClass: 'table-header'
          },
          {
            label: '訊息',
            field: 'text',
            thClass: 'table-header'
          }
        ],
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

        await vueModel.retrieveMessages(lineUserId)
        vueModel.searchTerm = ''
        vueModel.isShowSearchResult = true
      },

      async retrieveMessages (lineUserId) {
        const vueModel = this
        const messageQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .where('updateTime', '>=', vueModel.$dayjs(vueModel.startDate).startOf('day').toDate())
          .where('updateTime', '<=', vueModel.$dayjs(vueModel.expiryDate).endOf('day').toDate())
          .orderBy('updateTime', 'desc')
          .limit(1500)
          .get()

        let messages = []
        messageQuerySnapshot.forEach(messageDoc => {
          const message = messageDoc.data()
          const messageInfo = {
            name: message.ehanlinCustomerService ?
              message.ehanlinCustomerService.name : vueModel.lineUserName,
            text: message.text
          }

          if (message.ehanlinCustomerService) {
            messageInfo['ehanlin'] = true
          }
          messages.push(messageInfo)
        })
        vueModel.messages = messages
      }
    }
  }
</script>

<style lang="less">
  @import '../static/less/modal.less';

  #linebot-chat-admin {
    .mu-input-label {
      font-size: 19px;
      font-weight: 700;
    }

    .table-header {
      background: white;
      font-weight: 900;
    }

    .vgt-global-search {
      background: #002e6f78;
    }

    .vgt-wrap__footer {
      color: #45464a;
      padding: 1em;
      border: 0;
      background: #fffef6;

      .footer__row-count__label {
        color: #45464a;
      }

      .footer__navigation__page-btn {
        color: darkblue;
      }
    }
  }
</style>