// 4类固定字典：村民组通知/议事会通知/村监会通知/村务通知
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');
const { villageWhere } = require('../config/villageScope');
const { COMMON_FIELDS, TEMPLATES } = require('../config/noticeTemplates');

const NOTICE_TYPES = ['村民组通知', '议事会通知', '村监会通知', '村务通知'];
const NOTICE_STATUS = ['草稿', '已发布', '已下线'];

function orgWords(orgType) {
  const isCommunity = orgType === 'community';
  return {
    orgResident: isCommunity ? '居民' : '村民',
    orgUnit: isCommunity ? '社区' : '村',
    orgCommittee: isCommunity ? '居民委员会' : '村民委员会',
    orgElectionCommittee: isCommunity ? '居民选举委员会' : '村民选举委员会',
  };
}

function renderTemplate(body, data) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    return value === undefined || value === null || value === '' ? '____' : String(value);
  });
}

function buildNoticeFromTemplate({ seq, orgType, fields = {} }) {
  const tpl = TEMPLATES.find(t => String(t.seq) === String(seq));
  if (!tpl) return null;
  const data = { ...orgWords(orgType), ...fields };
  const content = renderTemplate(tpl.body, data);
  const title = `${data.villageName || '____'}关于${tpl.name.replace(/^关于/, '')}`;
  return { seq: tpl.seq, docNo: tpl.docNo, name: tpl.name, title, content };
}

async function list(ctx) {
  try {
    const { page = 1, pageSize = 10, electionId, type, status, title, stageKey } = ctx.query;
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;
    const params = [];
    const countParams = [];
    let sql = `SELECT n.id, n.election_id, n.title, n.type, n.status, n.is_top,
                      n.notice_no, n.stage_key, n.template_key,
                      DATE_FORMAT(n.start_time,"%Y-%m-%d") as start_time,
                      DATE_FORMAT(n.end_time,"%Y-%m-%d") as end_time,
                      DATE_FORMAT(n.created_at,"%Y-%m-%d %H:%i") as created_at
               FROM notices n JOIN elections e ON n.election_id=e.id WHERE 1=1`;
    let countSql = 'SELECT COUNT(1) as total FROM notices n JOIN elections e ON n.election_id=e.id WHERE 1=1';

    if (electionId) { sql += ' AND n.election_id=?'; countSql += ' AND n.election_id=?'; params.push(electionId); countParams.push(electionId); }
    if (type) { sql += ' AND n.type=?'; countSql += ' AND n.type=?'; params.push(type); countParams.push(type); }
    if (status) { sql += ' AND n.status=?'; countSql += ' AND n.status=?'; params.push(status); countParams.push(status); }
    if (title) { sql += ' AND n.title LIKE ?'; countSql += ' AND n.title LIKE ?'; params.push(`%${title}%`); countParams.push(`%${title}%`); }
    if (stageKey) { sql += ' AND n.stage_key=?'; countSql += ' AND n.stage_key=?'; params.push(stageKey); countParams.push(stageKey); }

    // @@村级隔离：非超管强制限定只看自己村
    const { wherePart: vw, params: vp } = villageWhere(ctx);
    if (vw) {
      const vwScoped = vw.replace('village_id', 'e.village_id');
      sql += vwScoped; countSql += vwScoped;
      params.push(...vp); countParams.push(...vp);
    }

    sql += ' ORDER BY n.is_top DESC, n.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    const [totalRow] = await pool.query(countSql, countParams);
    response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '公告列表加载失败');
  }
}

async function detail(ctx) {
  try {
    const { id } = ctx.query;
    if (!id) return response.paramError(ctx, 'id 必填');
    const [rows] = await pool.query('SELECT * FROM notices WHERE id=?', [id]);
    if (!rows[0]) return response.notFound(ctx, '公告不存在');
    response.success(ctx, rows[0]);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '公告详情加载失败');
  }
}

function types(ctx) {
  response.success(ctx, NOTICE_TYPES);
}

function templates(ctx) {
  const { seq } = ctx.query;
  if (seq) {
    const template = TEMPLATES.find(t => String(t.seq) === String(seq));
    return response.success(ctx, { commonFields: COMMON_FIELDS, template });
  }
  const list = TEMPLATES.map(({ seq, docNo, name, category, hasEnding, fields }) => ({
    seq, docNo, name, category, hasEnding, fieldCount: fields.length,
  }));
  response.success(ctx, { commonFields: COMMON_FIELDS, list });
}

