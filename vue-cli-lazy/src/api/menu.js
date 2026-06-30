import axios from './index'
import proxyApi from '../dev.js'

const { api } = proxyApi

// 获取菜单列表
export const getMenuList = (params) => {
  return axios.get(`${api}/menu/list`, { params })
}

// 新增菜单
export const addMenu = (data) => {
  return axios.post(`${api}/menu/add`, data)
}

// 更新菜单
export const updateMenu = (data) => {
  return axios.post(`${api}/menu/update`, data)
}

// 删除菜单
export const deleteMenu = (data) => {
  return axios.post(`${api}/menu/delete`, data)
}
