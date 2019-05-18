export default {
  namespaced: true,
  state: {
    loginUserInfo: Object.create(null)
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