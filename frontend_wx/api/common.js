import { request, uploadFile } from './index'
// 刷新token
export const userRefresh = data => request({
  api: 'base',
  url: '/user/refresh',
  data
})

// 上传文件
export const uploadImage = (path, formData) => uploadFile({
  api: 'base',
  url: '/upload/image',
  method: 'POST',
  filePath: path,
  formData: formData,
  path
})

export const getParams = data => {
  let url = '?'
  for (let i in data) data[i] ? url += `${i}=${data[i] || ''}&` : ''
  return url
}
export const formData = data => {
  let str = ''
  for (let i in data) {
    str += `\r\nContent-Disposition: form-data; name="${i}"\r\n\r\n${data[i]}\r\n--XXX`
  }
  return str
}
