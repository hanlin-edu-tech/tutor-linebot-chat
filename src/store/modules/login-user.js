export default {
  namespaced: true,
  state: {
    loginUserInfo: Object
  },

  actions: {
    assignLoginUserInfoAction ({ commit }, loginUserInfo) {
      commit('assignLoginUserInfo', loginUserInfo)
    }
  },

  mutations: {
    assignLoginUserInfo (state, loginUserInfo) {
      state.loginUserInfo = loginUserInfo
    }
  }
}
