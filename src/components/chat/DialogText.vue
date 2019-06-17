<template>
  <article id="dialog-text">
    <mu-container>
      <mu-row id="dialog-input"
              @dragenter="dragFileEnterTarget" @dragleave="dragFileLeaveTarget"
              @drop="dragFileToUpload" @dragover.prevent>
        <mu-flex fill justify-content="between">
          <section class="dialog-box" v-show="!isPreviewImage">
            <mu-text-field v-model="messageText"
                           multi-line full-width :rows="3" :rows-max="3"
                           @keypress.enter.exact="pushChatMessage($event, specificLineUser, {
                            messageText: messageText,
                            emojisUnicode: emojisUnicode
                           })"
                           underline-color="#004ec4">
            </mu-text-field>
          </section>
          <!-- 預覽欲傳送至使用者之圖片 (已上傳至 AWS)-->
          <section class="dialog-box" v-show="isPreviewImage">
            <mu-circular-progress style="margin-top: 20px;" :size="36"
                                  v-show="isShowImageProgress">
            </mu-circular-progress>
            <img ref="chat-image-preview"
                 :class="{ 'chat-image-preview': originalImageUrl, 'line-sticker-preview': lineSticker.path }"
                 :src="originalImageUrl || lineSticker.path">
          </section>

          <input ref="upload-image" type="file" accept="image/*" style="display: none;"
                 @click="clear" @change="selectFileToUpload">
          <mu-icon class="image-control-icon" v-show="isPreviewImage" size="30" value="delete_forever"
                   @click="clear"></mu-icon>
          <mu-icon class="image-control-icon" v-show="isPreviewImage" size="27" value="send"
                   @click="determinePushChatMessage"></mu-icon>
          <mu-flex direction="column" style="margin-top: -15px;">
            <LineStickerEmojiButton></LineStickerEmojiButton>
            <mu-icon class="image-control-icon" size="27" value="add_photo_alternate"
                     @click="triggerUploadImage"></mu-icon>
          </mu-flex>
        </mu-flex>
      </mu-row>
    </mu-container>
  </article>
</template>

