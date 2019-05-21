export default {
  namespaced: true,
  state: {
    lineEmoji: {},
    lineSticker: {}
  },

  actions: {
    assignLineEmojiAction ({ commit }, lineEmoji) {
      commit('assignLineEmoji', lineEmoji)
    },

    assignLineStickerAction ({ commit }, lineSticker) {
      commit('assignLineSticker', lineSticker)
    }
  },

  mutations: {
    assignLineEmoji (state, lineEmoji) {
      state.lineEmoji = lineEmoji
    },

    assignLineSticker (state, lineSticker) {
      state.lineSticker = lineSticker
    }
  }
}