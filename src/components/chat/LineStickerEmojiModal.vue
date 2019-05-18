<template>
  <mu-container id="line-sticker-emoji">
    <mu-row>
      <mu-col span="5">
        <article class="line-emoji">
          <div v-for="lineEmoji in lineEmojis" :key="lineEmoji.img"
               @click="selectLineEmoji($event, lineEmoji)"
               :data-emoji-path="lineEmoji.path" :data-emoji-unicode="lineEmoji.unicode"></div>
        </article>
      </mu-col>
      <mu-col span="7">
        <article class="line-sticker">
          <div>
            <img :src="require('@/static/img/line-sticker/ok.png')" />
          </div>
          <div>
            <img :src="require('@/static/img/line-sticker/thank-you.png')" />
          </div>
          <div>
            <img :src="require('@/static/img/line-sticker/bye.png')" />
          </div>
          <div>
            <img :src="require('@/static/img/line-sticker/not-see.png')" />
          </div>
          <div>
            <img :src="require('@/static/img/line-sticker/sorry.png')" />
          </div>
          <div></div>
        </article>
      </mu-col>
    </mu-row>
  </mu-container>
</template>

<script>
  import store from '@/store/store'
  import { mapActions } from 'vuex'

  export default {
    store,
    name: 'LineStickerEmojiModal',
    data () {
      return {
        lineEmojis: [
          {
            expression: '(:love-heart:)',
            path: require('@/static/img/line-emoji/love-heart.png'),
            unicode: '0x100078'
          },
          {
            path: require('@/static/img/line-emoji/laugh.png'),
            unicode: '0x100079'
          },
          {
            path: require('@/static/img/line-emoji/cute.png'),
            unicode: '0x10007A'
          },
          {
            path: require('@/static/img/line-emoji/horrified.png'),
            unicode: '0x10007B'
          },
          {
            path: require('@/static/img/line-emoji/cry.png'),
            unicode: '0x10007C'
          },
          {
            path: require('@/static/img/line-emoji/oh-my-god.png'),
            unicode: '0x10007D'
          },
          {
            path: require('@/static/img/line-emoji/angry.png'),
            unicode: '0x10007E'
          },
          {
            path: require('@/static/img/line-emoji/rabbit-smile.png'),
            unicode: '0x10007F'
          },
          {
            path: require('@/static/img/line-emoji/rabbit-appreciate.png'),
            unicode: '0x100080'
          },
          {
            path: require('@/static/img/line-emoji/rabbit-kiss.png'),
            unicode: '0x100081'
          },
          {
            path: require('@/static/img/line-emoji/rabbit-ignore.png'),
            unicode: '0x100082'
          },
          {
            path: require('@/static/img/line-emoji/rabbit-frozen.png'),
            unicode: '0x100083'
          },
          {
            path: require('@/static/img/line-emoji/bear-shying.png'),
            unicode: '0x100084'
          },
          {
            path: require('@/static/img/line-emoji/bear-surprise.png'),
            unicode: '0x100085'
          },
          {
            path: require('@/static/img/line-emoji/bear-zzz.png'),
            unicode: '0x100086'
          },
          {
            path: require('@/static/img/line-emoji/james-nervous.png'),
            unicode: '0x100087'
          },
          {
            path: require('@/static/img/line-emoji/james-waiting.png'),
            unicode: '0x100088'
          },
          {
            path: require('@/static/img/line-emoji/james-scare.png'),
            unicode: '0x100089'
          },
          {
            path: require('@/static/img/line-emoji/james-pleasure.png'),
            unicode: '0x10008A'
          },
          {
            path: require('@/static/img/line-emoji/james-lovestruck.png'),
            unicode: '0x10008B'
          }
        ]
      }
    },
    methods: {
      ...mapActions('lineStickerEmoji',
        ['assignExpressionAction', 'assignLineStickerEmojiPathAction', 'assignEmojiUnicodeAction']),
      ...{
        selectLineEmoji (event, lineEmoji) {
          const vueModel = this
          const dataSet = event.currentTarget.dataset
          const emojiPath = dataSet.emojiPath
          const emojiUnicode = dataSet.emojiUnicode
          vueModel.$modal.remove()
          vueModel.assignExpressionAction(lineEmoji.expression)
          vueModel.assignLineStickerEmojiPathAction(lineEmoji.path)
          vueModel.assignEmojiUnicodeAction(lineEmoji.emojiUnicode)
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  #line-sticker-emoji {
    article.line-emoji {
      display: grid;
      grid-template-rows: repeat(5, 1fr);
      grid-template-columns: repeat(4, 1fr);
      height: 333px;
      width: auto;
      background: url('~@/static/img/line-emoji/overview.png') no-repeat;
      background-size: contain;

      div:hover {
        cursor: pointer;
      }
    }

    article.line-sticker {
      margin-left: 30px;
      margin-top: 60px;
      display: grid;
      grid-template-rows: repeat(2, 1fr);
      grid-template-columns: repeat(3, 1fr);

      div {
        display: flex;
        justify-content: center;

        & > img {
          height: 87px;
          object-fit: cover;
        }
      }
    }
  }
</style>