<template>
  <div class="roles-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <p class="desc">系统使用固定四档角色，在「管理员」页创建用户并指定角色。</p>
    </div>
    <el-table :data="roles" border style="max-width:800px">
      <el-table-column prop="name" label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="tagType(row.name)" effect="plain">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="职责说明" min-width="240" />
      <el-table-column prop="permissions" label="可访问模块" min-width="280" />
    </el-table>
    <el-alert type="info" :closable="false" style="max-width:800px;margin-top:16px"
      title="角色由系统固定，不支持自定义新增或删除。如需调整用户角色，请在「管理员」页编辑对应账号。" />
  </div>
</template>

<script setup lang="ts">
const roles = [
  { name: '超级管理', description: '系统最高权限，管理所有模块和用户',       permissions: '全部菜单' },
  { name: '经办',   description: '负责日常选举事务，可新建编辑各类数据',    permissions: '村居/选举/岗位/候选人/材料/公告/通知/归档/日志' },
  { name: '审核',   description: '负责材料审核和候选人资格审批',             permissions: '候选人/材料/审批管理' },
  { name: '运营',   description: '负责公告发布、通知推送和数据查看',         permissions: '选举(只读)/公告/通知/归档' },
];
function tagType(name: string) {
  return { '超级管理': 'danger', '经办': 'warning', '审核': 'success', '运营': 'info' }[name] || 'info';
}
</script>

<style scoped>
.roles-page { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 18px; margin-bottom: 6px; }
.desc { color: #888; font-size: 13px; }
</style>
