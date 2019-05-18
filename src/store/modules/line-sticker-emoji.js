export default {
  namespaced: true,
  state: {
    expression: '',
    lineStickerEmojiPath: '',
    emojiUnicode: ''
  },

  actions: {
    assignExpressionAction ({ commit }, expression) {
      commit('assignExpression', expression)
    },

    assignLineStickerEmojiPathAction ({ commit }, lineStickerEmojiPath) {
      commit('assignLineStickerEmojiPath', lineStickerEmojiPath)
    },

    assignEmojiUnicodeAction ({ commit }, emojiUnicode) {
      commit('assignEmojiUnicode', emojiUnicode)
    }
  },

  mutations: {
    assignExpression (state, expression) {
      state.expression = expression
    },

    assignLineStickerEmojiPath (state, lineStickerEmojiPath) {
      state.lineStickerEmojiPath = lineStickerEmojiPath
    },

    assignEmojiUnicode (state, emojiUnicode) {
      state.emojiUnicode = emojiUnicode
    }
  }
}