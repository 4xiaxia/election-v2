<template>
  <div class="menu-manage-container">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="菜单名称">
          <el-input v-model="queryParams.menuName" placeholder="请输入菜单名称" clearable />
        </el-form-item>
        <el-form-item label="菜单状态">
          <el-select v-model="queryParams.status" placeholder="菜单状态" clearable style="width: 120px;">
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
      <el-button type="primary" icon="Plus" @click="handleAdd(0)">新增菜单</el-button>
    </div>

    <!-- 树形数据表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="menuList"
        row-key="menu_id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
      >
        <el-table-column prop="menu_name" label="菜单名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.icon" size="18">
              <component :is="scope.row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_num" label="排序" width="80" align="center" />
        <el-table-column prop="path" label="路由地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="menu_type" label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.menu_type === 'M'" type="primary">目录</el-tag>
            <el-tag v-else-if="scope.row.menu_type === 'C'" type="success">菜单</el-tag>
            <el-tag v-else-if="scope.row.menu_type === 'F'" type="warning">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="success" icon="Plus" @click="handleAdd(scope.row.menu_id)">新增下级</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改菜单对话框 -->
    <el-dialog :title="dialogTitle" v-model="open" width="600px" append-to-body>
      <el-form ref="menuForm" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级菜单">
              <el-tree-select
                v-model="form.parentId"
                :data="menuOptions"
                :props="{ value: 'menu_id', label: 'menu_name', children: 'children' }"
                value-key="menu_id"
                placeholder="选择上级菜单"
                check-strictly
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio value="M">目录</el-radio>
                <el-radio value="C">菜单</el-radio>
                <el-radio value="F">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单图标" prop="icon">
              <el-select v-model="form.icon" placeholder="选择图标" clearable filterable style="width: 100%;">
                <el-option v-for="item in iconOptions" :key="item" :label="item" :value="item">
                  <span style="float: left; display: flex; align-items: center; height: 100%;">
                    <el-icon style="margin-right: 8px;"><component :is="item" /></el-icon>
                    <span>{{ item }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.menuType !== 'F'">
            <el-form-item label="路由地址" prop="path">
              <el-input v-model="form.path" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示状态">
              <el-radio-group v-model="form.visible">
                <el-radio value="0">显示</el-radio>
                <el-radio value="1">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
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
import { getMenuList, addMenu, updateMenu, deleteMenu } from '../../api/menu';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'MenuManage',
  data() {
    return {
      loading: true,
      menuList: [],
      menuOptions: [],
      open: false,
      dialogTitle: '',
      queryParams: {
        menuName: '',
        status: ''
      },
      form: {
        menuId: undefined,
        parentId: 0,
        menuType: 'C',
        icon: '',
        orderNum: 0,
        menuName: '',
        path: '',
        visible: '0',
        status: '0'
      },
      rules: {
        menuName: [
          { required: true, message: '菜单名称不能为空', trigger: 'blur' }
        ],
        menuType: [
          { required: true, message: '菜单类型不能为空', trigger: 'change' }
        ],
        orderNum: [
          { required: true, message: '显示排序不能为空', trigger: 'blur' }
        ]
      },
      // 常用图标列表
      iconOptions: [
        'Setting', 'User', 'UserFilled', 'Menu', 'HomeFilled', 'Platform', 
        'Document', 'Briefcase', 'Tools', 'Fold', 'Expand', 'Monitor',
        'HelpFilled', 'List', 'Operation', 'Key', 'Lock'
      ]
    };
  },
  created() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        const params = {};
        if (this.queryParams.menuName) params.menuName = this.queryParams.menuName;
        if (this.queryParams.status) params.status = this.queryParams.status;
        
        const res = await getMenuList(params);
        if (res && res.code === 0) {
          this.menuList = this.buildTree(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
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
      // 过滤空 children，以便 Element-Plus 表格不渲染展开按钮
      const cleanEmptyChildren = (nodeList) => {
        nodeList.forEach(node => {
          if (node.children && node.children.length === 0) {
            delete node.children;
          } else if (node.children) {
            cleanEmptyChildren(node.children);
          }
        });
      };
      cleanEmptyChildren(tree);
      return tree;
    },
    // 构建上级菜单的选择树
    getMenuOptions() {
      const rootOption = { menu_id: 0, menu_name: '主类目', children: [] };
      
      // 深度拷贝菜单列表，且只保留 M 目录和 C 菜单供选择上级
      const filterDirectory = (list) => {
        return list
          .filter(node => node.menu_type !== 'F')
          .map(node => {
            const children = node.children ? filterDirectory(node.children) : [];
            const result = { menu_id: node.menu_id, menu_name: node.menu_name };
            if (children.length > 0) result.children = children;
            return result;
          });
      };
      rootOption.children = filterDirectory(this.menuList);
      this.menuOptions = [rootOption];
    },
    handleQuery() {
      this.getList();
    },
    resetQuery() {
      this.queryParams.menuName = '';
      this.queryParams.status = '';
      this.getList();
    },
    cancel() {
      this.open = false;
      this.resetForm();
    },
    resetForm() {
      this.form = {
        menuId: undefined,
        parentId: 0,
        menuType: 'C',
        icon: 'Menu',
        orderNum: 0,
        menuName: '',
        path: '',
        visible: '0',
        status: '0'
      };
      if (this.$refs.menuForm) {
        this.$refs.menuForm.resetFields();
      }
    },
    handleAdd(parentId) {
      this.resetForm();
      this.getMenuOptions();
      if (parentId !== undefined) {
        this.form.parentId = parentId;
      }
      this.dialogTitle = '添加菜单';
      this.open = true;
    },
    handleUpdate(row) {
      this.resetForm();
      this.getMenuOptions();
      // 数据回显
      this.form = {
        menuId: row.menu_id,
        parentId: row.parent_id,
        menuType: row.menu_type,
        icon: row.icon,
        orderNum: row.order_num,
        menuName: row.menu_name,
        path: row.path,
        visible: row.visible,
        status: row.status
      };
      this.dialogTitle = '修改菜单';
      this.open = true;
    },
    submitForm() {
      this.$refs.menuForm.validate(async (valid) => {
        if (!valid) return;
        
        try {
          const isEdit = this.form.menuId !== undefined;
          const reqMethod = isEdit ? updateMenu : addMenu;
          
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
      ElMessageBox.confirm(`是否确定删除名称为 "${row.menu_name}" 的菜单项?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await deleteMenu({ id: row.menu_id });
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
.menu-manage-container {
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

.dialog-footer {
  text-align: right;
}
</style>
