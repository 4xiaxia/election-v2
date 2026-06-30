import { request } from './index'

// 验证码
export const userCaptcha = data => request({
  url: '/user/captcha',
  responseType: 'arraybuffer',
  data
})

// 登录
export const userLogin = data => request({
  method: 'POST',
  url: '/user/login',
  data
})

// 手机验证码登录
export const userLoginByPhone = data => request({
  method: 'POST',
  url: '/user/loginByPhone',
  data
})

// 更新数据
export const userUpdateData = data => request({
  method: 'POST',
  url: '/user/updateData',
  data
})


// 信息
export const statisticsInfo = data => request({
  method: 'GET',
  url: '/statistics/info',
  data
})



// 发送验证码
export const userSendSms = data => request({
  method: 'POST',
  url: '/user/sendSms',
  data
})

// 申请成为商家
export const userBecomeMerchant = data => request({
  method: 'POST',
  url: '/user/becomeMerchant',
  data
})

// 获取个人资料
export const userProfile = data => request({
  method: 'GET',
  url: '/user/profile',
  data
})

// 同步 OpenID
export const userSaveOpenid = data => request({
  method: 'POST',
  url: '/user/saveOpenid',
  data
})

