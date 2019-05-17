<template>
  <mu-icon class="image-control-icon" size="27" value="sentiment_satisfied_alt"
           @click="showLineStickerEmojiModal"></mu-icon>
</template>

<script>
  import LineStickerEmojiModal from '@/components/chat/LineStickerEmojiModal'

  export default {
    name: 'LineStickerEmojiButton',
    methods: {
      showLineStickerEmojiModal () {
        const vueModel = this
        vueModel.$Modal.info({
          width: '650px',
          okText:'取消',
          render: createElement => createElement(LineStickerEmojiModal)
        })
      }
    }
  }
</script>

<style scoped>
  .image-control-icon {
    position: relative;
    top: 26px;
    left: -5px;
    cursor: pointer;
  }
</style>