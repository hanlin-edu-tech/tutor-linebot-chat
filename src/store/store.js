import Vue from 'vue'
import Vuex from 'vuex'
import loginUser from './modules/login-user'
import reminder from './modules/reminder'
import lineStickerEmoji from './modules/line-sticker-emoji'

Vue.use(Vuex)
const store = new Vuex.Store({
  modules: {
    loginUser,
    reminder,
    lineStickerEmoji
  }
})

export default store