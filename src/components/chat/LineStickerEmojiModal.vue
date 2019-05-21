<template>
  <mu-container id="line-sticker-emoji">
    <mu-row>
      <mu-col span="5">
        <article class="line-emoji">
          <div v-for="lineEmoji in lineEmojis" :key="lineEmoji.unicode"
               @click.once="selectLineEmoji($event, lineEmoji)">
          </div>
        </article>
      </mu-col>
      <mu-col span="7">
        <article class="line-sticker">
          <div v-for="lineSticker in lineStickers" :key="lineSticker.stickerId"
               @click.once="selectLineSticker($event, lineSticker)">
            <img :src="lineSticker.path" />
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
            path: require('@/static/img/line-emoji/moon-heart-eyes.png'),
            expression: '(:moon-heart-eyes:)',
            unicode: '0x100078'
          },
          {
            path: require('@/static/img/line-emoji/moon-laugh.png'),
            expression: '(:moon-laugh:)',
            unicode: '0x100079'
          },
          {
            path: require('@/static/img/line-emoji/moon-pleading.png'),
            expression: '(:moon-pleading:)',
            unicode: '0x10007A'
          },
          {
            path: require('@/static/img/line-emoji/moon-shocked.png'),
            expression: '(:moon-shocked:)',
            unicode: '0x10007B'
          },
          {
            path: require('@/static/img/line-emoji/moon-cry.png'),
            expression: '(:moon-cry:)',
            unicode: '0x10007C'
          },
          {
            path: require('@/static/img/line-emoji/moon-gaunt.png'),
            expression: '(:moon-gaunt:)',
            unicode: '0x10007D'
          },
          {
            path: require('@/static/img/line-emoji/moon-furious.png'),
            expression: '(:moon-furious:)',
            unicode: '0x10007E'
          },
          {
            path: require('@/static/img/line-emoji/cony-laugh.png'),
            expression: '(:cony-laugh:)',
            unicode: '0x10007F'
          },
          {
            path: require('@/static/img/line-emoji/cony-sparkling-eyes.png'),
            expression: '(:cony-sparkling-eyes:)',
            unicode: '0x100080'
          },
          {
            path: require('@/static/img/line-emoji/cony-kiss.png'),
            expression: '(:cony-kiss:)',
            unicode: '0x100081'
          },
          {
            path: require('@/static/img/line-emoji/cony-with-tongue-out.png'),
            expression: '(:cony-with-tongue-out:)',
            unicode: '0x100082'
          },
          {
            path: require('@/static/img/line-emoji/cony-shocked.png'),
            expression: '(:cony-shocked:)',
            unicode: '0x100083'
          },
          {
            path: require('@/static/img/line-emoji/brown-blush.png'),
            expression: '(:brown-blush:)',
            unicode: '0x100084'
          },
          {
            path: require('@/static/img/line-emoji/brown-surprised.png'),
            expression: '(:brown-surprised:)',
            unicode: '0x100085'
          },
          {
            path: require('@/static/img/line-emoji/brown-sleeping.png'),
            expression: '(:brown-sleeping:)',
            unicode: '0x100086'
          },
          {
            path: require('@/static/img/line-emoji/james-sweat.png'),
            expression: '(:james-sweat:)',
            unicode: '0x100087'
          },
          {
            path: require('@/static/img/line-emoji/james-exhausted.png'),
            expression: '(:james-exhausted:)',
            unicode: '0x100088'
          },
          {
            path: require('@/static/img/line-emoji/james-panicking.png'),
            expression: '(:james-panicking:)',
            unicode: '0x100089'
          },
          {
            path: require('@/static/img/line-emoji/james-wink-heart.png'),
            expression: '(:james-wink-heart:)',
            unicode: '0x10008A'
          },
          {
            path: require('@/static/img/line-emoji/james-heart-eyes.png'),
            expression: '(:james-heart-eyes:)',
            unicode: '0x10008B'
          }
        ],
        lineStickers: [
          {
            path: require('@/static/img/line-sticker/ok.png'),
            packageId: '11539',
            stickerId: '52114113'
          },
          {
            path: require('@/static/img/line-sticker/thank-you.png'),
            packageId: '11539',
            stickerId: '52114110'
          },
          {
            path: require('@/static/img/line-sticker/bye.png'),
            packageId: '11538',
            stickerId: '51626494'
          },
          {
            path: require('@/static/img/line-sticker/not-see.png'),
            packageId: '11538',
            stickerId: '51626506'
          },
          {
            path: require('@/static/img/line-sticker/sorry.png'),
            packageId: '11537',
            stickerId: '52002770'
          }
        ],
      }
    },
    methods: {
      ...mapActions('lineStickerEmoji', ['assignLineEmojiAction', 'assignLineStickerAction']),
      ...{
        selectLineEmoji (event, lineEmoji) {
          const vueModel = this
          vueModel.$modal.remove()
          vueModel.assignLineEmojiAction(lineEmoji)
        },

        selectLineSticker (event, lineSticker) {
          const vueModel = this
          vueModel.$modal.remove()
          vueModel.assignLineStickerAction(lineSticker)
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