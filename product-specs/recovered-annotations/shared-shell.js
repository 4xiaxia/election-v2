/* ============================================================
 * shared-shell.js · 全站共享侧边栏(书香红金)
 * 用法:子页面 <body> 末尾加  <script src="shared-shell.js" data-active="提案审批"></script>
 * 原理:只在 body 最前面插入侧边栏,用 CSS 把原内容整体右移。
 *      绝不搬动、不改动页面原有 DOM 和 onclick,交互完全保留。
 * 改这一个文件,全站侧边栏一起变。
 * ============================================================ */
(function () {
  var cur = document.currentScript ? (document.currentScript.getAttribute('data-active') || '') : '';

  var NAV = [
    { g: '', items: [
      { ic: '🏠', t: '首页工作台', href: '村长仪表盘-美化版.html' },
      { ic: '📄', t: '提案审批', href: '页面-提案审批.html' },
      { ic: '🗳️', t: '选举活动管理', href: '页面-活动总列表.html' }
    ]},
    { g: '办理中', items: [
      { ic: '👥', t: '岗位管理', href: '页面-岗位管理.html' },
      { ic: '📝', t: '材料提交管理', href: '页面-业务模块.html?module=materials' },
      { ic: '🙋', t: '候选人管理', href: '页面-业务模块.html?module=candidates' },
      { ic: '📢', t: '公告通知', href: '页面-业务模块.html?module=notices' }
    ]},
    { g: '收尾归档', items: [
      { ic: '🗄️', t: '历史归档', href: '页面-业务模块.html?module=archives' }
    ]}
  ];

  // CSS:侧边栏固定在左,body 整体加左边距给它让位(不改内部结构)
  var css = ''
    + 'body{margin-left:210px !important;}'
    + '.ss-side{position:fixed;top:0;left:0;width:210px;height:100vh;overflow-y:auto;background:linear-gradient(180deg,#1C1C1C,#2A2A2A);color:#F0EDE8;padding:24px 0;z-index:1000;font-family:"Noto Sans SC",sans-serif;}'
    + '.ss-brand{padding:0 22px 20px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:14px;}'
    + '.ss-kick{font-size:10px;letter-spacing:2px;color:#C8A45C;font-weight:600;margin-bottom:6px;}'
    + '.ss-brand h1{font-family:"Noto Serif SC",serif;font-size:15px;font-weight:700;color:#F5F2EC;line-height:1.5;margin:0;}'
    + '.ss-grp{padding:0 12px;margin-bottom:8px;}'
    + '.ss-glabel{font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.3);padding:12px 12px 6px;font-weight:600;}'
    + '.ss-item{display:flex;align-items:center;gap:9px;padding:9px 12px;color:rgba(255,255,255,.55);border-radius:7px;font-size:13px;transition:all .18s;margin-bottom:1px;text-decoration:none;}'
    + '.ss-item:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.9);}'
    + '.ss-item.on{background:rgba(178,34,34,.28);color:#fff;font-weight:500;}'
    + '.ss-item.on .ss-ic{color:#C8A45C;}'
    + '.ss-ic{width:18px;text-align:center;font-size:14px;}'
    + '@media(max-width:900px){body{margin-left:0 !important;}.ss-side{display:none;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var navHtml = '<div class="ss-brand"><div class="ss-kick">城厢区换届选举</div><h1>涧口社区 · 工作台</h1></div>';
  NAV.forEach(function (grp) {
    navHtml += '<div class="ss-grp">';
    if (grp.g) navHtml += '<div class="ss-glabel">' + grp.g + '</div>';
    grp.items.forEach(function (it) {
      var on = (it.t === cur) ? ' on' : '';
      navHtml += '<a class="ss-item' + on + '" href="' + it.href + '"><span class="ss-ic">' + it.ic + '</span>' + it.t + '</a>';
    });
    navHtml += '</div>';
  });

  var side = document.createElement('aside');
  side.className = 'ss-side';
  side.innerHTML = navHtml;
  document.body.insertBefore(side, document.body.firstChild);
})();
