---
name: 一期核心业务边界与主链（不可破坏）
description: election-v2 一期已钉死的业务边界、主数据链、角色隔离口径——接手动代码前必读，防跑偏
type: project
---

# 一期核心业务边界与主链

**Why:** 这些边界是夏夏用法规和常识推导出来、反复钉死的。历史上 agent 多次想破坏它们（重建主表、扩全岗位树、把提案伪装成材料、加复杂权限）。
**How to apply:** 动代码前先对照这里；凡是要"重建主链表 / 扩范围 / 造第二真相"的冲动，先停。

## 主数据链（关键锚点是 electionId）
```
users(手机号/角色/归属地) -> villages(村/社区归属地根)
  -> elections(一场换届母档案)
    -> elections.content.timeline(阶段时间轴, 真相源)
    -> positions(主任/副主任/委员岗位)
      -> materials scope=candidate(报名材料) -> candidates(候选人)
      -> roster(在岗花名册)
    -> notices(阶段公告, 一阶段可多条)
    -> materials scope=archive(阶段归档材料)
    -> election_voters(选民登记)
    -> notifications + message_reads(通知/已读)
```
进入某场活动后，岗位/候选人/材料/公告/归档/通知都必须能回到同一个 `elections.id`。

## 10+张表，不重建主链
`users / villages / elections / positions / materials / candidates / notices / notifications / message_reads / logs`，加唯一新增的 `election_voters`（users 表达不了"某人参加某届选民登记"的一对多），和一期最小新增的 `roster`。

## 钉死的认知铁律
- **系统不碰投票**：只做收集材料+展示通知，走到候选人公示就停，线下投票后运营手填结果回填。依据《村委会组织法》第十一条。
- **单一真相源=时间节点链**：岗位状态/能否报名/候选人展示都是"读时间+今天"现算，不独立存。
- **血缘翻转**：材料审核通过 → 事务内自动生候选人(source=material) + 回填 candidate_id 双向闭合。是材料长出候选人，不是先有候选人配材料。
- **两来源**：候选人 source = material(村民自荐线上交材料) / import(运营代录·党组织推荐或线下联名)。两条都是法定来源。
- **手机号压实**：手机号当身份锚，也是"一人一场只报一个岗位"查重钥匙。
- **选举方式≠推荐方式**：electionType/electionMethod 在活动上(法定)；recommendType 在候选人上(怎么上榜)。
- **参与竞选**必须挂具体岗位旁，不能做成母公告泛按钮；**我是选民**是选民登记，放母公告详情。

## 一期只做的竞选岗位
主任 / 副主任 / 委员。三类分开报名、分开计票，副主任不能从委员提拔。妇联/综治/民政等是当选后分工，不是竞选岗位。

## 明确不做（二期或永不）
多商户、复杂组织树、复杂数据隔离、线上投票计票、完整45天自动化、完整47材料、村监会/居监会、村民/居民代表、小组长/楼栋长、党组织岗位/镇聘社工。

## 角色隔离口径（不各建一套结构）
角色只决定入口/筛选/可操作动作，业务事实统一回主链。超管=村级的超集：看全区、可下钻任意村、额外有村居管理/人员角色/系统日志；村级(经办, role='经办')只看本 village_id。数据隔离已在 election-v2/position-v2/candidate-v2/material-v2/notice-v2 生效(villageScope)。不新增"子管理"角色名，落在 `users.role='经办'`。

## 不能删的已有资产
后台导入、材料审核、私信通知、已读记录——只能补强，不能删除重做。
