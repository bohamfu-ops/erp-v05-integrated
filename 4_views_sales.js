<script>
/* ================= 共用片段 ================= */
const pill = (t, k) => `<span class="pill p-${k}">${t}</span>`;
const mono = s => `<span class="m">${s}</span>`;
const piBtn = pi => `<button type="button" class="btn sm" data-go="contract|${pi}">${pi}</button>`;
const goBtn = (spec, t) => `<button type="button" class="btn sm" data-go="${spec}">${t}</button>`;
function table(head, rows, opt = {}) {
  const n = opt.num || [];
  return `<div class="tbl"><table><thead><tr>${head.map((h, i) => `<th class="${n.includes(i) ? 'n' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, ri) => `<tr ${opt.click ? `class="click ${opt.sel && opt.sel(ri) ? 'sel' : ''}" ${opt.click(ri)}` : ''}>${r.map((c, i) => `<td class="${n.includes(i) ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const head = (t, p, right = '') => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div>${right}</div>`;
const flow = steps => `<div class="lvl" style="margin-bottom:14px">${steps.map((s, i) => `${i ? '<span class="sep">→</span>' : ''}<span class="chip ${s[1] ? 'on' : ''}">${s[0]}</span>`).join('')}</div>`;
function spark(arr, color) {
  const w = 88, h = 32, max = Math.max(...arr), min = Math.min(...arr), r = max - min || 1;
  const pts = arr.map((v, i) => [i / (arr.length - 1) * (w - 4) + 2, h - 4 - (v - min) / r * (h - 8)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '), last = pts[pts.length - 1];
  return `<svg class="sp" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polygon points="2,${h - 2} ${line} ${w - 2},${h - 2}" fill="${color}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5" fill="${color}"/></svg>`;
}
function scStatus(c) {
  if (c.block) return pill('待审批', 'warn');
  const n = NODES[c.type];
  if (c.node >= n.length - 1) return pill('已完成', 'ok');
  if (c.late) return pill(`${n[c.node]} · 逾期 ${c.late} 天`, 'bad');
  return pill(n[c.node], 'run');
}
const stepper = (n, cur) => `<div class="stepper">${n.map((x, i) => `<div class="st ${i < cur ? 'done' : i === cur ? 'now' : ''}"><span class="dot">${i < cur ? ic('check') : ''}</span>${x}</div>`).join('')}</div>`;
const agingBucket = d => d <= 0 ? '未到期' : d <= 30 ? '1–30 天' : d <= 60 ? '31–60 天' : d <= 90 ? '61–90 天' : d <= 180 ? '91–180 天' : '180 天以上';
const BUCKETS = [['未到期', 'var(--accent)'], ['1–30 天', 'var(--ok)'], ['31–60 天', 'var(--warn)'], ['61–90 天', '#D9822B'], ['91–180 天', 'var(--bad)'], ['180 天以上', '#8E1B13']];
const MODE = { 保留: 'run', 合并: 'ok', 自动: 'yz', 升级: 'ok', 拆分: 'yz', 暂不纳入: 'mute' };

const V = {};

V.req = () => {
  const c = ALL.filter(r => S.choice[r[0]]), n = k => ALL.filter(r => S.choice[r[0]] === k).length;
  const pct = Math.round(c.length / ALL.length * 100);
  return head('需求确认', `一体化版：易助的功能全部纳入本系统，共 ${ALL.length} 项。标“新增”的是易助没有、本系统补上的。`,
    `<div class="toolbar"><button class="btn" type="button" data-act="apply">${ic('check')}全部按我们的建议选</button><button class="btn" type="button" data-act="reset">${ic('reset')}清空选择</button></div>`) + `
  <div class="card">
    <h3>进度 <small>已确认 ${c.length} / ${ALL.length} 项</small></h3>
    <div class="req-sum"><div><b>${n('yes')}</b><span>要</span></div><div><b>${n('later')}</b><span>之后再说</span></div><div><b>${n('no')}</b><span>不要</span></div><div><b>${n('talk')}</b><span>待讨论</span></div></div>
    <div class="req-prog"><i style="width:${pct}%"></i></div>
    <p class="note">标签：<span class="rec rm">必要</span> 系统要运作一定要有；<span class="rec r1">建议一期</span>；<span class="rec r2">建议二期</span>；<span class="rec ro">可选</span>；<span class="rec new">新增</span> 易助没有的功能。每个易助功能放在哪里，见 <button class="btn sm" type="button" data-go="map">易助功能对照</button>。</p>
  </div>` +
  REQ.map(([g, sub, items]) => `<section class="req-group"><h2>${g}<small>${sub}</small></h2><div class="req-list">${items.map(([id, name, rec, who, when, what, result, why, demo, isNew]) => `
    <article class="req" data-c="${S.choice[id] || ''}">
      <div class="hd"><b>${name}</b><span class="toolbar" style="gap:4px">${isNew ? '<span class="rec new">新增</span>' : ''}<span class="rec ${rec}">${REC[rec]}</span></span></div>
      <dl class="scn"><dt>谁</dt><dd>${who}</dd><dt>情境</dt><dd>${when}</dd><dt>操作</dt><dd>${what}</dd><dt>结果</dt><dd>${result}</dd></dl>
      ${why ? `<div class="why">${why}</div>` : ''}
      <div class="choose" role="group" aria-label="${name}">${Object.entries(CH).map(([k, t]) => `<button type="button" data-req="${id}" data-v="${k}" aria-pressed="${S.choice[id] === k}">${t}</button>`).join('')}<button type="button" class="go" data-go="${demo}">看演示 ${ic('arrow')}</button></div>
      <label class="fb" for="note-${id}">意见或补充说明<textarea id="note-${id}" data-note="${id}" rows="2" placeholder="例如：我们现在的做法是……／希望增加……">${esc(S.note[id] || '')}</textarea></label>
    </article>`).join('')}</div></section>`).join('') + `
  <section class="req-group"><h2>导出结果<small>复制后贴到微信或邮件发给我们</small></h2>
    <div class="card export"><label class="fb" for="note-_all" style="margin-bottom:12px">其他意见<textarea id="note-_all" data-note="_all" rows="4" placeholder="例如：希望手机上能查库存……">${esc(S.note._all || '')}</textarea></label><textarea id="exportText" readonly aria-label="确认结果">${exportText()}</textarea>
    <div class="toolbar" style="margin-top:10px"><button class="btn pri" type="button" data-act="copy">${ic('copy')}复制结果</button><span class="note" style="margin:0">选择会保存在这台电脑的浏览器里。</span></div></div>
  </section>`;
};

V.map = () => {
  const modes = ['全部', '保留', '合并', '自动', '升级', '拆分', '暂不纳入'];
  const list = MAP.filter(m => S.mapF === '全部' || m[3] === S.mapF);
  const cnt = k => MAP.filter(m => m[3] === k).length;
  const covered = MAP.filter(m => m[2]).length;
  return head('易助功能对照', '易助的每个功能，在本系统放在哪一页、怎么处理。每个功能只有一个归属，不会在两个地方重复录入。') + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">易助功能（按录屏整理）</div><div class="v">${MAP.length}</div></div>
    <div class="card kpi"><div class="k">已纳入本系统</div><div class="v up">${covered}</div><div class="d">${Math.round(covered / MAP.length * 100)}%</div></div>
    <div class="card kpi"><div class="k">合并或自动化</div><div class="v">${cnt('合并') + cnt('自动')}</div><div class="d">原本要开多张单的，现在一步完成</div></div>
    <div class="card kpi"><div class="k">暂不纳入</div><div class="v">${cnt('暂不纳入')}</div><div class="d">行政办公、委托代销，待确认</div></div>
  </div>
  <div class="card mt"><h3>设计原则</h3><div class="grid g3">
    <div><b>一份资料只录一次</b><p class="note">报价带到 PI，PI 带到工单与采购，出运带出出库与发票，收款带出核销与凭证。</p></div>
    <div><b>前一步自动产生下一步</b><p class="note">易助要手动开的销货单、生产计划、请购、凭证，改由上一张单据审核后自动产生。</p></div>
    <div><b>相似的单据合成一个流程</b><p class="note">四种检验合成一个队列；询价、核价、底稿合到请购上比价；收款与核销一次完成。</p></div>
  </div></div>
  <div class="toolbar mt" style="margin-bottom:12px"><div class="filters">${modes.map(f => `<button type="button" data-act="mapF" data-id="${f}" aria-pressed="${S.mapF === f}">${f}${f === '全部' ? '' : ' ' + cnt(f)}</button>`).join('')}</div></div>` +
  table(['易助模块', '易助功能', '本系统位置', '处理方式', '说明'], list.map(m => [m[0], `<span class="wrap">${m[1]}</span>`, m[2] ? goBtn(m[2], (TITLE[m[2]] || ['', m[2]])[1]) : '—', pill(m[3], MODE[m[3]]), `<span class="wrap">${m[4]}</span>`]));
};

V.dash = () => {
  const lk = curLock(), od = overdueAmt();
  const short = DB.mrp.filter(m => shortage(m) > 0).length, qc = DB.inbound.filter(x => x.st === '待检验').length;
  const apDue = DB.ap.filter(x => x.st === '本周到期').reduce((a, x) => a + x.amt, 0);
  const months = [['6月', 186], ['7月', 214], ['8月', 198], ['9月', 241], ['10月', 263], ['11月', 228]];
  const max = 300, cw = 520, chh = 170;
  const bars = months.map(([m, v], i) => { const x = 46 + i * 78, hh = v / max * (chh - 30), y = chh - 10 - hh; return `<rect x="${x}" y="${y.toFixed(1)}" width="40" height="${hh.toFixed(1)}" rx="5" fill="var(--accent)" opacity="${i === months.length - 1 ? 1 : .32}"/><text x="${x + 20}" y="${chh + 6}" text-anchor="middle">${m}</text><text x="${x + 20}" y="${(y - 6).toFixed(1)}" text-anchor="middle" style="fill:var(--ink)">${v}</text>`; }).join('');
  const grid = [0, 100, 200, 300].map(v => { const y = chh - 10 - v / max * (chh - 30); return `<line x1="34" x2="${cw}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="28" y="${(y + 4).toFixed(1)}" text-anchor="end">${v}</text>`; }).join('');
  const todo = [
    ...DB.approvals.filter(a => a.status === '待审批').map(a => [`审批：${a.type}`, mono(a.ref), goBtn('approvals', '去审批')]),
    ...DB.receipts.filter(r => !r.claimed).map(r => [`到账待认领 USD ${fmt(r.amt)}`, mono(r.id), goBtn('ar', '去认领')]),
    ...(short ? [[`${short} 种料件缺料`, mono('物料需求'), goBtn('mrp', '去请购')]] : []),
    ...(qc ? [[`${qc} 笔收货待检验`, mono('收货与检验'), goBtn('inbound', '去检验')]] : []),
    ...DB.ap.filter(x => x.st === '待核对').map(x => [`采购发票单价不一致 · ${supOf(x.sup).name}`, mono(x.id), goBtn('ap', '去核对')])
  ];
  return head('工作台', `早上好，林晓。今天是 11 月 18 日，有 ${todo.length} 件事要处理。`, `<button class="btn" type="button" data-act="toast" data-msg="已导出本月经营报表 Excel（演示）">导出报表</button>`) + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">本月出运（千美元）</div><div class="row"><div><div class="v">228</div><div class="d up">比上月同期 +6%</div></div>${spark([186, 214, 198, 241, 263, 228], 'var(--accent)')}</div></div>
    <div class="card kpi"><div class="k">逾期应收</div><div class="row"><div><div class="v">USD ${fmt(od / 1000, 1)}k</div><div class="d dn">${arOpen().filter(r => daysPast(r.due) > 0).length} 张发票逾期</div></div>${spark([38, 52, 61, 70, 68, od / 1000], 'var(--bad)')}</div></div>
    <div class="card kpi"><div class="k">本周应付到期</div><div class="row"><div><div class="v">¥${fmt(apDue)}</div><div class="d">光芯电子 11-20</div></div>${spark([20, 32, 28, 41, 36, apDue / 1000], 'var(--warn)')}</div></div>
    <div class="card kpi"><div class="k">本月锁定汇率</div><div class="row"><div><div class="v">${lk[1].toFixed(4)}</div><div class="d">USD/CNY</div></div>${spark(DB.fx.daily.map(d => d[1]), 'var(--yz)')}</div></div>
  </div>
  <div class="grid g32 mt">
    <div class="card"><h3>出运金额趋势 <small>千美元</small></h3><svg class="chart" viewBox="0 0 ${cw} ${chh + 14}" role="img" aria-label="近六个月出运金额，十月最高为 263 千美元" style="width:100%;height:auto">${grid}${bars}</svg></div>
    <div class="card"><h3>待办 <small>${todo.length} 项</small></h3>${table(['事项', '单号', ''], todo)}</div>
  </div>
  <div class="card mt"><h3>进行中合同</h3>${table(['PI', '客户', '当前节点', '工单进度', '缺料', '预计出货'], DB.contracts.filter(c => c.node < 9).map(c => {
    const w = DB.wos.filter(x => c.wo.includes(x.id)), d = w.reduce((a, x) => a + x.done, 0), q = w.reduce((a, x) => a + x.qty, 0);
    const sh = DB.mrp.filter(m => m.for === c.pi && shortage(m) > 0).map(m => m.item);
    return [piBtn(c.pi), custOf(c.cust).short, scStatus(c), q ? `${fmt(d)} / ${fmt(q)}` : '—', sh.length ? pill(sh.join('、'), 'bad') : '—', c.pi === 'PI20261028ALT' ? '11-24' : c.pi === 'PI20261103KEP' ? '11-28' : c.pi === 'HT20261108YF' ? '12-03' : '待定'];
  }))}</div>`;
};

V.approvals = () => head('审批中心', '报价、合同、变更、采购、付款都在这里审批，也会推送到企业微信') + `
  <div class="grid g32">
    <div class="card"><h3>审批事项 <small>${pendingAp()} 项待处理</small></h3>${table(['单号', '类型', '关联', '说明', '申请人', '进度', ''], DB.approvals.map(a => [mono(a.id), a.type, goBtn(a.go, a.ref), `<span class="wrap">${a.detail}</span>`, a.who,
      a.status === '待审批' ? pill(a.step, 'warn') : a.status === '已核准' ? pill('已核准', 'ok') : pill('已退回', 'mute'),
      a.status === '待审批' ? `<div class="toolbar"><button class="btn sm pri" type="button" data-act="approve" data-id="${a.id}">核准</button><button class="btn sm dng" type="button" data-act="reject" data-id="${a.id}">退回</button></div>` : '']))}
    <p class="note">层级与门槛在 ${goBtn('apprset', '审批设置')} 调整。</p></div>
    <div class="card"><h3>企业微信推送预览</h3><div class="phone"><div class="pc"><h5>光数外贸 · 待审批</h5>${DB.approvals.filter(a => a.status === '待审批').slice(0, 2).map(a => `<div style="border-top:1px solid var(--line);padding-top:6px;margin-top:6px"><b>${a.type}</b><br><span style="color:var(--muted)">${a.ref} · ${a.detail}</span></div>`).join('') || '<span style="color:var(--muted)">目前没有待审批</span>'}<div class="toolbar" style="margin-top:10px"><span class="btn sm pri">打开处理</span></div></div></div></div>
  </div>`;

V.customers = () => {
  const list = DB.customers.filter(c => S.custF === '全部' || c.pool === S.custF || c.type === S.custF);
  return head('客户', '公海与私海 · 30 天没跟进自动回公海 · 点一行打开客户中心', `<button class="btn pri" type="button" data-act="toast" data-msg="已新增客户（演示）">${ic('plus')}新增客户</button>`) + `
  <div class="toolbar" style="margin-bottom:12px"><div class="filters">${['全部', '私海', '公海', '外销', '内销'].map(f => `<button type="button" data-act="custF" data-id="${f}" aria-pressed="${S.custF === f}">${f}</button>`).join('')}</div></div>` +
    table(['客户', '国家', '币种', '等级', '归属业务', '未收（原币）', '沟通', '最近跟进', ''], list.map(c => {
      const due = arOpen().filter(r => r.cust === c.id).reduce((a, r) => a + r.amt - r.got, 0);
      return [`<b>${c.name}</b>`, c.country, c.cur, c.level, c.sales, due ? `${c.cur} ${fmt(due)}` : '—', c.ch, c.last, c.pool === '公海' ? `<button class="btn sm" type="button" data-act="claimCust" data-id="${c.id}">领取</button>` : pill('私海', 'run')];
    }), { num: [5], click: i => `data-act="openCust" data-id="${list[i].id}"` });
};
function custDrawer(id) {
  const c = custOf(id), scs = DB.contracts.filter(x => x.cust === id);
  const ar = arOpen().filter(r => r.cust === id), due = ar.reduce((a, r) => a + r.amt - r.got, 0), od = ar.filter(r => daysPast(r.due) > 0).reduce((a, r) => a + r.amt - r.got, 0);
  const ordered = scs.filter(x => x.node < 5).reduce((a, x) => a + total(x), 0), shipped = scs.filter(x => x.node >= 5 && x.node < 9).reduce((a, x) => a + total(x), 0), used = due + ordered;
  return `<div class="dh"><div><h2>${c.name}</h2><p class="note" style="margin:3px 0 0">${c.country} · ${c.level} 级 · 归属 ${c.sales}</p></div><button class="x" type="button" data-act="close" aria-label="关闭">${ic('x')}</button></div>
  <div class="mini"><div><span>未收应收</span><b>${c.cur} ${fmt(due)}</b></div><div><span>其中逾期</span><b class="${od ? 'dn' : ''}">${c.cur} ${fmt(od)}</b></div><div><span>已订未出</span><b>${c.cur} ${fmt(ordered)}</b></div><div><span>已出未收</span><b>${c.cur} ${fmt(shipped)}</b></div><div><span>信用额度</span><b>${c.cur} ${fmt(c.credit)}</b></div><div><span>额度已用</span><b class="${used > c.credit ? 'dn' : ''}">${Math.round(used / c.credit * 100)}%</b></div></div>
  <div class="kv sep"><div><span>联系人</span>${c.contact}</div><div><span>沟通渠道</span>${c.ch}</div><div><span>付款条件</span>${c.terms}</div><div><span>业务类型</span>${c.type}</div></div>
  <h3>合同</h3>${scs.length ? table(['PI', '金额', '状态'], scs.map(x => [piBtn(x.pi), `${x.cur} ${fmt(total(x), 2)}`, scStatus(x)]), { num: [1] }) : '<p class="note">还没有合同。</p>'}
  ${ar.length ? `<h3>未收发票</h3>${table(['发票', '到期', '未收', '账龄'], ar.map(r => [mono(r.inv), r.due, `${r.cur} ${fmt(r.amt - r.got)}`, daysPast(r.due) > 0 ? pill(`逾期 ${daysPast(r.due)} 天`, 'bad') : pill('未到期', 'mute')]), { num: [2] })}` : ''}
  <h3>跟进记录</h3><div class="timeline">${c.follow.map(f => `<div><span class="t">${f[0]}</span><span class="d"></span><span><b>${f[1]}</b> · ${f[2]}</span></div>`).join('')}</div>
  <h3>${c.ch} 对话归档</h3><div class="chat">${c.chat.map(m => `<div class="bubble ${m[0] === '我' ? 'me' : ''}"><small>${m[0] === '我' ? c.sales : c.contact.split('（')[0]} · ${m[1]}</small>${esc(m[2])}</div>`).join('')}</div>
  <div class="toolbar" style="margin-top:18px"><button class="btn pri" type="button" data-act="toast" data-msg="已新增跟进记录（演示）">新增跟进</button><button class="btn" type="button" data-act="toast" data-msg="已移交给陈一凡（演示）">移交给其他业务</button></div>`;
}

V.quote = () => {
  const q = S.q, p = prodOf(q.prod), cu = custOf(q.cust);
  const bom = DB.boms[q.prod], matCost = bom ? bom.reduce((a, b) => a + b[1] * DB.mats[b[0]][2], 0) : null;
  const rebate = q.cost / 1.13 * q.rebate / 100, unit = q.cost - rebate + q.extra;
  const price = unit / q.fx / (1 - q.margin / 100) / (1 - q.comm / 100) + q.freight;
  const profit = (price - q.freight) * q.fx * (1 - q.comm / 100) - unit, rate = profit / ((price - q.freight) * q.fx) * 100, low = rate < 12;
  S.calc = { price, rate };
  const f = (k, lab, step) => `<label for="q-${k}">${lab}<input id="q-${k}" type="number" step="${step}" value="${q[k]}" data-q="${k}"></label>`;
  return head('报价', '试算后保存为报价单，每次改价留一版；毛利低于 12% 自动送审，核准后一键转 PI') + `
  <div class="grid g2">
    <div class="card"><h3>成本与条件</h3><div class="form">
      <label for="q-cust">客户<select id="q-cust" data-qs="cust">${DB.customers.filter(c => c.type === '外销').map(c => `<option value="${c.id}" ${c.id === q.cust ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      <label for="q-prod">产品（客户品号）<select id="q-prod" data-qs="prod">${DB.products.map(x => `<option value="${x.code}" ${x.code === q.prod ? 'selected' : ''}>${x.code} · ${x.name}</option>`).join('')}</select></label>
      ${f('cost', '含税成本（元／只）', 1)}${f('rebate', '出口退税率（%）', 1)}
      ${f('fx', '报价汇率（USD/CNY）', 0.0001)}${f('extra', '包装与杂费（元／只）', 0.5)}
      ${f('freight', '运费分摊（USD／只）', 0.05)}${f('qty', '数量（只）', 10)}
      ${f('comm', '佣金（%）', 0.5)}${f('margin', '目标利润率（%）', 0.5)}
    </div><p class="note">成本默认带入本系统的月加权平均成本${matCost ? `；BOM 材料成本约 ¥${fmt(matCost, 2)}／只` : ''}。汇率默认带入本月锁定汇率 ${curLock()[1].toFixed(4)}。</p></div>
    <div class="card"><h3>报价结果 <small>${cu.short} · ${p.name}</small></h3><div class="res">
      <div><span>退税（元／只）</span><span class="m">${fmt(rebate, 2)}</span></div>
      <div><span>实际成本（元／只）</span><span class="m">${fmt(unit, 2)}</span></div>
      <div><span>每只利润（元）</span><span class="m">${fmt(profit, 2)}</span></div>
      <div><span>毛利率</span><span>${low ? pill(fmt(rate, 1) + '%，低于 12% 需审批', 'warn') : pill(fmt(rate, 1) + '%', 'ok')}</span></div>
      <div><span>合计（${fmt(q.qty)} 只）</span><span class="m">USD ${fmt(price * q.qty, 2)}</span></div>
      <div class="big"><span>报价（USD／只）</span><span class="m">${fmt(price, 2)}</span></div>
    </div>
    <div class="toolbar" style="margin-top:14px"><button class="btn pri" type="button" data-act="saveQuote">${low ? '保存并送审批' : '保存报价单'}</button><button class="btn" type="button" data-act="toast" data-msg="已生成英文报价单 PDF（演示）">英文报价单</button><button class="btn" type="button" data-act="toast" data-msg="已附加规格书 PDF（演示）">${ic('clip')}附件</button></div></div>
  </div>
  <div class="card mt"><h3>报价单</h3>${table(['报价单', '版本', '客户', '产品', '数量', '单价 USD', '毛利率', '附件', '状态', ''], DB.quotes.map(x => [mono(x.id), 'V' + x.ver, custOf(x.cust).short, prodOf(x.prod).name, fmt(x.qty), fmt(x.price, 2), fmt(x.margin, 1) + '%', x.att,
    x.status === '待审批' ? pill('待审批', 'warn') : x.status === '已批准' ? pill('已批准', 'ok') : x.status === '已发客户' ? pill('已发客户', 'yz') : pill('已转合同', 'run'),
    x.status === '已批准' || x.status === '已发客户' ? `<button class="btn sm pri" type="button" data-act="toContract" data-id="${x.id}">转 PI</button>` : x.pi ? piBtn(x.pi) : x.status === '待审批' ? goBtn('approvals', '去审批') : '']), { num: [4, 5, 6, 7] })}</div>
  <div class="card mt"><h3>版本记录 <small>BJ2026110301 · Kepler</small></h3>${table(['版本', '日期', '单价', '说明'], DB.quoteVers.map(v => [v[0], v[1], v[2], `<span class="wrap">${v[3]}</span>`]))}</div>`;
};

V.contracts = () => {
  const list = DB.contracts.filter(c => S.scF === '全部' || c.type === S.scF || (S.scF === '待收款' && c.pay.some(p => p[3] !== '已收')));
  return head('合同（PI）', '一张 PI 就是合同，也是订单；确认后自动产生工单建议与物料需求', `<button class="btn pri" type="button" data-go="quote">${ic('plus')}新建合同</button>`) + `
  <div class="toolbar" style="margin-bottom:12px"><div class="filters">${['全部', '外销', '内销', '待收款'].map(f => `<button type="button" data-act="scF" data-id="${f}" aria-pressed="${S.scF === f}">${f}</button>`).join('')}</div></div>` +
    table(['PI／合同号', '客户', '归属业务', '贸易条件', '金额', '当前节点', '工单', '版本', ''], list.map(c => [`<b class="m">${c.pi}</b>`, custOf(c.cust).short, c.sales, c.term, `${c.cur} ${fmt(total(c), 2)}`, scStatus(c), c.wo.length ? c.wo.length + ' 张' : '—', 'V' + String(c.ver).padStart(3, '0'), goBtn('contract|' + c.pi, '打开')]), { num: [4] });
};

V.contract = () => {
  const c = scOf(S.arg) || DB.contracts[0], cu = custOf(c.cust);
  const paid = c.pay.filter(p => p[3] === '已收').reduce((a, p) => a + p[1], 0);
  const chg = DB.changes.filter(x => x.pi === c.pi), sh = DB.ships.find(s => s.id === c.ship);
  const tabs = [['lines', '明细'], ['pay', '款项'], ['change', `变更${chg.length ? ' ' + chg.length : ''}`], ['make', '采购与生产'], ['ship', '出运与单证'], ['trace', '追溯'], ['profit', '利润']];
  if (!tabs.some(t => t[0] === S.tab)) S.tab = 'lines';
  const wos = DB.wos.filter(w => c.wo.includes(w.id)), pos = DB.pos.filter(p => c.po.includes(p.id) || p.for === c.pi), mrp = DB.mrp.filter(m => m.for === c.pi);
  const T = {
    lines: () => table(['客户品号', '内部品号', '品名', '海关编码', '数量', '单价', '金额'], c.lines.map(l => [mono(l[0]), mono(prodOf(l[0]).inner), prodOf(l[0]).name, mono(prodOf(l[0]).hs), fmt(l[1]), fmt(l[2], 2), fmt(l[1] * l[2], 2)]), { num: [4, 5, 6] }),
    pay: () => table(['款项', '金额', '到期日', '状态', ''], c.pay.map(p => [p[0], `${c.cur} ${fmt(p[1], 2)}`, p[2], p[3] === '已收' ? pill('已收', 'ok') : p[3] === '逾期' ? pill(`逾期 ${daysPast(p[2])} 天`, 'bad') : p[3] === '到账待认领' ? pill('到账待认领', 'yz') : pill(p[3], 'mute'), p[3] !== '已收' && c.cur === 'USD' ? goBtn('ar', '去认领') : '']), { num: [1] }) + `<p class="note">已收 ${c.cur} ${fmt(paid, 2)}，未收 ${c.cur} ${fmt(total(c) - paid, 2)}。认领后自动核销发票并产生凭证。</p>`,
    change: () => (chg.length ? chg.map(x => `<div class="card" style="margin-bottom:12px;background:var(--card2)"><h3>${x.id} · V${x.ver} <small>${x.date} · ${x.by} · ${x.reason}</small>${x.st === '待审批' ? pill('待审批', 'warn') : pill(x.st, 'ok')}</h3>${table(['项目', '原内容', '变更后'], x.diff.map(d => [d[0], `<span style="text-decoration:line-through;color:var(--faint)">${d[1]}</span>`, `<b>${d[2]}</b>`]))}<p class="note">连动：${x.effect}</p></div>`).join('') : '<p class="note">这张合同还没有变更。</p>') + `<div class="toolbar"><button class="btn pri" type="button" data-act="toast" data-msg="已建立变更单 V${String(c.ver + 1).padStart(3, '0')}（演示）">${ic('plus')}新增变更</button></div>`,
    make: () => `${flow([['物料需求', 1], ['请购比价', pos.length > 0], ['采购到货', pos.some(p => p.recv)], ['领料生产', wos.some(w => w.issued)], ['完工检验', wos.some(w => w.done)]])}
      <h3>工单</h3>${wos.length ? table(['工单', '内部品号', '数量', '已完工', '状态'], wos.map(w => [goBtn('mo', w.id), mono(prodOf(w.item).inner), fmt(w.qty), fmt(w.done), w.st === '欠料' ? pill('欠料', 'bad') : w.st === '已完工' ? pill(w.st, 'ok') : pill(w.st, 'run')]), { num: [2, 3] }) : `<p class="note">${c.block ? '信用额度核准后自动产生工单建议。' : '还没有工单。'}</p>`}
      <h3 class="mt">物料需求</h3>${mrp.length ? table(['料件', '需求', '库存', '在途', '缺料'], mrp.map(m => [`${mono(m.item)} ${nameOf(m.item)}`, fmt(m.need), fmt(m.stock), fmt(m.onway), shortage(m) ? `<b class="dn">${fmt(shortage(m))}</b>` : '0']), { num: [1, 2, 3, 4] }) : '<p class="note">料件充足或尚未计算。</p>'}
      ${pos.length ? `<h3 class="mt">采购单</h3>${table(['采购单', '供应商', '交期', '状态'], pos.map(p => [goBtn('po', p.id), supOf(p.sup).name, p.due, pill(p.st, p.st === '已入库' ? 'ok' : p.st === '待审批' ? 'warn' : 'run')]))}` : ''}`,
    ship: () => sh ? table(['出运', '方式', '路线', '出库单', '单证', '状态'], [[goBtn('ship|' + sh.id, sh.id), sh.mode, sh.route, mono(sh.ck), `${Object.values(sh.docs).filter(Boolean).length}/5`, pill(sh.st, 'ok')]]) : '<p class="note">还没有出运。完工检验入库后，在“出运与单证”建立出运即可自动出库。</p>',
    trace: () => traceTree(c),
    profit: () => `<div class="kv"><div><span>预估利润</span>¥${fmt(c.est)}</div><div><span>实际利润</span>${c.act == null ? '未结案' : '¥' + fmt(c.act)}</div><div><span>合同金额</span>${c.cur} ${fmt(total(c), 2)}</div><div><span>产地证</span>${c.co}</div></div>${c.act != null ? `<p class="note">${goBtn('cost', '看差异拆解')}</p>` : ''}`
  };
  return `<button class="back" type="button" data-go="contracts">${ic('left')}返回合同列表</button>
  <div class="card">
    ${c.block ? `<div class="banner warn"><b>暂停</b><span>${c.block}。${goBtn('approvals', '去审批')}</span></div>` : ''}
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:baseline">
      <div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><span class="m" style="font-size:21px;font-weight:650">${c.pi}</span><button class="btn sm" type="button" data-act="openCust" data-id="${cu.id}">${cu.name}</button>${scStatus(c)}</div>
      <div><span style="font-family:var(--font-d);font-size:21px;font-weight:700">${c.cur} ${fmt(total(c), 2)}</span> <span class="note" style="margin:0">${c.term}</span></div>
    </div>
    ${stepper(NODES[c.type], c.node)}
    <div class="kv sep"><div><span>付款条件</span>${c.pay.map(p => p[0]).join('，')}</div><div><span>归属业务</span>${c.sales}</div><div><span>业务类型 · 用途</span>${c.type} · ${c.use}</div><div><span>当前版本</span>V${String(c.ver).padStart(3, '0')}</div></div>
    <div class="toolbar" style="margin-top:14px"><button class="btn pri" type="button" data-act="advance" data-id="${c.pi}" ${c.block || c.node >= NODES[c.type].length - 1 ? 'disabled' : ''}>完成「${NODES[c.type][c.node]}」，进入下一步</button><button class="btn" type="button" data-act="toast" data-msg="已发送 PI 给客户（演示）">发 PI 给客户</button></div>
  </div>
  <div class="card mt"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.tab === k}" data-act="tab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.tab]()}</div>`;
};

function traceTree(c) {
  const cu = custOf(c.cust), wos = DB.wos.filter(w => c.wo.includes(w.id)), wws = DB.wws.filter(w => c.wo.includes(w.wo)), pos = DB.pos.filter(p => p.for === c.pi);
  const recv = c.pay.filter(p => p[3] === '已收').reduce((a, p) => a + p[1], 0), sh = DB.ships.find(s => s.id === c.ship), q = DB.quotes.find(x => x.pi === c.pi);
  const node = (st, t, sub, ref, cls = '') => `<div class="tn ${cls}"><span class="dot ${st}"></span><span class="lbl"><b>${t}</b><span>${sub}</span></span><span class="m" style="color:var(--muted)">${ref}</span></div>`;
  return `<div class="trace">
    ${node('d', '报价', q ? `V${q.ver} · 毛利 ${q.margin}%` : '直接下单', q ? q.id : '—')}
    ${node(c.block ? 'a' : 'd', 'PI 确认', `${cu.short} · ${c.cur} ${fmt(total(c), 2)}${c.block ? ' · 信用额度待审批' : ''}`, c.pi)}
    ${pos.map(p => node(p.st === '已入库' ? 'd' : 'a', '采购', `${supOf(p.sup).name} · ${p.st}`, p.id, 'sub')).join('')}
    ${wos.map(w => node(w.st === '已完工' ? 'd' : w.st === '欠料' ? 'w' : 'a', '工单', `${prodOf(w.item).inner} · ${fmt(w.done)} / ${fmt(w.qty)} · ${w.st}`, w.id, 'sub')).join('')}
    ${wws.map(w => node('a', '委外贴片', `${supOf(w.sup).name} · 回货 ${w.back} / ${w.qty}`, w.id, 'sub')).join('')}
    ${node(sh ? 'd' : 'w', '出库与出运', sh ? `${sh.mode} · ${sh.st}` : '未出运', sh ? sh.ck : '—')}
    ${node(c.inv ? 'd' : 'w', '销售发票', c.inv ? '已开票' : '出运后自动开票', c.inv || '—')}
    ${node(recv >= total(c) ? 'd' : recv > 0 ? 'a' : 'w', '收款与核销', `${c.cur} ${fmt(recv, 2)} / ${fmt(total(c), 2)}`, '')}
    ${node(c.node >= 10 ? 'd' : 'w', '结汇', c.node >= 10 ? '已结汇' : '未结汇', '')}
  </div><p class="note">所有节点都在本系统，单据之间自动连结，不需要手写备注对照。</p>`;
}

V.follow = () => {
  const cols = [[2, '备料'], [3, '生产'], [4, '检验'], [5, '出库'], [6, '订舱'], [9, '收款']];
  const list = DB.contracts;
  return head('跟单看板', '每张 PI 按节点推进 · 红框为逾期 · 备料、生产、检验进度由单据自动更新') +
    `<div class="kanban">${cols.map(([n, name]) => { const cs = list.filter(c => c.node === n); return `<div class="col"><h4><span>${name}</span><span>${cs.length}</span></h4>${cs.map(c => {
      const w = DB.wos.filter(x => c.wo.includes(x.id)), d = w.reduce((a, x) => a + x.done, 0), q = w.reduce((a, x) => a + x.qty, 0);
      const sh = DB.mrp.filter(m => m.for === c.pi && shortage(m) > 0);
      return `<div class="kc ${c.late || sh.length ? 'late' : ''}"><div class="t">${c.pi}</div><div class="s">${custOf(c.cust).short} · ${c.cur} ${fmt(total(c))}</div>${q ? `<div class="s">工单 ${fmt(d)} / ${fmt(q)}</div>` : ''}<div class="f">${c.late ? `<span class="dn">逾期 ${c.late} 天</span>` : sh.length ? `<span class="dn">缺 ${sh.map(m => m.item).join('、')}</span>` : '<span class="s">正常</span>'}${goBtn('contract|' + c.pi, '打开')}</div></div>`;
    }).join('') || '<p class="note" style="margin:4px">没有合同</p>'}</div>`; }).join('')}</div>`;
};

V.samples = () => {
  const list = DB.samples.filter(s => S.sampleF === '全部' || s.st === S.sampleF);
  const k = st => DB.samples.filter(s => s.st === st).length;
  return head('样品与借出', '寄样就是库存借出，只录一次；到期提醒归还，测试通过直接转 PI', `<button class="btn pri" type="button" data-act="toast" data-msg="已登记寄样，审批后由仓库出库（演示）">${ic('plus')}登记寄样</button>`) + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">测试中</div><div class="v">${k('测试中')}</div></div>
    <div class="card kpi"><div class="k">逾期未还</div><div class="v dn">${k('逾期未还')}</div></div>
    <div class="card kpi"><div class="k">待出库</div><div class="v">${k('待出库')}</div></div>
    <div class="card kpi"><div class="k">近 90 天样品转订单率</div><div class="v">38%</div></div>
  </div>
  <div class="toolbar mt" style="margin-bottom:12px"><div class="filters">${['全部', '测试中', '逾期未还', '待出库', '已转订单'].map(f => `<button type="button" data-act="sampleF" data-id="${f}" aria-pressed="${S.sampleF === f}">${f}</button>`).join('')}</div></div>` +
  table(['寄样单', '客户', '产品', '数量', '寄出', '应还', '状态', '说明', ''], list.map(s => [mono(s.id), custOf(s.cust).short, prodOf(s.prod).name, s.qty, s.out, s.due,
    s.st === '逾期未还' ? pill(`逾期 ${daysPast(s.due)} 天`, 'bad') : s.st === '已转订单' ? pill('已转订单', 'ok') : s.st === '待出库' ? pill('待出库', 'mute') : pill('测试中', 'run'), `<span class="wrap">${s.note}</span>`,
    s.st === '测试中' ? `<button class="btn sm pri" type="button" data-act="sampleWin" data-id="${s.id}">测试通过，转报价</button>` : s.st === '待出库' ? `<button class="btn sm" type="button" data-act="sampleOut" data-id="${s.id}">仓库出库</button>` : s.st === '逾期未还' ? `<button class="btn sm" type="button" data-act="toast" data-msg="已提醒客户归还（演示）">提醒归还</button>` : s.pi ? piBtn(s.pi) : '']), { num: [3] }) +
  `<p class="note">出库时扣减成品库存并记入“样品费用”；客户买下时可直接把借出转成销售，不用先还再卖。</p>`;
};

V.ship = () => {
  const s = DB.ships.find(x => x.id === S.shipSel) || DB.ships[0];
  const w = s.items.map(i => i[2] * prodOf(i[1]).kg), tw = w.reduce((a, b) => a + b, 0);
  const cc = custOf((scOf(s.items[0][0]) || {}).cust).cc;
  const comp = { VN: [['产地证', 'Form E（中国—东盟）', 1], ['越文标签', '已附越文品名', 1]], TH: [['产地证', 'RCEP 原产地证书', 1]], MX: [['西班牙语品名', '商业发票已附西语品名', 1], ['原产地声明', '一般贸易，附原产地声明即可', 0], ['进口商 RFC', '客户税号已登记', 1]] }[cc] || [];
  const nDoc = Object.values(s.docs).filter(Boolean).length;
  return head('出运与单证', '建立出运时自动产生出库单与销售发票；单证一次生成并存档') + flow([['选 PI 与数量', 1], ['自动出库', 1], ['生成单证', nDoc === 5], ['自动开发票', !!(scOf(s.items[0][0]) || {}).inv], ['应收入账', !!(scOf(s.items[0][0]) || {}).inv]]) +
  table(['出运', '方式', '路线', '出发', 'PI', '出库单', '单证', '状态'], DB.ships.map(x => [mono(x.id), x.mode, x.route, x.etd, [...new Set(x.items.map(i => i[0]))].join('、'), mono(x.ck), `${Object.values(x.docs).filter(Boolean).length}/5`, pill(x.st, x.st.includes('待') ? 'run' : 'ok')]), { click: i => `data-act="shipSel" data-id="${DB.ships[i].id}"`, sel: i => DB.ships[i].id === s.id }) + `
  <div class="grid g2 mt">
    <div class="card"><h3>${s.id} 货物与运费 <small>${s.mode} · 毛重约 ${fmt(tw, 1)} kg</small></h3>${table(['PI', '品项', '数量', '重量 kg', '分摊运费 USD'], [...s.items.map((i, k) => [piBtn(i[0]), prodOf(i[1]).name, fmt(i[2]), fmt(w[k], 1), fmt(s.freight * w[k] / tw, 2)]), ['<b>合计</b>', '', '', `<b>${fmt(tw, 1)}</b>`, `<b>${fmt(s.freight, 2)}</b>`]], { num: [2, 3, 4] })}<p class="note">运费按重量分摊到每张 PI，并自动产生对物流商的应付。</p></div>
    <div class="card"><h3>单证 <small>${nDoc}/5 已生成</small></h3>${table(['单证', '状态'], Object.entries(s.docs).map(([k, v]) => [k, v ? pill('已生成', 'ok') : pill('未生成', 'mute')]))}
      <div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="genDocs" data-id="${s.id}" ${nDoc === 5 ? 'disabled' : ''}>一键生成单证并开发票</button>${goBtn('window', '导出单一窗口资料')}</div></div>
  </div>
  <div class="card mt"><h3>国别合规</h3>${table(['检查项', '说明', '结果'], comp.map(r => [r[0], `<span class="wrap">${r[1]}</span>`, r[2] ? pill('通过', 'ok') : pill('待补', 'warn')]))}</div>`;
};

V.after = () => head('售后与返修', '反查原 PI；退货经入库检验后自动冲销应收，不用另开销退单', `<button class="btn pri" type="button" data-act="toast" data-msg="已登记售后单（演示）">${ic('plus')}登记售后</button>`) +
  table(['售后单', '原 PI', '客户', '产品', '数量', '类型', '原因', '进度', ''], DB.after.map(a => [mono(a.id), mono(a.pi), custOf(a.cust).short, prodOf(a.prod).name, a.qty, a.kind === '退货' ? pill('退货', 'warn') : pill('返修', 'run'), `<span class="wrap">${a.reason}</span>`, `${a.steps[a.step]}（${a.step + 1}/${a.steps.length}）`, a.step < a.steps.length - 1 ? `<button class="btn sm" type="button" data-act="afterNext" data-id="${a.id}">下一步</button>` : pill('已完成', 'ok')]), { num: [4] }) + `
  <div class="grid g2 mt">${DB.after.map(a => `<div class="card"><h3>${a.id} · ${a.kind} <small>${custOf(a.cust).short}</small></h3>${stepper(a.steps, a.step)}</div>`).join('')}</div>`;

V.comm = () => {
  const fxr = curLock()[1];
  const rows = ['林晓', '陈一凡', '周可'].map(n => {
    const cs = DB.contracts.filter(c => c.sales === n);
    const rev = cs.reduce((a, c) => a + total(c) * (c.cur === 'USD' ? fxr : 1), 0), gp = cs.reduce((a, c) => a + (c.act ?? c.est), 0);
    const got = cs.reduce((a, c) => a + c.pay.filter(p => p[3] === '已收').reduce((x, p) => x + p[1], 0) * (c.cur === 'USD' ? fxr : 1), 0);
    const ratio = S.perfCash ? got / Math.max(1, rev) : 1, base = S.perfRule === 'gp' ? gp : rev, rate = S.perfRule === 'gp' ? .12 : .008;
    return [n, cs.length, '¥' + fmt(rev), '¥' + fmt(gp), fmt(ratio * 100, 0) + '%', '¥' + fmt(base * rate * ratio)];
  });
  return head('业绩与提成', '合同记录“归属业务”，与录单人分开；毛利用本系统算出的实际成本') + `
  <div class="grid g23">
    <div class="card"><h3>提成规则</h3><div style="display:grid;gap:10px">
      <label class="chk"><input type="radio" name="pr" ${S.perfRule === 'gp' ? 'checked' : ''} data-act="perfRule" data-id="gp"> 按毛利的 12%</label>
      <label class="chk"><input type="radio" name="pr" ${S.perfRule === 'rev' ? 'checked' : ''} data-act="perfRule" data-id="rev"> 按销售额的 0.8%</label>
      <label class="chk"><input type="checkbox" ${S.perfCash ? 'checked' : ''} data-act="perfCash"> 以回款为准</label>
    </div></div>
    <div class="card"><h3>本月业绩与提成试算</h3>${table(['归属业务', '合同数', '销售额', '毛利', '回款比例', '提成'], rows, { num: [1, 2, 3, 4, 5] })}</div>
  </div>`;
};
</script>