<script>
  import store from '@/store/store'
  import { mapState, mapActions } from 'vuex'
  import { ChatRoomText } from '@/modules/modal-text'
  import { firebase, db, storage } from '@/modules/firebase-config'
  import MessageCategory from '@/modules/message-category'
  import LineStickerEmojiButton from '@/components/chat/LineStickerEmojiButton'

  export default {
    store,
    name: 'DialogText',
    data () {
      return {
        messageText: '',
        isPreviewImage: false,
        isShowImageProgress: false,
        originalImageUrl: '',
        previewImageUrl: '',
        emojisUnicode: []
      }
    },

    props: {
      specificLineUser: ''
    },

    components: {
      LineStickerEmojiButton
    },

    computed: {
      ...mapState('loginUser', ['loginUserInfo']),
      ...mapState('lineStickerEmoji', ['lineEmoji', 'lineSticker'])
    },

    watch: {
      lineEmoji (objectSelf) {
        const vueModel = this
        if (objectSelf.expression) {
          vueModel.messageText += objectSelf.expression
          vueModel.emojisUnicode.push(objectSelf.unicode)
          vueModel.$nextTick(() => {
              vueModel.assignLineEmojiAction(Object.create(null))
            }
          )
        }
      },

      lineSticker (objectSelf) {
        const vueModel = this
        if (objectSelf.stickerId) {
          vueModel.isPreviewImage = true
        }
      }
    },

    mounted () {
      const vueModel = this
      vueModel.messageRef = db.collection(`Chat/${vueModel.specificLineUser}/Message`)
      vueModel.storageRef = storage.ref('/images/')
    },

    methods: {
      ...mapActions('lineStickerEmoji', ['assignLineEmojiAction', 'assignLineStickerAction']),
      ...{
        triggerUploadImage () {
          const vueModel = this
          vueModel.$refs['upload-image'].click()
        },

        dragFileEnterTarget (event) {
          const vueModel = this
          event.currentTarget.classList.add('drag-enter')

          /* 紀錄拖曳檔案時，最後進入的 target */
          vueModel.lastHierarchyDragTarget = event.target
        },

        dragFileLeaveTarget (event) {
          const vueModel = this
          if (vueModel.lastHierarchyDragTarget === event.target) {
            event.currentTarget.classList.remove('drag-enter')
          }
        },

        async uploadImage (fileName, imageFile, completeFn) {
          const vueModel = this
          const metadata = {
            contentType: imageFile.type
          }

          try {
            await vueModel.storageRef
              .child(fileName)
              .put(imageFile, metadata)
              .then(completeFn)
          } catch (error) {
            console.error(error.message)
            vueModel.$modal.show({
              text: ChatRoomText.UPLOAD_IMAGE_FAILED
            })
          }
        },

        async paintCanvas (originalImageFile) {
          const vueModel = this
          const fileName = `${Math.floor(Date.now() / 1000)}_${originalImageFile.name}`
          let reader

          vueModel.isPreviewImage = true
          vueModel.isShowImageProgress = true

          await vueModel.uploadImage(fileName, originalImageFile, async uploadSnapshot => {
            vueModel.originalImageUrl = await uploadSnapshot.ref.getDownloadURL()
            vueModel.isShowImageProgress = false
          })

          reader = new FileReader()
          reader.readAsDataURL(originalImageFile)
          reader.onload = event => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
              let canvasWidth, canvasHeight, canvasElement, context
              if (img.width <= 240 && img.height <= 240) {
                canvasWidth = img.width
                canvasHeight = img.height
              } else {
                /* 縮小比例重新繪製圖片 */
                canvasWidth = (img.width > img.height) ? 240 : img.width / (img.height / 240)
                canvasHeight = (img.height > img.width) ? 240 : img.height / (img.width / 240)
              }
              canvasElement = document.createElement('canvas')
              canvasElement.width = canvasWidth
              canvasElement.height = canvasHeight

              context = canvasElement.getContext('2d')
              context.drawImage(img, 0, 0, canvasWidth, canvasHeight)
              context.canvas.toBlob(async blob => {
                const smallFileName = `small_${Math.floor(Date.now() / 1000)}_${originalImageFile.name}`
                const smallFile = new File([blob], smallFileName, {
                  type: originalImageFile.type,
                  lastModified: Date.now()
                })
                await vueModel.uploadImage(smallFileName, smallFile, async uploadSnapshot => {
                  vueModel.previewImageUrl = await uploadSnapshot.ref.getDownloadURL()
                })
              }, originalImageFile.type, 1)
            }
          }

          reader.onerror = vueModel.$modal.show.bind(vueModel.$modal.show,
            {
              text: ChatRoomText.PAINTING_CANVAS_FAILED
            }
          )
        },

        dragFileToUpload (event) {
          const vueModel = this
          let originalImageFile
          event.preventDefault()
          event.currentTarget.classList.remove('drag-enter')

          originalImageFile = event.dataTransfer.files[0]
          vueModel.paintCanvas(originalImageFile)
        },

        selectFileToUpload (event) {
          const vueModel = this
          let originalImageFile
          originalImageFile = event.target.files[0]
          vueModel.paintCanvas(originalImageFile)
        },

        clear () {
          const vueModel = this
          vueModel.messageText = ''
          vueModel.emojisUnicode = []
          vueModel.isPreviewImage = false
          vueModel.originalImageUrl = ''
          vueModel.previewImageUrl = ''
          vueModel.$refs['upload-image'].value = ''
          vueModel.assignLineEmojiAction(Object.create(null))
          vueModel.assignLineStickerAction(Object.create(null))
        },

        async createMessage (
          {
            messageText = '使用者傳送一張圖片',
            imageUrl = ''
          } = {}) {
          const vueModel = this
          let updateTime = firebase.firestore.Timestamp.fromDate(new Date())
          let loginUserInfo = vueModel.loginUserInfo
          let message = {
            text: messageText,
            updateTime: updateTime,
            read: true,
            ehanlinCustomerService: {
              account: loginUserInfo.email,
              name: loginUserInfo.name,
              avatar: loginUserInfo.avatar
            }
          }

          if (imageUrl) {
            message.imageUrl = imageUrl
          }

          await vueModel.messageRef.add(message)
        },

        async pushChatMessage (event, lineUserId, {
          messageText = '',
          // image
          originalImageUrl = '',
          previewImageUrl = '',

          // Line sticker
          packageId = '',
          stickerId = '',

          emojisUnicode = [],
          messageCategory = MessageCategory.TEXT
        } = {}) {
          const vueModel = this
          if (messageText.trim() === '') {
            vueModel.$modal.show({
              text: ChatRoomText.MESSAGE_EMPTY
            })
          }
          event.preventDefault()

          try {
            await vueModel.axios({
                method: 'post',
                url: 'https://www.ehanlin.com.tw/linebot/admin/pushChatMessage',
                data: {
                  lineUserId: lineUserId,
                  messageText: messageText,
                  originalImageUrl: originalImageUrl,
                  previewImageUrl: previewImageUrl,
                  packageId: packageId,
                  stickerId: stickerId,
                  emojisUnicode: emojisUnicode,
                  messageCategory: messageCategory
                }
              })

            await vueModel.createMessage({
              messageText: messageText,
              imageUrl: originalImageUrl || vueModel.lineSticker.path
            })
          } catch (error) {
            if (error.response) {
              const {
                status,
                statusText
              } = error.response
              console.error(`Fail to send message: ${status} ${statusText}`)
            }
            vueModel.$modal.show({
              text: ChatRoomText.MESSAGE_SENT_FAILED
            })
          }
          vueModel.clear()
        },

        determinePushChatMessage (event) {
          const vueModel = this

          if (vueModel.originalImageUrl && !vueModel.lineSticker.path) {
            vueModel.pushChatMessage(event, vueModel.specificLineUser,
              {
                messageText: '使用者傳送一張圖片',
                originalImageUrl: vueModel.originalImageUrl,
                previewImageUrl: vueModel.previewImageUrl,
                messageCategory: MessageCategory.IMAGE
              })
          } else if (!vueModel.originalImageUrl && vueModel.lineSticker.path) {
            vueModel.pushChatMessage(event, vueModel.specificLineUser,
              {
                messageText: '使用者傳送貼圖',
                packageId: vueModel.lineSticker.packageId,
                stickerId: vueModel.lineSticker.stickerId,
                messageCategory: MessageCategory.STICKER
              })
          }
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  #dialog-text {
    padding: 5px;

    #dialog-input {
      background-color: #f1f7fe;

      &.drag-enter {
        background-color: #EFFCF0 !important;
      }

      .dialog-box {
        display: flex;
        width: 100%;
        min-height: 80px;
        align-items: center;
        margin-left: 3px;

        .mu-input {
          margin-bottom: -6px;
        }

        img.chat-image-preview {
          width: 110px;
          object-fit: contain;
        }

        img.line-sticker-preview {
          width: 50px;
          object-fit: contain;
        }
      }
    }

    .image-control-icon {
      position: relative;
      top: 26px;
      left: -5px;
      cursor: pointer;
    }
  }
</style>