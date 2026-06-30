import { request } from './index'

// 获取地图附近列表
export const locationNearbyList = data => request({
  method: 'POST',
  url: '/location/nearbyList',
  data
})

// // 智库动态详情
// export const dynamicDetail = data => request({
//   url: `/axis/wechat/dynamic/${data.id}`,
//   data
// })
// // 获取bannerlist
// export const bannerList = data => request({
//   url: `/axis/wechat/banner/list`,
//   data
// })
// // 上传文件
// export const commonUpload = data => request({
//   method: 'POST',
//   url: `/common/upload`,
//   data
// })
export const mappingByVillage = data => request({
  url: `/mapping/byVillage?area=${data.area}`,
  header: {
    'content-type': 'application/json',
    token: wx.getStorageSync('token') || ''
    },
  method: 'GET'
})
