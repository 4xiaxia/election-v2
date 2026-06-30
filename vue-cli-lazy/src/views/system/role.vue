<template>
  <div class="role-manage-container">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="角色名称">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="角色状态">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable style="width: 120px;">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作工具栏 -->
    <div class="table-tool-bar">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增角色</el-button>
    </div>

    <!-- 表格列表 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="roleList" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="role_name" label="角色名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="role_key" label="权限字符" min-width="120" show-overflow-tooltip />
        <el-table-column prop="role_sort" label="显示顺序" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              type="primary" 
              icon="Edit" 
              :disabled="scope.row.role_id === 1" 
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button 
              link 
              type="danger" 
              icon="Delete" 
              :disabled="scope.row.role_id === 1" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/修改角色弹窗 -->
    <el-dialog :title="dialogTitle" v-model="open" width="550px" append-to-body>
      <el-form ref="roleForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        
        <el-form-item label="权限字符" prop="roleKey">
          <template #label>
            <span>
              <el-tooltip content="控制器中定义的权限字符，如：admin" placement="top">
                <el-icon style="margin-right: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
              </el-tooltip>
              权限字符
            </span>
          </template>
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>

        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" controls-position="right" :min="0" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 菜单树权限 -->
        <el-form-item label="菜单权限">
          <div class="menu-tree-border">
            <el-tree
              ref="menuTree"
              :data="menuOptions"
              show-checkbox
              node-key="menu_id"
              :props="{ label: 'menu_name', children: 'children' }"
              :check-strictly="false"
              class="menu-tree"
            />
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getRoleList, addRole, updateRole, deleteRole } from '../../api/role';
import { getMenuList } from '../../api/menu';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'RoleManage',
  data() {
    return {
      loading: true,
      roleList: [],
      menuOptions: [], // 存储树形菜单选项
      total: 0,
      open: false,
      dialogTitle: '',
      queryParams: {
        page: 1,
        pageSize: 10,
        roleName: '',
        status: ''
      },
      form: {
        roleId: undefined,
        roleName: '',
        roleKey: '',
        roleSort: 0,
        status: '0',
        menuIds: [],
        remark: ''
      },
      rules: {
        roleName: [
          { required: true, message: '角色名称不能为空', trigger: 'blur' }
        ],
        roleKey: [
          { required: true, message: '权限字符不能为空', trigger: 'blur' }
        ],
        roleSort: [
          { required: true, message: '角色顺序不能为空', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.getMenuTree();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        const params = {
          page: this.queryParams.page,
          pageSize: this.queryParams.pageSize
        };
        if (this.queryParams.roleName) params.roleName = this.queryParams.roleName;
        if (this.queryParams.status) params.status = this.queryParams.status;

        const res = await getRoleList(params);
        if (res && res.code === 0) {
          this.roleList = res.data.list;
          this.total = res.data.total;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    // 获取菜单树形选项
    async getMenuTree() {
      try {
        const res = await getMenuList();
        if (res && res.code === 0) {
          this.menuOptions = this.buildTree(res.data);
        }
      } catch (error) {
        console.error(error);
      }
    },
    buildTree(list) {
      const items = list.map(item => ({ ...item, children: [] }));
      const map = {};
      items.forEach(item => {
        map[item.menu_id] = item;
      });
      const tree = [];
      items.forEach(item => {
        if (item.parent_id === 0 || !map[item.parent_id]) {
          tree.push(item);
        } else {
          map[item.parent_id].children.push(item);
        }
      });
      return tree;
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams.roleName = '';
      this.queryParams.status = '';
      this.queryParams.page = 1;
      this.getList();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.page = val;
      this.getList();
    },
    cancel() {
      this.open = false;
      this.resetForm();
    },
    resetForm() {
      this.form = {
        roleId: undefined,
        roleName: '',
        roleKey: '',
        roleSort: 0,
        status: '0',
        menuIds: [],
        remark: ''
      };
      if (this.$refs.menuTree) {
        this.$refs.menuTree.setCheckedKeys([]);
      }
      if (this.$refs.roleForm) {
        this.$refs.roleForm.resetFields();
      }
    },
    handleAdd() {
      this.resetForm();
      this.dialogTitle = '添加角色';
      this.open = true;
    },
    handleUpdate(row) {
      this.resetForm();
      this.dialogTitle = '修改角色';
      this.form = {
        roleId: row.role_id,
        roleName: row.role_name,
        roleKey: row.role_key,
        roleSort: row.role_sort,
        status: row.status,
        remark: row.remark
      };
      this.open = true;

      // 菜单回显：因为 Element Tree 若 checkStrictly=false 勾选父节点会连带子节点全选，
      // 我们回显时需要过滤掉有子节点的父菜单，只勾选最底层叶子节点，Tree 就会自动展示半选中和全选中状态！
      this.$nextTick(() => {
        if (this.$refs.menuTree && row.menuIds) {
          const checkedKeys = [];
          row.menuIds.forEach(id => {
            // 在我们的 menuOptions 中查找，如果是叶子节点才放入勾选数组
            if (!this.hasChildren(this.menuOptions, id)) {
              checkedKeys.push(id);
            }
          });
          this.$refs.menuTree.setCheckedKeys(checkedKeys);
        }
      });
    },
    hasChildren(list, id) {
      for (const item of list) {
        if (item.menu_id === id) {
          return item.children && item.children.length > 0;
        }
        if (item.children && item.children.length > 0) {
          const found = this.hasChildren(item.children, id);
          if (found) return true;
        }
      }
      return false;
    },
    submitForm() {
      this.$refs.roleForm.validate(async (valid) => {
        if (!valid) return;
        
        // 整理已选中的菜单节点 (包含全选和半选的父节点)
        let menuIds = [];
        if (this.$refs.menuTree) {
          menuIds = [
            ...this.$refs.menuTree.getCheckedKeys(),
            ...this.$refs.menuTree.getHalfCheckedKeys()
          ];
        }
        this.form.menuIds = menuIds;

        try {
          const isEdit = this.form.roleId !== undefined;
          const reqMethod = isEdit ? updateRole : addRole;
          
          const res = await reqMethod(this.form);
          if (res && res.code === 0) {
            ElMessage.success(isEdit ? '修改成功' : '添加成功');
            this.open = false;
            this.getList();
          }
        } catch (error) {
          console.error(error);
        }
      });
    },
    handleDelete(row) {
      ElMessageBox.confirm(`是否确定删除名称为 "${row.role_name}" 的角色项?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await deleteRole({ id: row.role_id });
          if (res && res.code === 0) {
            ElMessage.success('删除成功');
            this.getList();
          }
        } catch (error) {
          console.error(error);
        }
      }).catch(() => {});
    }
  }
};
</script>

<style lang="less" scoped>
.role-manage-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card, .table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.table-tool-bar {
  display: flex;
  justify-content: flex-start;
}

.menu-tree-border {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  background-color: #fafbfc;
  box-sizing: border-box;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}
</style>
