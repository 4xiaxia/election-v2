<template>
  <div class="station-manage-container">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="站点名称">
          <el-input v-model="queryParams.stationName" placeholder="请输入站点名称" clearable />
        </el-form-item>
        <el-form-item label="站点状态">
          <el-select v-model="queryParams.status" placeholder="站点状态" clearable style="width: 120px;">
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
      <el-button type="primary" icon="Plus" @click="handleAdd">新增站点</el-button>
    </div>

    <!-- 表格列表 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="stationList" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="station_name" label="站点名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              type="primary" 
              icon="Edit" 
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button 
              link 
              type="danger" 
              icon="Delete" 
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

    <!-- 新增/修改站点弹窗 -->
    <el-dialog :title="dialogTitle" v-model="open" width="500px" append-to-body>
      <el-form ref="stationForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="站点名称" prop="stationName">
          <el-input v-model="form.stationName" placeholder="请输入站点名称" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注内容" :rows="3" />
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
import { getStationList, addStation, updateStation, deleteStation } from '../../api/station';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'StationManage',
  data() {
    return {
      loading: true,
      stationList: [],
      total: 0,
      open: false,
      dialogTitle: '',
      queryParams: {
        page: 1,
        pageSize: 10,
        stationName: '',
        status: ''
      },
      form: {
        stationId: undefined,
        stationName: '',
        status: '0',
        remark: ''
      },
      rules: {
        stationName: [
          { required: true, message: '站点名称不能为空', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        const params = {
          page: this.queryParams.page,
          pageSize: this.queryParams.pageSize
        };
        if (this.queryParams.stationName) params.stationName = this.queryParams.stationName;
        if (this.queryParams.status) params.status = this.queryParams.status;

        const res = await getStationList(params);
        if (res && res.code === 0) {
          this.stationList = res.data.list;
          this.total = res.data.total;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    handleQuery() {
      this.queryParams.page = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams.stationName = '';
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
        stationId: undefined,
        stationName: '',
        status: '0',
        remark: ''
      };
      if (this.$refs.stationForm) {
        this.$refs.stationForm.resetFields();
      }
    },
    handleAdd() {
      this.resetForm();
      this.dialogTitle = '添加站点';
      this.open = true;
    },
    handleUpdate(row) {
      this.resetForm();
      this.dialogTitle = '修改站点';
      this.form = {
        stationId: row.station_id,
        stationName: row.station_name,
        status: row.status,
        remark: row.remark
      };
      this.open = true;
    },
    submitForm() {
      this.$refs.stationForm.validate(async (valid) => {
        if (!valid) return;

        try {
          const isEdit = this.form.stationId !== undefined;
          const reqMethod = isEdit ? updateStation : addStation;
          
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
      ElMessageBox.confirm(`是否确定删除名称为 "${row.station_name}" 的站点?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await deleteStation({ id: row.station_id });
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
.station-manage-container {
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
