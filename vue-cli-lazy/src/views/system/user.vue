<template>
  <div class="user-manage-container">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="用户账号">
          <el-input v-model="queryParams.username" placeholder="请输入用户账号" clearable />
        </el-form-item>
        <el-form-item label="手机号码">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable />
        </el-form-item>
        <el-form-item label="帐号状态">
          <el-select v-model="queryParams.status" placeholder="帐号状态" clearable style="width: 120px;">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属站点">
          <el-select v-model="queryParams.stationId" placeholder="所属站点" clearable style="width: 150px;">
            <el-option 
              v-for="item in stationOptions" 
              :key="item.station_id" 
              :label="item.station_name" 
              :value="item.station_id" 
            />
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
      <el-button type="primary" icon="Plus" @click="handleAdd">新增用户</el-button>
    </div>

    <!-- 表格列表 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="userList" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户账号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="nick_name" label="用户昵称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="role_name" label="角色" min-width="120" align="center">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.role_name || '未分配' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="station_name" label="所属站点" min-width="120" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.station_name">{{ scope.row.station_name }}</el-tag>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phonenumber" label="手机号码" width="130" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              type="primary" 
              icon="Edit" 
              :disabled="scope.row.user_id === 1" 
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button 
              link 
              type="danger" 
              icon="Delete" 
              :disabled="scope.row.user_id === 1" 
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

    <!-- 新增/修改用户弹窗 -->
    <el-dialog :title="dialogTitle" v-model="open" width="600px" append-to-body>
      <el-form ref="userForm" :model="form" :rules="formRules" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户账号" prop="username">
              <el-input 
                v-model="form.username" 
                placeholder="请输入用户账号" 
                :disabled="form.userId !== undefined" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户密码" prop="password">
              <el-input 
                v-model="form.password" 
                type="password" 
                :placeholder="form.userId !== undefined ? '不填则不修改密码' : '请输入密码'" 
                show-password 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分配角色" prop="roleId">
              <el-select v-model="form.roleId" placeholder="选择角色" style="width: 100%;">
                <el-option 
                  v-for="item in roleOptions" 
                  :key="item.role_id" 
                  :label="item.role_name" 
                  :value="item.role_id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属站点" prop="stationId">
              <el-select v-model="form.stationId" placeholder="选择站点" style="width: 100%;" clearable>
                <el-option 
                  v-for="item in stationOptions" 
                  :key="item.station_id" 
                  :label="item.station_name" 
                  :value="item.station_id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="帐号状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" :rows="3" />
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
import { getUserList, addUser, updateUser, deleteUser } from '../../api/user';
import { getAllRoles } from '../../api/role';
import { getAllStations } from '../../api/station';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'UserManage',
  data() {
    return {
      loading: true,
      userList: [],
      roleOptions: [], // 角色选择下拉框选项
      stationOptions: [], // 站点选择下拉框选项
      total: 0,
      open: false,
      dialogTitle: '',
      queryParams: {
        page: 1,
        pageSize: 10,
        username: '',
        phonenumber: '',
        status: '',
        stationId: ''
      },
      form: {
        userId: undefined,
        username: '',
        password: '',
        phonenumber: '',
        roleId: undefined,
        stationId: undefined,
        nickName: '',
        status: '0',
        remark: ''
      },
      rules: {
        username: [
          { required: true, message: '用户账号不能为空', trigger: 'blur' },
          { min: 2, max: 20, message: '用户账号长度必须在 2 到 20 个字符之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: '用户昵称不能为空', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'blur' },
          { min: 5, max: 20, message: '密码长度必须在 5 到 20 个字符之间', trigger: 'blur' }
        ],
        roleId: [
          { required: true, message: '请分配角色', trigger: 'change' }
        ]
      }
    };
  },
  computed: {
    formRules() {
      const isEdit = this.form.userId !== undefined;
      const rules = { ...this.rules };
      if (isEdit) {
        rules.password = [
          { min: 5, max: 20, message: '密码长度必须在 5 到 20 个字符之间', trigger: 'blur' }
        ];
      }
      return rules;
    }
  },
  created() {
    this.getList();
    this.getRoleOptions();
    this.getStationOptions();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        const params = {
          page: this.queryParams.page,
          pageSize: this.queryParams.pageSize
        };
        if (this.queryParams.username) params.username = this.queryParams.username;
        if (this.queryParams.phonenumber) params.phonenumber = this.queryParams.phonenumber;
        if (this.queryParams.status) params.status = this.queryParams.status;
        if (this.queryParams.stationId) params.stationId = this.queryParams.stationId;

        const res = await getUserList(params);
        if (res && res.code === 0) {
          this.userList = res.data.list;
          this.total = res.data.total;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    // 获取启用角色列表
    async getRoleOptions() {
      try {
        const res = await getAllRoles();
        if (res && res.code === 0) {
          this.roleOptions = res.data;
        }
      } catch (error) {
        console.error(error);
      }
    },
    // 获取启用站点列表
    async getStationOptions() {
      try {
        const res = await getAllStations();
        if (res && res.code === 0) {
          this.stationOptions = res.data;
        }
      } catch (error) {
        console.error(error);
      }
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams.username = '';
      this.queryParams.phonenumber = '';
      this.queryParams.status = '';
      this.queryParams.stationId = '';
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
        userId: undefined,
        username: '',
        password: '',
        phonenumber: '',
        roleId: undefined,
        stationId: undefined,
        nickName: '',
        status: '0',
        remark: ''
      };
      if (this.$refs.userForm) {
        this.$refs.userForm.resetFields();
      }
    },
    handleAdd() {
      this.resetForm();
      this.dialogTitle = '添加用户';
      this.form.password = '123456'; // 默认密码
      this.open = true;
    },
    handleUpdate(row) {
      this.resetForm();
      this.dialogTitle = '修改用户';
      this.form = {
        userId: row.user_id,
        username: row.username,
        password: '', // 修改时不默认回显密码，若不修改就不填
        phonenumber: row.phonenumber,
        roleId: row.role_id,
        stationId: row.station_id,
        nickName: row.nick_name,
        status: row.status,
        remark: row.remark
      };
      this.open = true;
    },
    submitForm() {
      this.$refs.userForm.validate(async (valid) => {
        if (!valid) return;
        
        try {
          const isEdit = this.form.userId !== undefined;
          const reqMethod = isEdit ? updateUser : addUser;
          
          const res = await reqMethod(this.form);
          if (res) {
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
      ElMessageBox.confirm(`是否确定删除用户账号为 "${row.username}" 的用户?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await deleteUser({ id: row.user_id });
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
.user-manage-container {
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

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}
</style>
