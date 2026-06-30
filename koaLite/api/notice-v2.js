// @@API-NOTICE-V2 公告管理（公开门面·全村可见·≠通知）
// 4类固定字典：村民组通知/议事会通知/村监会通知/村务通知
// 套路对齐 village-v2.js
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

const NOTICE_TYPES = ['村民组通知', '议事会通知', '村监会通知', '村务通知'];

module.exports = {
  get: {
    // 公告分页列表（置顶优先·按时间倒序）
    async list(ctx) {
      try {
        const { page = 1, pageSize = 10, electionId, type, status, title } = ctx.query;
        const limit = Number(pageSize);
        const offset = (Number(page) - 1) * limit;

        let sql = `SELECT id, election_id, title, type, status, is_top,
                          DATE_FORMAT(start_time,"%Y-%m-%d") as start_time,
                          DATE_FORMAT(end_time,"%Y-%m-%d") as end_time,
                          DATE_FORMAT(created_at,"%Y-%m-%d %H:%i") as created_at
                   FROM notices WHERE 1=1`;
        let countSql = 'SELECT COUNT(1) as total FROM notices WHERE 1=1';
        const params = [];
        const countParams = [];

        if (electionId) { sql += ' AND election_id=?'; countSql += ' AND election_id=?'; params.push(electionId); countParams.push(electionId); }
        if (type)       { sql += ' AND type=?';        countSql += ' AND type=?';        params.push(type);       countParams.push(type); }
        if (status)     { sql += ' AND status=?';      countSql += ' AND status=?';      params.push(status);     countParams.push(status); }
        if (title)      { sql += ' AND title LIKE ?';  countSql += ' AND title LIKE ?';  params.push(`%${title}%`); countParams.push(`%${title}%`); }

        sql += ' ORDER BY is_top DESC, id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);
        const [totalRow] = await pool.query(countSql, countParams);
        response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
      } catch (e) { console.error(e); response.serverError(ctx, '查询公告列表失败'); }
    },

    // 公告详情（含富文本内容）
    async detail(ctx) {
      try {
        const { id } = ctx.query;
        if (!id) return response.paramError(ctx, '公告ID不能为空');
        const [rows] = await pool.query('SELECT * FROM notices WHERE id=?', [id]);
        if (rows.length === 0) return response.notFound(ctx, '公告不存在');
        response.success(ctx, rows[0]);
      } catch (e) { console.error(e); response.serverError(ctx, '查询公告详情失败'); }
    },

    // 公告类型字典（前端下拉用）
    async types(ctx) {
      response.success(ctx, NOTICE_TYPES);
    }
  },

  post: {
    // 新增公告
    async add(ctx) {
      try {
        const b = ctx.request.body;
        const { title, type = '村务通知', content = '', electionId = null } = b;
        if (!title) return response.paramError(ctx, '公告标题不能为空');
        if (!NOTICE_TYPES.includes(type)) {
          return response.businessError(ctx, `公告类型必须是：${NOTICE_TYPES.join('/')}`);
        }
        const createdBy = ctx.state.user ? ctx.state.user.userId : null;
        const [r] = await pool.execute(
          `INSERT INTO notices (election_id, title, content, type, start_time, end_time, status, is_top, created_by)
           VALUES (?,?,?,?,?,?, ?, ?, ?)`,
          [electionId, title, content, type, b.startTime || null, b.endTime || null,
           b.status || '草稿', b.isTop ? 1 : 0, createdBy]
        );
        response.success(ctx, { id: r.insertId }, '添加公告成功');
      } catch (e) { console.error(e); response.serverError(ctx, '添加公告失败'); }
    },

    // 修改公告
    async update(ctx) {
      try {
        const b = ctx.request.body;
        if (!b.id) return response.paramError(ctx, '公告ID不能为空');
        if (!b.title) return response.paramError(ctx, '公告标题不能为空');
        if (b.type && !NOTICE_TYPES.includes(b.type)) {
          return response.businessError(ctx, `公告类型必须是：${NOTICE_TYPES.join('/')}`);
        }
        await pool.execute(
          `UPDATE notices SET title=?, content=?, type=?, start_time=?, end_time=?, status=?, is_top=?, election_id=? WHERE id=?`,
          [b.title, b.content || '', b.type || '村务通知', b.startTime || null, b.endTime || null,
           b.status || '草稿', b.isTop ? 1 : 0, b.electionId || null, b.id]
        );
        response.success(ctx, null, '修改公告成功');
      } catch (e) { console.error(e); response.serverError(ctx, '修改公告失败'); }
    },

    // 上下架（改 status）
    async publish(ctx) {
      try {
        const { id, status } = ctx.request.body;
        if (!id) return response.paramError(ctx, '公告ID不能为空');
        const allowed = ['草稿', '待发布', '已发布', '已下架'];
        if (!allowed.includes(status)) {
          return response.paramError(ctx, `status 必须是：${allowed.join('/')}`);
        }
        await pool.execute('UPDATE notices SET status=? WHERE id=?', [status, id]);
        response.success(ctx, null, `公告已${status}`);
      } catch (e) { console.error(e); response.serverError(ctx, '上下架失败'); }
    },

    // 删除公告
    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '公告ID不能为空');
        await pool.execute('DELETE FROM notices WHERE id=?', [id]);
        response.success(ctx, null, '删除公告成功');
      } catch (e) { console.error(e); response.serverError(ctx, '删除公告失败'); }
    }
  },

  // @@AUTH 公告：增删改上下架限超管/运营，读放开（公开门面）
  config: {
    add: requireRole('超级管理', '运营'),
    update: requireRole('超级管理', '运营'),
    publish: requireRole('超级管理', '运营'),
    delete: requireRole('超级管理', '运营'),
  }
};
