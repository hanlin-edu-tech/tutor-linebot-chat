<template>
  <section id="chat-room">
    <mu-flex justify-content="center">
      <mu-circular-progress v-show="isLoading"
                            color="success" :stroke-width="7" :size="56"></mu-circular-progress>
    </mu-flex>
    <section v-show="!isLoading">
      <article id="dialog-content">
        <mu-flex v-for="(messageInfo, id) in messages" :key="id"
                 :class="!messageInfo.ehanlinCustomerService ? 'dialog-flex-left' : 'dialog-flex-right'"
                 :justify-content="!messageInfo.ehanlinCustomerService ? 'start' : 'end'">
          <mu-flex class="dialog-row" direction="column"
                   :align-items="!messageInfo.ehanlinCustomerService ? 'start' : 'end'">
            <mu-flex class="dialog-avatar" justify-content="start">
              <mu-avatar style="margin-right: 5px;" :size="37">
                <img :src="!messageInfo.ehanlinCustomerService
                ? lineUserAvatar : messageInfo.ehanlinCustomerService.avatar">
              </mu-avatar>
              <mu-flex direction="column" justify-content="start">
                <span class="dialog-time">{{ formatUpdateTime (messageInfo.updateTime) }}</span>
                <span class="dialog-owner">
                {{ !messageInfo.ehanlinCustomerService ? lineUserName : messageInfo.ehanlinCustomerService.name }}
                </span>
              </mu-flex>
            </mu-flex>
            <a v-show="messageInfo.imageUrl" :href="messageInfo.imageUrl" target="_blank">
              <img class="chat-image" :src="messageInfo.imageUrl">
            </a>
            <article v-show="!messageInfo.imageUrl"
                     :class="!messageInfo.ehanlinCustomerService ? 'dialog-text-block-user' : 'dialog-text-block-ehanlin'">
              <template v-for="line in messageInfo.text.split('\n')">{{ line }}<br /></template>
            </article>
          </mu-flex>
        </mu-flex>
      </article>
      <DialogText :specific-line-user="specificLineUser"></DialogText>
    </section>
  </section>
</template>

