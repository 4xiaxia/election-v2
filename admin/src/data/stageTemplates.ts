// 11阶段 × 存档材料 × 模板文件 对照表
// 来源：选举材料_时间线对照表.md + 其他附件材料/ 目录实测
// 有模板的文件放在 /templates/ 静态目录，浏览器可直接下载

export interface StageMaterial {
  no: number;
  name: string;
  file: string | null; // 文件名，null=无模板
  status: '有模板' | '自行记录' | '自行制作' | '现场拍' | '只有图' | '仅有主任的' | '自行归档';
}

export interface StageTemplate {
  stageKey: string;
  stageName: string;
  dateRange: string;
  materials: StageMaterial[];
  noticeNos: string[];
}

export const STAGE_TEMPLATES: StageTemplate[] = [
  {
    stageKey: 'S1', stageName: '前期准备', dateRange: '10/15-10/16',
    materials: [
      { no: 1, name: '①号会议记录（两委联席）', file: null, status: '自行记录' },
      { no: 2, name: '②号会议记录（村民代表会）', file: null, status: '自行记录' },
      { no: 3, name: '③号会议记录（村民会议）', file: null, status: '自行记录' },
      { no: 4, name: '④号会议记录（选委会）', file: null, status: '自行记录' },
      { no: 5, name: '村民代表各小组数额安排表', file: '5.村民代表各小组数额安排表.xlsx', status: '有模板' },
      { no: 6, name: '选举委员会候选人提名表', file: '6.选举委员会候选人提名表.xls', status: '有模板' },
      { no: 7, name: '选委会成员/主任选票', file: null, status: '自行制作' },
      { no: 8, name: '选举委员会选举结果报告', file: '8.选举委员会选举结果报告.docx', status: '有模板' },
    ],
    noticeNos: ['1', '2', '3'],
  },
  {
    stageKey: 'S2', stageName: '选民登记', dateRange: '10/17-10/21',
    materials: [
      { no: 9,  name: '宣传发动标语照片', file: null, status: '现场拍' },
      { no: 10, name: '选民登记照片',     file: null, status: '现场拍' },
    ],
    noticeNos: [],
  },
  {
    stageKey: 'S3', stageName: '名单公布', dateRange: '10/22-10/26',
    materials: [
      { no: 11, name: '选民登记情况报告',     file: '11.选民登记情况报告.docx', status: '有模板' },
      { no: 12, name: '选举选民登记名册',     file: '12.××村第××届村民委会选举参选村民花名册.xlsx', status: '有模板' },
      { no: 13, name: '选民登记情况统计表',   file: '13.选民登记情况统计表.xlsx', status: '有模板' },
      { no: 14, name: '委托投票《委托书》原件', file: '14.委托书.jpg', status: '只有图' },
    ],
    noticeNos: ['4'],
  },
  {
    stageKey: 'S4', stageName: '调整解释', dateRange: '10/27-10/29',
    materials: [],
    noticeNos: [],
  },
  {
    stageKey: 'S5', stageName: '代表&小组长', dateRange: '10/30-11/03',
    materials: [
      { no: 15, name: '⑤号会议记录',           file: null, status: '自行记录' },
      { no: 16, name: '村民代表候选人提名表',   file: '16.村民代表候选人提名表.xls', status: '有模板' },
      { no: 17, name: '村民小组长候选人提名表', file: '17.村民小组长候选人提名表.xls', status: '有模板' },
      { no: 18, name: '代表/小组长/妇女代表选票', file: null, status: '自行制作' },
      { no: 19, name: '村民代表、小组长选举结果报告', file: '19.村民代表、小组长选举结果报告.docx', status: '有模板' },
      { no: 20, name: '村（居）民代表花名册', file: '20.××村第××届村民代表登记册.xls', status: '有模板' },
      { no: 21, name: '村民代表情况统计表', file: '21.村民代表情况统计表.xlsx', status: '有模板' },
      { no: 22, name: '村（居）民小组长花名册', file: '22.××村第××届村民小组长情况统计表.xls', status: '有模板' },
      { no: 23, name: '村民小组长情况统计表', file: '23.村民小组长情况统计表.xlsx', status: '有模板' },
    ],
    noticeNos: ['5', '6', '6-1'],
  },
  {
    stageKey: 'S6', stageName: '提名', dateRange: '11/04-11/06',
    materials: [
      { no: 24, name: '⑥号会议记录',       file: null, status: '自行记录' },
      { no: 25, name: '初步候选人自荐表',   file: '25.初步候选人自荐表.jpg', status: '只有图' },
      { no: 26, name: '初步候选人提名表',   file: '26.初步候选人提名表.jpg', status: '只有图' },
      { no: 27, name: '初步候选人一览表',   file: '27.初步候选人一览表.xlsx', status: '有模板' },
      { no: 28, name: '初步候选人资格审查表', file: '28.初步候选人资格审查表.xlsx', status: '有模板' },
    ],
    noticeNos: ['7', '8'],
  },
  {
    stageKey: 'S7', stageName: '竞选预选', dateRange: '11/07-11/09',
    materials: [
      { no: 29, name: '⑦号会议记录',                 file: null, status: '自行记录' },
      { no: 30, name: '取消初步候选人资格申请表',     file: '30.取消初步候选人资格申请表.jpg', status: '只有图' },
      { no: 31, name: '⑧号会议记录（预选/竞选）',   file: null, status: '自行记录' },
      { no: 32, name: '预选选票',                     file: null, status: '自行制作' },
      { no: 33, name: '委员会成员正式候选人预选结果报告', file: '33.委员会成员候选人预选结果报告.docx', status: '有模板' },
      { no: 34, name: '⑨号会议记录',                 file: null, status: '自行记录' },
    ],
    noticeNos: [],
  },
  {
    stageKey: 'S8', stageName: '资格审查', dateRange: '11/10-11/16',
    materials: [
      { no: 35, name: '候选人资格审查表（11个部门）', file: '34.主任候选人资格审查表.xlsx', status: '仅有主任的' },
    ],
    noticeNos: ['9', '2-1'],
  },
  {
    stageKey: 'S9', stageName: '选举准备', dateRange: '11/17-11/19',
    materials: [
      { no: 36, name: '⑩号会议记录', file: null, status: '自行记录' },
    ],
    noticeNos: ['10', '11', '12', '13', '14', '15'],
  },
  {
    stageKey: 'S10', stageName: '选举日', dateRange: '11/20',
    materials: [
      { no: 37, name: '选举选票',           file: null, status: '自行制作' },
      { no: 38, name: '村民委员会选举结果报告', file: '37.村民委员会选举结果报告.docx', status: '有模板' },
    ],
    noticeNos: ['16'],
  },
  {
    stageKey: 'S11', stageName: '村监会&移交', dateRange: '11/21-11/30',
    materials: [
      { no: 39, name: '⑪号会议记录',                 file: null, status: '自行记录' },
      { no: 40, name: '村务监督委员会候选人提名表',   file: '39.村务监督委员会候选人提名表.xls', status: '有模板' },
      { no: 41, name: '村务监督委员会候选人公示及照片', file: '40.村务监督委员会候选人公示.docx', status: '有模板' },
      { no: 42, name: '⑫号会议记录',                 file: null, status: '自行记录' },
      { no: 43, name: '⑬号会议记录',                 file: null, status: '自行记录' },
      { no: 44, name: '村监会选票',                   file: null, status: '自行制作' },
      { no: 45, name: '村务监督委员会选举结果报告', file: '44.村务监督委员会选举结果报告.docx', status: '有模板' },
      { no: 46, name: '村委会换届选举结果报告单', file: '45.城厢区2021年村委会换届选举结果报告单.doc', status: '有模板' },
      { no: 47, name: '工作记录簿 + 上交选委会印章', file: null, status: '自行归档' },
    ],
    noticeNos: ['17'],
  },
];

/** 按 stageKey 快速查找 */
export const STAGE_TEMPLATE_MAP = Object.fromEntries(
  STAGE_TEMPLATES.map(s => [s.stageKey, s])
);
