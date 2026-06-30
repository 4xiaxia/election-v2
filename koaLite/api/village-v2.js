// @@API-VILLAGE-V2 村居管理（招聘比喻最底层·属性归属标签）
// 套路对齐 zeroLite station.js：list/all/add/update/delete
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

module.exports = {
  get: {
    // 村居分页列表
    async list(ctx) {
      try {
        const { page = 1, pageSize = 10, name, type } = ctx.query;
        const limit = Number(pageSize);
        const offset = (Number(page) - 1) * limit;

        let sql = 'SELECT id, name, type, code, status, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at FROM villages WHERE 1=1';
        let countSql = 'SELECT COUNT(1) as total FROM villages WHERE 1=1';
        const params = [];
        const countParams = [];

        if (name) {
          sql += ' AND name LIKE ?';
          countSql += ' AND name LIKE ?';
          params.push(`%${name}%`);
          countParams.push(`%${name}%`);
        }
        if (type) {
          sql += ' AND type = ?';
          countSql += ' AND type = ?';
          params.push(type);
          countParams.push(type);
        }

        sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);
        const [totalRow] = await pool.query(countSql, countParams);
        response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询村居列表失败');
      }
    },

    // 所有启用村居（下拉选择用）
    async all(ctx) {
      try {
        const [rows] = await pool.query(
          "SELECT id, name, type FROM villages WHERE status = '0' ORDER BY id ASC"
        );
        response.success(ctx, rows);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '获取所有村居失败');
      }
    }
  },

  post: {
    // 新增村居
    async add(ctx) {
      try {
        const { name, type = '村委会', code = '', status = '0' } = ctx.request.body;
        if (!name) return response.paramError(ctx, '村居名称不能为空');

        const [result] = await pool.execute(
          'INSERT INTO villages (name, type, code, status) VALUES (?, ?, ?, ?)',
          [name, type, code, status]
        );
        response.success(ctx, { id: result.insertId }, '添加村居成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '添加村居失败');
      }
    },

    // 修改村居
    async update(ctx) {
      try {
        const { id, name, type, code, status } = ctx.request.body;
        if (!id) return response.paramError(ctx, '村居ID不能为空');
        if (!name) return response.paramError(ctx, '村居名称不能为空');

        await pool.execute(
          'UPDATE villages SET name = ?, type = ?, code = ?, status = ? WHERE id = ?',
          [name, type || '村委会', code || '', status || '0', id]
        );
        response.success(ctx, null, '修改村居成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '修改村居失败');
      }
    },

    // 删除村居（校验有无被选举活动引用）
    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '村居ID不能为空');

        const [used] = await pool.execute('SELECT 1 FROM elections WHERE village_id = ? LIMIT 1', [id]);
        if (used.length > 0) {
          return response.businessError(ctx, '该村居已关联选举活动，不允许删除');
        }

        await pool.execute('DELETE FROM villages WHERE id = ?', [id]);
        response.success(ctx, null, '删除村居成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '删除村居失败');
      }
    }
  },

  // @@AUTH 村居管理：增删改限超管/经办，读放开
  config: {
    add: requireRole('超级管理', '经办'),
    update: requireRole('超级管理', '经办'),
    delete: requireRole('超级管理'),
  }
};