<script>
  import { ChatRoomText } from '@/modules/modal-text'
  import { db } from '@/modules/firebase-config'
  import DialogText from '@/components/chat/DialogText'

  export default {
    name: 'ChatRoom',
    components: {
      DialogText
    },

    data () {
      const vueModel = this
      return {
        isLoading: true,
        twoMonthAgo: vueModel.$dayjs().subtract(2, 'month').toDate(),
        messageText: '',
        messages: {},
        isPreviewImage: false,
        isShowImageProgress: false,
        originalImageUrl: ''
      }
    },

    props: {
      specificLineUser: '',
      lineUserName: '',
      lineUserAvatar: '',
    },

    async mounted () {
      const vueModel = this
      await vueModel.initial()
    },

    beforeDestroy () {
      const vueModel = this
      if (vueModel.cancelListening && typeof vueModel.cancelListening === 'function') {
        vueModel.cancelListening()
      }
    },

    methods: {
      async initial () {
        const vueModel = this
        try {
          vueModel.messageRef = db.collection(`Chat/${vueModel.specificLineUser}/Message`)
          await vueModel.retrieveMessages()
          vueModel.isLoading = false
        } catch (error) {
          console.error(error.message)
          vueModel.$modal.show({
            text: ChatRoomText.DISABLED
          })
        }
      },

      formatUpdateTime (updateTime) {
        const vueModel = this
        return vueModel.$dayjs(updateTime.toDate()).format('YYYY-MM-DD HH:mm:ss')
      },

      scrollBottom () {
        const dialogContentTarget = document.getElementById('dialog-content')
        dialogContentTarget.scrollTop = dialogContentTarget.scrollHeight
      },

      determineImageLoaded (imageUrl) {
        const vueModel = this

        if (imageUrl) {
          const lastChatImgTarget = [...document.querySelectorAll('img.chat-image')].last()
          const imageLoaded = () => {
            /*
             * 考量到有的圖片可能容量過大，所以在最後一個 img.chat-image 加載完成後，
             * 稍稍等待 0.5 秒，再移動聊天室捲軸至最下方
             */
            vueModel.$delay(500)
            vueModel.scrollBottom()
          }

          if (lastChatImgTarget.complete) {
            imageLoaded()
          } else {
            lastChatImgTarget.addEventListener('load', event => {
              imageLoaded()
              event.currentTarget.removeEventListener('load', () => {})
            })
          }
        } else {
          vueModel.scrollBottom()
        }
      },

      async retrieveMessages () {
        const vueModel = this
        if (!vueModel.specificLineUser) {
          throw 'LineUser is not found'
        }

        let messageQuerySnapshot = await vueModel.messageRef
          .where('updateTime', '>', vueModel.twoMonthAgo)
          .orderBy('updateTime', 'asc')
          .limit(250)
          .get()

        let messages = {}
        messageQuerySnapshot.forEach(messageDoc => {
          messages[messageDoc.id] = messageDoc.data()
        })
        vueModel.messages = messages

        await vueModel.listeningOnMessageAdded()
      },

      async listeningOnMessageAdded () {
        const vueModel = this
        vueModel.cancelListening = db.collection(`Chat/${vueModel.specificLineUser}/Message`)
          .where('updateTime', '>', vueModel.twoMonthAgo)
          .orderBy('updateTime', 'asc')
          .limit(250)
          .onSnapshot(
            async messageQuerySnapshot => {
              let newestMessageDoc
              let newestMessageChange = messageQuerySnapshot.docChanges().last()
              if (!newestMessageChange) {
                return
              }

              if (newestMessageChange.type === 'added') {
                newestMessageDoc = newestMessageChange.doc
                const newestMessageId = newestMessageDoc.id
                const newestMessage = newestMessageDoc.data()

                vueModel.$set(vueModel.messages, newestMessageId, newestMessage)
                vueModel.$nextTick(() => {
                  vueModel.determineImageLoaded(newestMessage.imageUrl)
                })
                await vueModel.updateMessagesToRead()
              }
            }
          )
      },

      async updateMessagesToRead () {
        const vueModel = this
        const unreadMessages = await vueModel.$bindCollectionAsObject('unreadMessages',
          vueModel.messageRef
            .where('read', '==', false))
        const batch = db.batch()
        const readMessagesIds = Object.keys(unreadMessages)
        if (readMessagesIds.length > 0) {
          readMessagesIds.forEach(id => {
            batch.update(vueModel.messageRef.doc(id), { read: true })
          })
        }
        await batch.commit()
      }
    }
  }
</script>

<style lang="less">
  #chat-room {
    font-size: 13px;

    #dialog-content {
      height: 78vh;
      overflow: scroll;

      .dialog-flex-left {
        margin-left: 20px;
        margin-top: 5px;
        margin-bottom: 5px;
      }

      .dialog-flex-right {
        margin-right: 10px;
        margin-top: 5px;
        margin-bottom: 5px;
      }

      .dialog-row {
        width: 55%;

        a > img.chat-image {
          min-width: 50px;
          max-width: 200px;
          object-fit: contain;
        }

        .dialog-avatar {
          margin-top: 10px;
          margin-bottom: 5px;

          .dialog-time {
            color: #6a6a6a;
            font-size: 11px;
            font-weight: 500;
          }

          .dialog-owner {
            font-size: 11px;
            font-weight: 900;
          }
        }

        .dialog-text-block-user {
          background-color: #004ec4;
          padding: 5px;
          border-radius: 3px;
          word-break: normal;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .dialog-text-block-ehanlin {
          background-color: #f1f7fe;
          padding: 5px;
          border-radius: 3px;
          word-break: normal;
          color: #004ec4;
          font-size: 14px;
          font-weight: 900;
        }
      }
    }
  }
</style>