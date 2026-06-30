import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    info: {},
    token: '',
    menus: [],
  }),
  actions: {
    setToken(token) {
      this.token = token
    },
    setInfo(info) {
      this.info = info
    },
    setMenus(menus) {
      this.menus = menus
    },
    logout() {
      this.token = ''
      this.info = {}
      this.menus = []
    }
  },
  persist: true,
})
