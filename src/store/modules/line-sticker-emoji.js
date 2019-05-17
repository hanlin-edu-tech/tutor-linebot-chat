export default {
  namespaced: true,
  state: {
    lineStickerEmojiPath: '',
    emojiUnicode: ''
  },

  actions: {
    assignLineStickerEmojiPathAction ({ commit }, lineStickerEmojiPath) {
      commit('assignLineStickerEmojiPath', lineStickerEmojiPath)
    },

    assignEmojiUnicodeAction ({ commit }, emojiUnicode) {
      commit('assignEmojiUnicode', emojiUnicode)
    }
  },

  mutations: {
    assignLineStickerEmojiPath (state, lineStickerEmojiPath) {
      state.lineStickerEmojiPath = lineStickerEmojiPath
    },

    assignEmojiUnicode (state, emojiUnicode) {
      state.emojiUnicode = emojiUnicode
    }
  }
}