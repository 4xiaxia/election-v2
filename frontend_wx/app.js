import { userProfile, userSaveOpenid } from './api/personalCenter'
// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    this.globalData = { userInfo: null }
    this.login()
  },

  async login() {
    const token = wx.getStorageSync('token')
    if (!token) return

    try {
      const res = await userProfile()
      if (res && res.data) {
        this.globalData.userInfo = res.data
        // 同步更新本地存储，确保权限工具能获取到最新的 employeeData 等数据
        wx.setStorageSync('infoData', JSON.stringify(res.data))
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  },

  async getOpenid() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })
      
      if (!loginRes.code) return

      const accountInfo = wx.getAccountInfoSync();
      const appId = accountInfo.miniProgram.appId;
      console.log('[Debug] Syncing OpenID for appId:', appId);

      const res = await userSaveOpenid({ 
        jsCode: loginRes.code, 
        appId: appId 
      })

      if (res && res.data && res.data.openid) {
        if (this.globalData.userInfo) {
          this.globalData.userInfo.openid = res.data.openid
        }
        console.log('OpenID 同步成功')
      }
    } catch (err) {
      console.error('获取 OpenID 失败:', err)
    }
  },
  
  globalData: {
    page: null,
    userInfo: null
  }
})
