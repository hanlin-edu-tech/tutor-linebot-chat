<template>
  <section id="dialog">
    <mu-flex v-for="(messageInfo, id, index) in messages" :key="id"
             :class="determineDialogLayout['flex'][index]"
             :justify-content="determineDialogLayout['align'][index]">
      <mu-flex class="dialog-row" direction="column" :align-items="determineDialogLayout.align[index]">
        <div class="dialog-avatar">
          <mu-avatar :size="37">
            <img src="../../static/img/ehanlin.png">
          </mu-avatar>
          {{ messageInfo.lineUserName }}
        </div>
        <article :class="determineDialogLayout.block[index]">
          {{ messageInfo.text }}
        </article>
      </mu-flex>
    </mu-flex>
  </section>
</template>

<script>
  import { firebase, db } from '../../modules/firebase-config'

  export default {
    name: 'ChatRoom',
    data () {
      return {
        messages: []
      }
    },
    computed: {
      determineDialogLayout () {
        let vueModel = this
        let dialogLayout = {
          align: [],
          flex: [],
          block: []
        }

        for(let id in vueModel.messages) {
          let messageInfo = vueModel.messages[id]
          if (!messageInfo['ehanlin']) {
            dialogLayout.align.push('start')
            dialogLayout.flex.push('dialog-flex-left')
            dialogLayout.block.push('dialog-block-user')
          } else {
            dialogLayout.align.push('end')
            dialogLayout.flex.push('dialog-flex-right')
            dialogLayout.block.push('dialog-block-ehanlin')
          }
        }

        // Object.keys(vueModel.messages).forEach((id, index) => {
        //   console.log(messageInfo)
        //   if (!messageInfo['ehanlin']) {
        //     dialogLayout.align.push('start')
        //     dialogLayout.flex.push('dialog-flex-left')
        //     dialogLayout.block.push('dialog-block-user')
        //   } else {
        //     dialogLayout.align.push('end')
        //     dialogLayout.flex.push('dialog-flex-right')
        //     dialogLayout.block.push('dialog-block-ehanlin')
        //   }
        // })
        console.log(dialogLayout)
        return dialogLayout
      },

      flex () {
        let vueModel = this
        return Object.keys(vueModel.messages).map((id, index) =>
          !vueModel.messages[id]['ehanlin'] ? 'dialog-flex-left' : 'dialog-flex-right')
      }
    },
    firestore () {
      return {
        messages: {
          ref: db.collection('Messages'),
          objects: true,
          // resolve: messages => {
          //   let vueModel = this
          //   for (let id in messages) {
          //     let messageInfo = messages[id]
          //     if (!messageInfo.ehanlin) {
          //       vueModel.lineUserMessages.push(messageInfo)
          //     }
          //   }
          // },
          reject: error => {
            console.error(error)
          }
        },
      }
    }
  }
</script>

<style lang="less" scoped>
  #dialog {
    font-size: 13px;

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
    }

    .dialog-avatar {
      display: inline-block;
      margin-bottom: 3px;
      font-weight: 900;
    }

    .dialog {
      background-color: #004ec4;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: white;
      font-weight: 500;
    }

    .dialog-block-user {
      background-color: #004ec4;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: white;
      font-weight: 500;
    }

    .dialog-block-ehanlin {
      background-color: #f1f7fe;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: #004ec4;
      font-weight: 500;
    }
  }
</style>