const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole, parseUser } = require('../config/requireRole');
const { villageWhere, checkVillageWrite } = require('../config/villageScope');

const ROSTER_STATUS = ['active', 'inactive'];

function toNullableYear(value) {
  if (value === undefined || value === null || value === '') return null;
  const year = Number(value);
  return Number.isInteger(year) ? year : NaN;
}

function normalizePayload(body = {}) {
  return {
    villageId: body.villageId || body.village_id,
    sessionNo: body.sessionNo || body.session_no || '',
    yearStart: toNullableYear(body.yearStart || body.year_start),
    yearEnd: toNullableYear(body.yearEnd || body.year_end),
    post: body.post || '',
    name: body.name || '',
    phone: body.phone || '',
    intro: body.intro || '',
    status: body.status || 'active',
  };
}

function validatePayload(data, requireVillage = true) {
  if (requireVillage && !data.villageId) return 'villageId 必填';
  if (!data.post) return 'post 必填';
  if (!data.name) return 'name 必填';
  if (!ROSTER_STATUS.includes(data.status)) return 'status 只能是 active 或 inactive';
  if (Number.isNaN(data.yearStart) || Number.isNaN(data.yearEnd)) return 'yearStart/yearEnd 必须是年份数字';
  if (data.yearStart && data.yearEnd && data.yearStart > data.yearEnd) return 'yearStart 不能晚于 yearEnd';
  return '';
}

function mapRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    villageId: row.village_id,
    villageName: row.village_name || '',
    villageType: row.village_type || '',
    sessionNo: row.session_no || '',
    yearStart: row.year_start,
    yearEnd: row.year_end,
    post: row.post,
    name: row.name,
    phone: row.phone || '',
    intro: row.intro || '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(ctx) {
  try {
    const { villageId, sessionNo, post, status = 'active', name, page = 1, pageSize = 20 } = ctx.query;
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;
    const params = [];
    const countParams = [];
    let sql = `SELECT r.*, v.name AS village_name, v.type AS village_type
               FROM roster r LEFT JOIN villages v ON r.village_id = v.id
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(1) AS total FROM roster r WHERE 1=1';

    if (villageId) { sql += ' AND r.village_id=?'; countSql += ' AND r.village_id=?'; params.push(villageId); countParams.push(villageId); }
    if (sessionNo) { sql += ' AND r.session_no=?'; countSql += ' AND r.session_no=?'; params.push(sessionNo); countParams.push(sessionNo); }
    if (post) { sql += ' AND r.post=?'; countSql += ' AND r.post=?'; params.push(post); countParams.push(post); }
    if (status) { sql += ' AND r.status=?'; countSql += ' AND r.status=?'; params.push(status); countParams.push(status); }
    if (name) { sql += ' AND r.name LIKE ?'; countSql += ' AND r.name LIKE ?'; params.push(`%${name}%`); countParams.push(`%${name}%`); }

    const { wherePart: vw, params: vp } = villageWhere(ctx);
    if (vw) {
      const scoped = vw.replace('village_id', 'r.village_id');
      sql += scoped;
      countSql += scoped;
      params.push(...vp);
      countParams.push(...vp);
    }

    sql += ' ORDER BY r.village_id ASC, r.session_no DESC, r.post ASC, r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    const [totalRows] = await pool.query(countSql, countParams);
    response.pageSuccess(ctx, rows.map(mapRow), totalRows[0].total, page, pageSize);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '花名册列表加载失败');
  }
}

async function detail(ctx) {
  try {
    const { id } = ctx.query;
    if (!id) return response.paramError(ctx, 'id 必填');
    const [rows] = await pool.query(
      `SELECT r.*, v.name AS village_name, v.type AS village_type
       FROM roster r LEFT JOIN villages v ON r.village_id = v.id WHERE r.id=?`,
      [id]
    );
    if (!rows[0]) return response.notFound(ctx, '花名册记录不存在');
    const allowed = await checkVillageWrite(ctx, rows[0].village_id);
    if (!allowed) return;
    response.success(ctx, mapRow(rows[0]));
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '花名册详情加载失败');
  }
}

async function add(ctx) {
  try {
    const data = normalizePayload(ctx.request.body || {});
    const error = validatePayload(data);
    if (error) return response.paramError(ctx, error);
    const allowed = await checkVillageWrite(ctx, data.villageId);
    if (!allowed) return;
    const user = parseUser(ctx);

    const [result] = await pool.execute(
      `INSERT INTO roster
        (village_id, session_no, year_start, year_end, post, name, phone, intro, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.villageId, data.sessionNo, data.yearStart, data.yearEnd, data.post, data.name,
       data.phone, data.intro, data.status, user ? user.userId : null]
    );
    response.success(ctx, { id: result.insertId }, '花名册记录已新增');
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '新增花名册记录失败');
  }
}

async function update(ctx) {
  try {
    const body = ctx.request.body || {};
    if (!body.id) return response.paramError(ctx, 'id 必填');
    const [rows] = await pool.execute('SELECT * FROM roster WHERE id=?', [body.id]);
    if (!rows[0]) return response.notFound(ctx, '花名册记录不存在');
    const targetVillageId = body.villageId || body.village_id || rows[0].village_id;
    const allowedOld = await checkVillageWrite(ctx, rows[0].village_id);
    if (!allowedOld) return;
    const allowedNew = await checkVillageWrite(ctx, targetVillageId);
    if (!allowedNew) return;

    const data = normalizePayload({ ...rows[0], ...body, villageId: targetVillageId });
    const error = validatePayload(data);
    if (error) return response.paramError(ctx, error);

    await pool.execute(
      `UPDATE roster SET village_id=?, session_no=?, year_start=?, year_end=?, post=?, name=?,
         phone=?, intro=?, status=? WHERE id=?`,
      [data.villageId, data.sessionNo, data.yearStart, data.yearEnd, data.post, data.name,
       data.phone, data.intro, data.status, body.id]
    );
    response.success(ctx, null, '花名册记录已更新');
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '更新花名册记录失败');
  }
}

async function remove(ctx) {
  try {
    const { id } = ctx.request.body || {};
    if (!id) return response.paramError(ctx, 'id 必填');
    const [rows] = await pool.execute('SELECT village_id FROM roster WHERE id=?', [id]);
    if (!rows[0]) return response.notFound(ctx, '花名册记录不存在');
    const allowed = await checkVillageWrite(ctx, rows[0].village_id);
    if (!allowed) return;
    await pool.execute("UPDATE roster SET status='inactive' WHERE id=?", [id]);
    response.success(ctx, null, '花名册记录已停用');
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '停用花名册记录失败');
  }
}

const api = {
  get: { list, detail },
  post: { add, update, delete: remove },
  config: {
    add: requireRole('超级管理', '经办'),
    update: requireRole('超级管理', '经办'),
    delete: requireRole('超级管理', '经办'),
  },
};

Object.defineProperty(api, '_private', {
  value: { ROSTER_STATUS, toNullableYear, normalizePayload, validatePayload, mapRow },
});

module.exports = api;
