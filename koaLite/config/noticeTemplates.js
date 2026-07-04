// 18公告填空模板 · 原文一字不改 · {{变量}}挖空 · 村居自适应
// 数据源：2021年村（居）民委员会换届选举公告18种

// 公共变量：几乎每条都出现，前端填一次全局复用
const COMMON_FIELDS = [
  { key: 'townName',    label: '镇（街道）名称', example: '华亭镇' },
  { key: 'villageName', label: '村/社区名称',   example: '霞皋村' },
  { key: 'termNo',      label: '届次',          example: '十五' },   // 填"十五"→正文渲染"第十五届"
  { key: 'issueDate',   label: '落款日期',      example: '2026年10月8日' },
];

// orgType 驱动村居自适应：village=村委会(村民/村) community=居委会(居民/社区)
// body 里用 {{orgResident}}=村民/居民, {{orgUnit}}=村/社区 这类自适应占位符
// {{orgCommittee}}=村民委员会/居民委员会, {{orgElectionCommittee}}=村民选举委员会/居民选举委员会

const TEMPLATES = [
  {
    seq: 1,
    docNo: '1',
    name: '关于确定选举日的公告',
    issuer: '镇（街道）村（居）民委员会选举指导组',
    category: '主线',
    hasEnding: true,
    fields: [
      { key: 'workStartDate', label: '工作开始日期', example: '10月8日' },
      { key: 'electionDate',  label: '选举日',       example: '11月18日' },
    ],
    body: `经{{townName}}镇（街道）{{orgCommittee}}选举指导组研究，并报县（区、管委会）选举指导组同意，{{villageName}}{{orgCommittee}}第{{termNo}}届换届选举工作定于{{workStartDate}}开始，选举日确定为{{electionDate}}。经登记确认具有选民资格的{{orgResident}}，均可参加投票选举。望{{orgResident}}互相转告。
特此公告
{{townName}}镇（街道）村（居）民委员会选举指导组
{{issueDate}}`,
  },
  {
    seq: 2,
    docNo: '2',
    name: '关于村民选举委员会名单的公告',
    issuer: '镇（街道）村村民委员会',
    category: '超范围',
    hasEnding: true,
    fields: [
      { key: 'committeeChairman',     label: '选委会主任', example: '' },
      { key: 'committeeViceChairman', label: '选委会副主任', example: '' },
      { key: 'committeeMember',       label: '选委会委员', example: '' },
    ],
    body: `经{{orgUnit}}推选，产生了组织和主持本村第{{termNo}}届{{orgCommittee}}换届选举工作的{{orgElectionCommittee}}。现将名单公布如下：
主 任：{{committeeChairman}}
副主任：{{committeeViceChairman}}
委 员：{{committeeMember}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgCommittee}}
{{issueDate}}`,
  },
  {
    seq: 3,
    docNo: '3',
    name: '关于选民登记的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'registerStart', label: '登记开始（月 日 时）', example: '' },
      { key: 'registerEnd',   label: '登记结束（月 日 时）', example: '' },
    ],
    body: `经{{townName}}镇（街道）{{orgCommittee}}选举指导组研究确定，本届{{orgCommittee}}选举选民登记时间定为{{registerStart}}至{{registerEnd}}。凡符合法律法规和政策规定的{{orgResident}}，均可在本村{{orgElectionCommittee}}进行选民登记。经选民登记确认后，方可参加投票选举。望{{orgResident}}互相转告。
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 4,
    docNo: '4',
    name: '关于选民名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'objectionDeadline', label: '异议截止（月 日 时）', example: '' },
      { key: 'groupList',         label: '各小组选民名单', example: '（名单附后）' },
    ],
    body: `现将经过登记确认的参加{{villageName}}第{{termNo}}届{{orgCommittee}}选举的选民名单公布如下。如有错漏，请于{{objectionDeadline}}前向{{orgElectionCommittee}}提出。
{{groupList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 5,
    docNo: '5',
    name: '关于村民代表和小组长选举的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '超范围',
    hasEnding: true,
    fields: [
      { key: 'repElectionDate', label: '代表/小组长选举日（月 日）', example: '' },
      { key: 'voteStartTime',   label: '当日开始投票（ 时）', example: '' },
      { key: 'voteEndTime',     label: '当日截止投票（ 时）', example: '' },
      { key: 'voteLocation',    label: '投票地点', example: '' },
    ],
    body: `根据法律法规规定，本村{{orgResident}}代表和{{orgResident}}小组长选举日定为{{repElectionDate}}，当日{{voteStartTime}}开始投票，当日{{voteEndTime}}截止投票。投票地点设在{{voteLocation}}。各小组选民，均应参加投票选举。望{{orgResident}}互相转告。
特此公告
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 6,
    docNo: '6',
    name: '关于村民代表名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '超范围',
    hasEnding: true,
    fields: [
      { key: 'repTotalCount', label: '村民代表总数（ 名）', example: '' },
      { key: 'womenRepCount', label: '妇女代表数（ 名）', example: '' },
      { key: 'repGroupList',  label: '各小组代表名单', example: '' },
    ],
    body: `经依法推选，本村共产生第{{termNo}}届{{orgResident}}代表{{repTotalCount}}，其中妇女代表{{womenRepCount}}。现将名单公布如下：
{{repGroupList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 7,
    docNo: '6-1',
    name: '关于村民小组长、副组长名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '超范围',
    hasEnding: true,
    fields: [
      { key: 'groupLeaderList', label: '各小组组长、副组长名单', example: '' },
    ],
    body: `经依法推选，下列人员分别当选为各{{orgResident}}小组组长和副组长。现将名单公布如下：
{{groupLeaderList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 8,
    docNo: '7',
    name: '关于村民委员会成员初步候选人提名的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '主线',
    hasEnding: true,
    fields: [
      { key: 'memberTotalCount', label: '成员总数（共 人）', example: '' },
      { key: 'chairmanCount',    label: '主任（ 人）', example: '' },
      { key: 'viceChairmanCount',label: '副主任（ 人）', example: '' },
      { key: 'memberCount',      label: '委员（ 人）', example: '' },
      { key: 'womenMemberCount', label: '妇女成员（ 人·单独提名）', example: '' },
      { key: 'nominationStart',  label: '提名开始（月 日 时）', example: '' },
      { key: 'nominationEnd',    label: '提名结束（日 时）', example: '' },
      { key: 'contactPerson',    label: '联系人', example: '' },
      { key: 'contactPhone',     label: '联系电话', example: '' },
    ],
    body: `根据法律法规规定，经{{orgResident}}（代表）会议讨论决定，本村新一届{{orgCommittee}}成员数共{{memberTotalCount}}。其中，主任{{chairmanCount}}、副主任{{viceChairmanCount}}、委员{{memberCount}}、妇女成员{{womenMemberCount}}（单独提名）。
初步候选人提名时间从{{nominationStart}}至{{nominationEnd}}。请有选举权的{{orgResident}}踊跃参加提名。提名表和自荐表请到{{orgCommittee}}办公室领取。
联系人：{{contactPerson}} 联系电话：{{contactPhone}}。
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 9,
    docNo: '8',
    name: '关于村民委员会成员初步候选人名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '主线',
    hasEnding: true,
    fields: [
      { key: 'objectionDeadline',    label: '异议截止（月 日 时）', example: '' },
      { key: 'chairmanCandidate',    label: '主任候选人', example: '' },
      { key: 'viceChairmanCandidate',label: '副主任候选人', example: '' },
      { key: 'memberCandidate',      label: '委员候选人', example: '' },
      { key: 'womenMemberCandidate', label: '妇女成员候选人', example: '' },
    ],
    body: `经登记参加选举的{{orgResident}}提名和自荐，产生{{villageName}}第{{termNo}}届{{orgCommittee}}成员候选人。如有错漏，请于{{objectionDeadline}}前向{{orgElectionCommittee}}提出。现将名单按姓氏笔画顺序公布如下：
主任候选人：{{chairmanCandidate}}
副主任候选人：{{viceChairmanCandidate}}
委员候选人：{{memberCandidate}}
妇女成员候选人：{{womenMemberCandidate}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 10,
    docNo: '9',
    name: '关于村民委员会成员正式候选人名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '主线',
    hasEnding: true,
    fields: [
      { key: 'chairmanCandidate',    label: '主任候选人', example: '' },
      { key: 'viceChairmanCandidate',label: '副主任候选人', example: '' },
      { key: 'memberCandidate',      label: '委员候选人', example: '' },
      { key: 'womenCandidate',       label: '妇女候选人', example: '' },
    ],
    body: `经依法提名并通过镇（街道）、县（区、管委会）资格审查，产生{{villageName}}第{{termNo}}届{{orgCommittee}}成员正式候选人。现将名单公布如下：
主任候选人：{{chairmanCandidate}}
副主任候选人：{{viceChairmanCandidate}}
委员候选人：{{memberCandidate}}
妇女候选人：{{womenCandidate}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 11,
    docNo: '10',
    name: '关于村民委员会选举投票时间和地点的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '主线',
    hasEnding: false,
    fields: [
      { key: 'centerStation',  label: '中心投票站地点', example: '' },
      { key: 'subStation',     label: '投票分站地点', example: '' },
      { key: 'voteDate',       label: '投票日期（月 日）', example: '' },
      { key: 'voteStartTime',  label: '投票开始时间（ 时）', example: '' },
      { key: 'voteEndTime',    label: '投票截止时间（ 时）', example: '' },
      { key: 'mobileBoxStart', label: '流动票箱开始（月 日 时）', example: '' },
      { key: 'mobileBoxEnd',   label: '流动票箱结束（ 时）', example: '' },
      { key: 'mobileBoxRoute', label: '流动票箱路线（时 从…出发，沿…）', example: '' },
      { key: 'countTime',      label: '开箱计票时间（月 日 时）', example: '' },
      { key: 'countPlace',     label: '开箱计票地点', example: '' },
    ],
    body: `经{{orgElectionCommittee}}研究，决定本村{{orgCommittee}}选举的投票站地点和投票时间如下：
中心投票站设在{{centerStation}}，投票分站设在{{subStation}}。
具体投票时间为{{voteDate}}{{voteStartTime}}至{{voteEndTime}}。
流动票箱使用为{{mobileBoxStart}}至{{mobileBoxEnd}}，路线为：{{mobileBoxRoute}}。
开箱计票时间为{{countTime}}，地点在{{countPlace}}。
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 12,
    docNo: '11',
    name: '关于选举工作人员名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'ticketReader',  label: '唱票员', example: '' },
      { key: 'ticketCounter', label: '计票员', example: '' },
      { key: 'ticketMonitor', label: '监票员', example: '' },
      { key: 'mobileBoxStaff',label: '流动票箱工作人员', example: '' },
    ],
    body: `经{{orgElectionCommittee}}研究决定，本村{{orgCommittee}}选举的工作人员名单如下：
唱票员：{{ticketReader}}
计票员：{{ticketCounter}}
监票员：{{ticketMonitor}}
流动票箱工作人员：{{mobileBoxStaff}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 13,
    docNo: '12',
    name: '关于流动票箱投票人员名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'mobileVoterList', label: '流动票箱投票人员名单（含"因："原因）', example: '' },
    ],
    body: `经本人申请和{{orgElectionCommittee}}研究，确定本村{{orgCommittee}}选举使用流动票箱投票人员名单如下：
{{mobileVoterList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 14,
    docNo: '13',
    name: '关于委托投票名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'entrustList', label: '受委托人/委托人名单', example: '' },
    ],
    body: `根据法律法规规定，以下登记参加选举的{{orgResident}}在选举日外出不能回村参加投票，且在规定时限内办理了委托投票手续。经{{orgElectionCommittee}}审核，人员名单如下：
{{entrustList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 15,
    docNo: '14',
    name: '关于代写人员名单的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'proxyWriterList', label: '要求代写人员/委托代写员名单', example: '' },
    ],
    body: `经本人申请和{{orgElectionCommittee}}研究确定，本村{{orgCommittee}}选举要求代写人员和代写员名单如下：
{{proxyWriterList}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 16,
    docNo: '15',
    name: '关于无效票认定规则的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '配套',
    hasEnding: true,
    fields: [
      { key: 'invalidRules', label: '无效票认定规则（1. 2. 3. …）', example: '' },
    ],
    body: `经{{orgElectionCommittee}}讨论决定，本村{{orgCommittee}}选举无效票认定的具体规则如下：
{{invalidRules}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 17,
    docNo: '16',
    name: '关于村民委员会选举结果的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '主线',
    hasEnding: true,
    fields: [
      { key: 'chairmanElected',    label: '当选主任', example: '' },
      { key: 'viceChairmanElected',label: '当选副主任', example: '' },
      { key: 'memberElected',      label: '当选委员', example: '' },
    ],
    body: `根据法律法规和政策规定，经全体选民直接投票，下列人员当选为{{villageName}}第{{termNo}}届{{orgCommittee}}主任、副主任和委员。现将名单公布如下：
主 任：{{chairmanElected}}
副主任：{{viceChairmanElected}}
委 员：{{memberElected}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
  {
    seq: 18,
    docNo: '17',
    name: '关于村务监督委员会成员选举结果的公告',
    issuer: '镇（街道）村村民选举委员会',
    category: '超范围',
    hasEnding: true,
    fields: [
      { key: 'supervisorChairman', label: '监委会主任', example: '' },
      { key: 'supervisorMember',   label: '监委会委员', example: '' },
    ],
    body: `根据《中华人民共和国村民委员会组织法》和《福建省实施<中华人民共和国村民委员会组织法>办法》的规定，经选举，下列人员当选为本村新一届村务监督委员会主任和委员：
主 任：{{supervisorChairman}}
委 员：{{supervisorMember}}
特此公告
{{townName}}镇（街道）{{villageName}}{{orgElectionCommittee}}
{{issueDate}}`,
  },
];

module.exports = { COMMON_FIELDS, TEMPLATES };
