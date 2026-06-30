import request from './index';
import proxyApi from '../dev.js';

const { api } = proxyApi;

// 查询站点分页列表
export function getStationList(params) {
  return request({
    url: `${api}/station/list`,
    method: 'get',
    params
  });
}

// 获取所有启用站点列表（下拉选择框使用）
export function getAllStations() {
  return request({
    url: `${api}/station/all`,
    method: 'get'
  });
}

// 新增站点
export function addStation(data) {
  return request({
    url: `${api}/station/add`,
    method: 'post',
    data
  });
}

// 修改站点
export function updateStation(data) {
  return request({
    url: `${api}/station/update`,
    method: 'post',
    data
  });
}

// 删除站点
export function deleteStation(data) {
  return request({
    url: `${api}/station/delete`,
    method: 'post',
    data
  });
}