async function generate(ctx) {
  try {
    const body = ctx.request.body || {};
    const notice = buildNoticeFromTemplate(body);
    if (!notice) return response.paramError(ctx, '模板 seq 无效');
    if (!body.save) return response.success(ctx, notice);

    const createdBy = ctx.state.user ? ctx.state.user.userId : null;
    const [result] = await pool.execute(
      `INSERT INTO notices
        (election_id, title, content, type, status, is_top, created_by, notice_no, stage_key, template_key)
       VALUES (?, ?, ?, ?, '草稿', 0, ?, ?, ?, ?)`,
      [body.electionId || null, notice.title, notice.content, body.type || '村务通知', createdBy,
       notice.docNo || String(notice.seq || ''), body.stageKey || '', body.templateKey || `notice_${notice.seq}`]
    );
    response.success(ctx, { id: result.insertId, ...notice });
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '生成公告失败');
  }
}

async function add(ctx) {
  try {
    const body = ctx.request.body || {};
    const { electionId, title, content, type } = body;
    if (!title || !type) return response.paramError(ctx, 'title、type 必填');
    if (!NOTICE_TYPES.includes(type)) return response.paramError(ctx, '公告类型不合法');
    const createdBy = ctx.state.user ? ctx.state.user.userId : null;
    const [result] = await pool.execute(
      `INSERT INTO notices
        (election_id, title, content, type, start_time, end_time, status, is_top, created_by,
         notice_no, stage_key, template_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [electionId || null, title, content || '', type, body.startTime || null, body.endTime || null,
        body.status || '草稿', body.isTop ? 1 : 0, createdBy,
        body.noticeNo || '', body.stageKey || '', body.templateKey || '']
    );
    response.success(ctx, { id: result.insertId });
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '新增公告失败');
  }
}

async function update(ctx) {
  try {
    const body = ctx.request.body || {};
    if (!body.id) return response.paramError(ctx, 'id 必填');
    if (body.type && !NOTICE_TYPES.includes(body.type)) return response.paramError(ctx, '公告类型不合法');
    await pool.execute(
      `UPDATE notices SET title=?, content=?, type=?, start_time=?, end_time=?, status=?, is_top=?, election_id=?,
         notice_no=?, stage_key=?, template_key=? WHERE id=?`,
      [body.title || '', body.content || '', body.type || '村务通知', body.startTime || null, body.endTime || null,
        body.status || '草稿', body.isTop ? 1 : 0, body.electionId || null,
        body.noticeNo || '', body.stageKey || '', body.templateKey || '', body.id]
    );
    response.success(ctx);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '更新公告失败');
  }
}

async function publish(ctx) {
  try {
    const { id, status } = ctx.request.body || {};
    if (!id) return response.paramError(ctx, 'id 必填');
    if (!NOTICE_STATUS.includes(status)) return response.paramError(ctx, '公告状态不合法');
    await pool.execute('UPDATE notices SET status=? WHERE id=?', [status, id]);
    response.success(ctx);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '更新公告状态失败');
  }
}

async function remove(ctx) {
  try {
    const { id } = ctx.request.body || {};
    if (!id) return response.paramError(ctx, 'id 必填');
    await pool.execute('DELETE FROM notices WHERE id=?', [id]);
    response.success(ctx);
  } catch (err) {
    console.error(err);
    response.serverError(ctx, '删除公告失败');
  }
}

const api = {
  get: { list, detail, types, templates },
  post: { generate, add, update, publish, delete: remove },
  config: {
    generate: requireRole('超级管理', '经办', '运营'),
    add: requireRole('超级管理', '经办', '运营'),
    update: requireRole('超级管理', '经办', '运营'),
    publish: requireRole('超级管理', '经办', '运营'),
    delete: requireRole('超级管理', '经办', '运营'),
  },
};

Object.defineProperty(api, '_private', {
  value: { NOTICE_TYPES, NOTICE_STATUS, orgWords, renderTemplate, buildNoticeFromTemplate },
});

module.exports = api;
