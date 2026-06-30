import { uploadFileToCOS } from './upload'
let urls = {
  // 测试
  wxf163ae6255c8d203: {
    base: 'http://192.168.1.102:1117',
    // base: 'https://unmanned.selfroom.top',
  },
    wxdcdddcd798ee99de: {
    // base: 'http://192.168.1.102:1117',
    base: 'https://www.anyroom.top', // <-- 替换为新注册域名
    // base: 'http://101.200.181.176:1117',
  },

}[wx.getAccountInfoSync().miniProgram.appId || 'wxf163ae6255c8d203']
console.log(wx.getAccountInfoSync(), 'wx.getAccountInfoSync().miniProgram.appId')
// import { wechatLogin } from './personalCenter'
const delayedShowToast = (title, duration) => {
  setTimeout(() => {
    wx.showToast({
      icon: 'none',
      title: title,
      duration: duration || 2500
    })
  }, 100);
}

const request = ({ method = 'GET', url, header = {}, data = {}, formData = {}, api = 'base', responseType }) => {
  console.log('url:', url)
  // 启动时可将storage中的令牌挂到app.js
  let token = wx.getStorageSync('token')
  // let infoData = wx.getStorageSync('infoData')
  if (token) header['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    wx.request({
      method,
      url: urls[api] + url,
      header,
      responseType,
      data,
      formData,
      async success(res) {
        wx.hideLoading()
        // 请求成功
        if (res.statusCode === 200 && responseType) return resolve(res)
        if (res.statusCode === 200) {
          if (res.data.data && res.data.data.errcode && res.data.data.errcode != 0) {
            delayedShowToast(res.data.data.errmsg)
            resolve(false)
          }
          resolve(res.data)
        } else if (res.statusCode == 400) {
          let msg = res.msg || res.data.msg || ''
          setTimeout(() => {
            wx.showToast({
              icon: 'none',
              title: msg.length < 80 ? msg : '请求有误',
              duration: 2500
            })
          }, 100)
          resolve(false)
        } else if (res.statusCode == 403) {
          let msg = res.msg || res.data.msg || '权限不足'
          setTimeout(() => {
            wx.showToast({
              icon: 'none',
              title: msg,
              duration: 3000
            })
          }, 100)
          resolve(false)
        }
        else if (res.statusCode == 401) {
          wx.showToast({
            icon: 'none',
            title: '正在前往登录',
            duration: 2500
          })
          setTimeout(() => {
            wx.clearStorage()
            wx.redirectTo({
              url: `/pages/personalCenter/login/index`,
            })
          }, 2000)
          resolve(false)
        }
        else if (res.statusCode == 500) {
          console.log(res)
          let msg = res.msg || res.data.msg || ''
          setTimeout(() => {
            wx.showToast({
              icon: 'none',
              title: msg.length < 100 ? msg : '服务器异常',
              duration: 2500
            })
          }, 100)
          resolve(false)
        }
        else {
          setTimeout(() => {
            wx.showToast({
              icon: 'none',
              title: res.msg || res.data.msg || '加载中',
              duration: 2500
            })
          }, 100)
          resolve(false)
        }
      },
      fail(err) {
        console.log(err, 'err')
        setTimeout(() => {
          wx.showToast({
            icon: 'none',
            title: '失败',
            duration: 2500
          })
        }, 100);
        resolve(false)
      }
    })
  })
}
const uploadFile = ({ filePath = '', formData = {} }) => {
  // 保持与旧接口兼容，从 formData 中提取业务路径
  const path = formData.path || 'others'
  
  wx.showLoading({ title: '上传中...' })
  return uploadFileToCOS({ filePath, path })
    .then(res => {
      wx.hideLoading()
      return res
    })
    .catch(err => {
      wx.hideLoading()
      wx.showToast({
        icon: 'none',
        title: '上传失败',
        duration: 2500
      })
      return false
    })
}
const login = () => {
  return new Promise((resovle, reject) => {
    wx.login({
      async success(res) {
        if (res.code) {
          let r = await customWx.request({ url: `/user/login/wechatOpenid?jsCode=${res.code}` })
          if (r) resovle(r.data.openid)
          else resovle('')
        }
        else {
          reject({ message: "登录失败" })
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}
const getLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      success(res) {
        console.log(res, 'getLocationgetLocationgetLocation')
        resolve(res)
      },
      fail(err) {
        resolve(false)
      }
    })
  })
}

const wechatpay = data => {
  return new Promise((resolve, reject) => {
    let obj = {
      timeStamp: '',
      nonceStr: '',
      package: '',
      signType: 'RSA',
      paySign: '',
    }
    wx.requestPayment({
      ...obj,
      ...data,
      success(res) {
        resolve(res)
      },
      fail(err) {
        resolve(false)
      }
    })
  })
}
// customWx
export {
  urls,
  request,
  uploadFile,
  login,
  getLocation,
  wechatpay
}

