import axios from './index'
import proxyApi from '../dev.js'

const { api } = proxyApi

// 用户登录
export const login = (data) => {
  return axios.post(`${api}/user/login`, data)
}

// 获取当前登录用户的信息及权限路由菜单
export const getUserInfo = () => {
  return axios.get(`${api}/user/info`)
}

// 获取用户分页列表
export const getUserList = (params) => {
  // 传参为 query 形式，axios.get 可以使用 { params }
  return axios.get(`${api}/user/list`, { params })
}

// 新增用户
export const addUser = (data) => {
  return axios.post(`${api}/user/add`, data)
}

// 更新用户
export const updateUser = (data) => {
  return axios.post(`${api}/user/update`, data)
}

// 删除用户
export const deleteUser = (data) => {
  return axios.post(`${api}/user/delete`, data)
}
