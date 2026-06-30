import axios from './index'
import proxyApi from '../dev.js'

const { api } = proxyApi

// 获取角色列表 (分页)
export const getRoleList = (params) => {
  return axios.get(`${api}/role/list`, { params })
}

// 获取全部角色 (不分页)
export const getAllRoles = () => {
  return axios.get(`${api}/role/all`)
}

// 新增角色
export const addRole = (data) => {
  return axios.post(`${api}/role/add`, data)
}

// 更新角色
export const updateRole = (data) => {
  return axios.post(`${api}/role/update`, data)
}

// 删除角色
export const deleteRole = (data) => {
  return axios.post(`${api}/role/delete`, data)
}
