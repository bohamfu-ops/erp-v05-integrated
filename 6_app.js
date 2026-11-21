<script>
/* ================= 外框 ================= */
function side() {
  const badge = { approvals: pendingAp(), ar: DB.receipts.filter(r => !r.claimed).length, inbound: DB.inbound.filter(x => x.st === '待检验').length, mrp: DB.mrp.filter(m => shortage(m) > 0 && !m.pr).length, ap: DB.ap.filter(x => x.st === '待核对').length };
  const hot = ['approvals', 'mrp'];
  const cur = S.view === 'contract' ? 'contracts' : S.view;
  $('side').innerHTML = `<div class="brand"><span class="mk">光</span><div><b>光数外贸</b><small>一体化版 · 示例数据</small></div></div>` +
    NAV.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([k, n]) => `<button type="button" class="nav" data-go="${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic(k)}<span>${n}</span>${badge[k] ? `<span class="ct ${hot.includes(k) ? 'hot' : ''}">${badge[k]}</span>` : ''}</button>`).join('')).join('') +
    `<div class="foot">一体化版：易助的功能全部在本系统内完成。<br>所有客户、金额、人名均为虚构示例。</div>`;
}
function topbar() {
  const t = TITLE[S.view] || ['', ''], sk = document.documentElement.dataset.skin;
  $('top').innerHTML = `<button class="menu" type="button" data-act="menu" aria-label="打开导航">${ic('menu')}</button>
    <div class="crumb">${t[0]} <span>›</span> <b>${S.view === 'contract' ? (S.arg || '合同明细') : t[1]}</b></div>
    <div class="search">${ic('search')}<input id="q" type="search" placeholder="搜索 PI、工单、采购单、客户、供应商" autocomplete="off" aria-label="搜索"><div class="results" id="results" hidden></div></div>
    <div class="skin" role="group" aria-label="外观"><button type="button" data-act="skin" data-id="light" aria-pressed="${sk !== 'dark'}">${ic('sun')}<span>浅色</span></button><button type="button" data-act="skin" data-id="dark" aria-pressed="${sk === 'dark'}">${ic('moon')}<span>深色</span></button></div>
    <span class="who" title="林晓 · 业务">林</span>`;
}
function drawer() { $('layer').innerHTML = S.drawer ? `<div class="layer" data-act="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="客户中心">${custDrawer(S.drawer)}</aside>` : ''; }
function render() { side(); topbar(); $('main').innerHTML = `<div class="view">${V[S.view]()}</div>`; drawer(); }
function go(spec) {
  const [v, a, t] = String(spec).split('|');
  if (v === 'customers' && a) { S.view = 'customers'; S.drawer = a; render(); return; }
  S.arg = null;
  if (v === 'contracts' && a) S.scF = a;
  else if (v === 'ship' && a) S.shipSel = a;
  else if (v === 'ar' && a) { if (['claim', 'inv', 'aging'].includes(a)) S.arTab = a; else { S.recSel = a; S.arTab = 'claim'; } }
  else if (v === 'contract') { S.arg = a || null; S.tab = t || 'lines'; }
  S.view = V[v] ? v : 'dash';
  S.drawer = null; $('side').classList.remove('open');
  render(); window.scrollTo(0, 0);
  try { if (location.hash !== '#' + S.view) history.replaceState(null, '', '#' + S.view); } catch (_) {}
}

/* ================= 外观 ================= */
let skinSaved = null;
try { skinSaved = localStorage.getItem('erp5-skin'); } catch (_) {}
function systemSkin() { const t = document.documentElement.dataset.theme; if (t === 'dark' || t === 'light') return t; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
function applySkin(s) { document.documentElement.dataset.skin = s; }
applySkin(skinSaved || systemSkin());
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!skinSaved) { applySkin(systemSkin()); topbar(); } }); } catch (_) {}
try { new MutationObserver(() => { if (!skinSaved) { const s = systemSkin(); if (document.documentElement.dataset.skin !== s) { applySkin(s); topbar(); } } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (_) {}

function save() { try { localStorage.setItem('erp5a-req', JSON.stringify(S.choice)); localStorage.setItem('erp5a-note', JSON.stringify(S.note)); } catch (_) {} }
function exportText() {
  const lines = ['【外贸 ERP 需求确认结果 · 一体化版】'];
  REQ.forEach(([g, , items]) => { lines.push('', `■ ${g}`); items.forEach(([id, name]) => { lines.push(`- ${name}：${CH[S.choice[id]] || '未选'}`); if (S.note[id]) lines.push(`  意见：${S.note[id]}`); }); });
  if (S.note._all) lines.push('', '■ 其他意见', S.note._all);
  return lines.join('\n');
}
let tt;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3000); }
function keep(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
let seq = 11;   // 示例资料已用到 01–09，新单号从 11 开始
const nid = p => p + '20261118' + String(seq++).padStart(2, '0');
const addStock = (item, qty, wh) => { const r = DB.stock.find(x => x[0] === item); if (r) r[2] += qty; else DB.stock.push([item, wh, qty, 0, (DB.mats[item] || [0, 0, 0])[2]]); };
const voucher = (src, lines) => DB.vouchers.unshift({ no: '记-1118-0' + (10 + seq++), src, lines, st: '待审核' });

/* ================= 操作 ================= */
const ACT = {
  toast: el => toast(el.dataset.msg),
  menu: () => $('side').classList.toggle('open'),
  skin: el => { skinSaved = el.dataset.id; try { localStorage.setItem('erp5-skin', skinSaved); } catch (_) {} applySkin(skinSaved); topbar(); },
  close: () => { S.drawer = null; drawer(); },
  openCust: el => { S.drawer = el.dataset.id; drawer(); },
  claimCust: el => { const c = custOf(el.dataset.id); c.pool = '私海'; c.sales = '林晓'; keep(render); toast(`已领取 ${c.short}，归属林晓`); },
  custF: el => { S.custF = el.dataset.id; keep(render); }, scF: el => { S.scF = el.dataset.id; keep(render); }, sampleF: el => { S.sampleF = el.dataset.id; keep(render); },
  mapF: el => { S.mapF = el.dataset.id; keep(render); }, tab: el => { S.tab = el.dataset.id; keep(render); },
  stockTab: el => { S.stockTab = el.dataset.id; keep(render); }, moveF: el => { S.moveF = el.dataset.id; keep(render); },
  arTab: el => { S.arTab = el.dataset.id; keep(render); }, apTab: el => { S.apTab = el.dataset.id; keep(render); },
  costTab: el => { S.costTab = el.dataset.id; keep(render); }, glTab: el => { S.glTab = el.dataset.id; keep(render); },
  shipSel: el => { S.shipSel = el.dataset.id; keep(render); }, recSel: el => { S.recSel = el.dataset.id; keep(render); },
  perfRule: el => { S.perfRule = el.dataset.id; keep(render); }, perfCash: () => { S.perfCash = !S.perfCash; keep(render); },
  apply: () => { ALL.forEach(r => { S.choice[r[0]] = r[2] === 'r2' || r[2] === 'ro' ? 'later' : 'yes'; }); save(); keep(render); toast('已按建议选好，可以再逐项调整'); },
  reset: () => { S.choice = {}; save(); keep(render); toast('已清空选择'); },
  copy: () => { const t = $('exportText'); try { navigator.clipboard.writeText(t.value).then(() => toast('已复制，可以贴到微信或邮件'), () => { t.select(); toast('请按 Ctrl+C 复制已选中的文字'); }); } catch (_) { t.select(); toast('请按 Ctrl+C 复制已选中的文字'); } },
  approve: el => {
    const a = DB.approvals.find(x => x.id === el.dataset.id); a.status = '已核准';
    if (a.ref === 'PI20261009MNO') { const c = scOf(a.ref); delete c.block; c.node = 2; const id = nid('WO'); c.wo = [id]; DB.wos.unshift({ id, pi: c.pi, item: 'C91GPON-CP', qty: 1200, done: 0, issued: false, due: '12-05', st: '待领料' }); toast(`已核准，自动产生工单 ${id}，物料需求已重算`); }
    else if (a.ref === 'BG-0013') { const ch = DB.changes.find(x => x.id === 'BG-0013'); ch.st = '已生效'; scOf(ch.pi).ver = 2; toast('已核准，包装组已收到中性包装通知'); }
    else if (a.ref === 'BJ2026111702') { DB.quotes.find(q => q.id === a.ref).status = '已批准'; toast('已核准，报价可以转 PI'); }
    else if (DB.ap.find(x => x.id === a.ref)) { const x = DB.ap.find(i => i.id === a.ref); x.paid = x.amt; x.st = '已付款'; voucher(`付款 ${x.id}`, [['应付账款-' + supOf(x.sup).name, x.amt, 0], ['银行存款-人民币户', 0, x.amt]]); toast(`已核准，已付款并核销 ${x.id}`); }
    else { const p = DB.pos.find(x => x.id === a.ref); if (p) { p.st = '已发出'; const m = DB.mrp.find(x => x.item === p.lines[0][0]); if (m) m.onway += p.lines[0][1]; toast(`${p.id} 已核准并发给${supOf(p.sup).name}，在途数量已更新`); } else toast('已核准'); }
    keep(render);
  },
  reject: el => { const a = DB.approvals.find(x => x.id === el.dataset.id); a.status = '已退回'; keep(render); toast(`已退回给 ${a.who}`); },
  saveQuote: () => {
    const q = S.q, id = nid('BJ'), low = S.calc.rate < 12;
    DB.quotes.unshift({ id, ver: 1, cust: q.cust, prod: q.prod, qty: q.qty, price: +S.calc.price.toFixed(2), margin: +S.calc.rate.toFixed(1), status: low ? '待审批' : '已发客户', att: 0, sales: '林晓' });
    if (low) DB.approvals.unshift({ id: 'AP-4' + (20 + seq), type: '报价毛利低于门槛', ref: id, who: '林晓', detail: `毛利 ${fmt(S.calc.rate, 1)}%，门槛 12%`, status: '待审批', step: '第 1 层 · 业务主管', go: 'quote' });
    keep(render); toast(low ? `${id} 已保存并送业务主管审批` : `${id} 已保存`);
  },
  toContract: el => {
    const q = DB.quotes.find(x => x.id === el.dataset.id), cu = custOf(q.cust), pi = 'PI20261118' + cu.short.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    q.status = '已转合同'; q.pi = pi;
    DB.contracts.unshift({ pi, cust: q.cust, type: '外销', term: 'FOB 深圳', cur: 'USD', sales: q.sales, lines: [[q.prod, q.qty, q.price]], node: 1, ver: 1, pay: [['订金 30%', +(q.qty * q.price * .3).toFixed(2), '11-25', '未收'], ['出货前 70%', +(q.qty * q.price * .7).toFixed(2), '12-20', '未收']], wo: [], po: [], ship: '', inv: '', est: Math.round(q.qty * q.price * curLock()[1] * q.margin / 100), act: null, co: '—', late: 0, use: '量产' });
    go('contract|' + pi); toast(`已生成 ${pi}；确认后自动产生工单建议与物料需求`);
  },
  advance: el => {
    const c = scOf(el.dataset.id), n = NODES[c.type];
    c.node = Math.min(c.node + 1, n.length - 1); c.late = 0;
    let extra = '';
    if (c.node === 2 && !c.wo.length) { const id = nid('WO'); c.wo = [id]; DB.wos.unshift({ id, pi: c.pi, item: c.lines[0][0], qty: c.lines[0][1], done: 0, issued: false, due: '12-10', st: '待领料' }); extra = `，已产生工单 ${id}`; }
    keep(render); toast(`${c.pi} 进入「${n[c.node]}」${extra}`);
  },
  sampleWin: el => { const s = DB.samples.find(x => x.id === el.dataset.id); s.st = '已转订单'; s.note = '测试通过，已建立报价'; S.q.cust = s.cust; S.q.prod = s.prod; S.q.cost = prodOf(s.prod).cost; go('quote'); toast(`${custOf(s.cust).short} 测试通过，已带入报价`); },
  sampleOut: el => { const s = DB.samples.find(x => x.id === el.dataset.id); s.st = '测试中'; addStock(s.prod, -s.qty, '成品仓'); DB.moves.unshift(['11-18', '样品借出', s.id, s.prod, -s.qty, '成品仓']); keep(render); toast(`${s.id} 已出库，成品库存已扣减`); },
  genDocs: el => {
    const s = DB.ships.find(x => x.id === el.dataset.id); Object.keys(s.docs).forEach(k => { s.docs[k] = 1; });
    const c = scOf(s.items[0][0]); let msg = `${s.id} 单证已生成`;
    if (c && !c.inv) { c.inv = nid('INV'); const got = c.pay.filter(p => p[3] === '已收').reduce((a, p) => a + p[1], 0); DB.ar.unshift({ inv: c.inv, pi: c.pi, cust: c.cust, cur: c.cur, amt: total(c), got, due: '12-05', log: [] }); c.node = Math.max(c.node, 6); voucher(`销售发票 ${c.inv}`, [['应收账款-' + custOf(c.cust).short, total(c) * curLock()[1], 0], ['主营业务收入-出口收入', 0, total(c) * curLock()[1]]]); msg += `，已自动开发票 ${c.inv} 并入应收`; }
    keep(render); toast(msg);
  },
  afterNext: el => { const a = DB.after.find(x => x.id === el.dataset.id); a.step = Math.min(a.step + 1, a.steps.length - 1); keep(render); toast(`${a.id} 进入「${a.steps[a.step]}」`); },
  claim: el => {
    const [pi, i] = el.dataset.id.split('|'), c = scOf(pi), r = DB.receipts.find(x => x.id === S.recSel), ack = $('ackPayer');
    if (ack && !ack.checked) { toast('请先确认已取得客户付款委托书'); ack.focus(); return; }
    c.pay[+i][3] = '已收'; r.claimed = `${pi} · ${c.pay[+i][0]}`; r.rate = curLock()[1];
    const inv = DB.ar.find(x => x.pi === pi); if (inv) inv.got = Math.min(inv.amt, inv.got + r.amt);
    DB.fx.unsettled += r.amt;
    voucher(`收款 ${r.id}`, [['银行存款-美元户', r.amt * r.rate, 0], [(inv ? '应收账款-' : '预收账款-') + custOf(c.cust).short, 0, r.amt * r.rate]]);
    keep(render); toast(`已认领并核销到 ${pi}，凭证已产生`);
  },
  dun: el => { const r = DB.ar.find(x => x.inv === el.dataset.id); r.log.unshift(['11-18', custOf(r.cust).ch, '已提醒付款，等待客户回复']); keep(render); toast(`已记录 ${r.inv} 的跟催`); },
  settle: () => {
    const a = Math.min(+$('fx-amt').value || 0, DB.fx.unsettled), rate = +$('fx-rate').value || 0;
    if (!a || !rate) { toast('请填写结汇金额与汇率'); return; }
    DB.fx.hist.unshift(['11-18', a, rate, '本次结汇']); DB.fx.unsettled -= a;
    const diff = a * (rate - curLock()[1]);
    voucher('结汇', [['银行存款-人民币户', a * rate, 0], ['银行存款-美元户', 0, a * curLock()[1]], ['财务费用-汇兑损益', diff < 0 ? -diff : 0, diff > 0 ? diff : 0]]);
    keep(render); toast(`已登记结汇 USD ${fmt(a)}，汇差 ${diff >= 0 ? '+' : '−'}¥${fmt(Math.abs(diff), 2)}，凭证已产生`);
  },
  makePR: el => {
    const m = DB.mrp.find(x => x.item === el.dataset.id), mat = DB.mats[m.item], id = nid('QG');
    m.pr = id; const alt = DB.suppliers.find(s => s.id !== mat[1] && s.cat.includes(mat[0].includes('TOSA') || mat[0].includes('ROSA') ? '器件' : '外壳')) || supOf('S-01');
    DB.prs.unshift({ id, item: m.item, qty: shortage(m), need: '11-25', src: m.for, st: '比价中', offers: [[mat[1], mat[2], 10], [alt.id, +(mat[2] * 1.04).toFixed(2), 7]] });
    keep(render); toast(`已产生请购单 ${id}，请比价选定供应商`);
  },
  pickOffer: el => {
    const [prId, sup] = el.dataset.id.split('|'), p = DB.prs.find(x => x.id === prId), o = p.offers.find(x => x[0] === sup), id = nid('PO'), amt = o[1] * p.qty;
    p.st = '已转采购'; p.po = id;
    const st = amt > 30000 ? '待审批' : '已发出';
    DB.pos.unshift({ id, sup, lines: [[p.item, p.qty, o[1]]], due: '11-25', recv: 0, st, for: p.src });
    if (st === '待审批') DB.approvals.unshift({ id: 'AP-4' + (20 + seq), type: '采购单', ref: id, who: '采购 · 吴佳', detail: `${supOf(sup).name} ${nameOf(p.item)} ${fmt(p.qty)} 只，¥${fmt(amt)}`, status: '待审批', step: '第 1 层 · 采购主管', go: 'po' });
    else { const m = DB.mrp.find(x => x.item === p.item); if (m) m.onway += p.qty; }
    keep(render); toast(st === '待审批' ? `已产生 ${id}，金额超过 ¥30,000，送采购主管审批` : `已产生 ${id} 并发给${supOf(sup).name}`);
  },
  qcPass: el => {
    const x = DB.inbound.find(i => i.id === el.dataset.id); x.st = '已入库';
    const isFG = !!DB.products.find(p => p.code === x.item), wh = isFG ? '成品仓' : x.src === '委外回货' ? '半成品仓' : '原材料仓';
    addStock(x.item, x.qty, wh); DB.moves.unshift(['11-18', x.src === '采购到货' ? '采购入库' : x.src === '委外回货' ? '委外回货入库' : '完工入库', x.id, x.item, x.qty, wh]);
    const m = DB.mrp.find(i => i.item === x.item); if (m) { m.stock += x.qty; m.onway = Math.max(0, m.onway - x.qty); }
    if (x.src === '采购到货') { const p = DB.pos.find(i => i.id === x.ref); if (p && DB.inbound.filter(i => i.ref === p.id).every(i => i.st === '已入库')) p.st = '已入库'; voucher(`采购入库 ${x.id}`, [['原材料', x.qty * DB.mats[x.item][2] / 1.13, 0], ['应付暂估', 0, x.qty * DB.mats[x.item][2] / 1.13]]); }
    if (x.src === '委外回货') { const w = DB.wws.find(i => i.id === x.ref); DB.ap.unshift({ id: nid('JX'), sup: w.sup, ref: `${w.id} · 回货 ${x.qty} 套`, amt: x.qty * w.price, tax: +(x.qty * w.price / 1.13 * .13).toFixed(2), match: '按回货数量', due: '12-18', paid: 0, st: '待付款' }); }
    keep(render); toast(`${x.id} 合格，已入${wh}${x.src === '委外回货' ? '，加工费已转应付' : x.src === '采购到货' ? '，已产生应付暂估' : ''}`);
  },
  qcFail: el => { const x = DB.inbound.find(i => i.id === el.dataset.id); x.st = '验退'; keep(render); toast(`${x.id} 已验退，已通知供应商并扣除应付`); },
  issue: el => { const w = DB.wos.find(x => x.id === el.dataset.id); w.issued = true; w.st = '生产中'; (DB.boms[w.item] || []).forEach(b => { addStock(b[0], -b[1] * w.qty, '原材料仓'); DB.moves.unshift(['11-18', '生产领料', 'LL' + w.id.slice(2), b[0], -b[1] * w.qty, '原材料仓']); }); keep(render); toast(`${w.id} 已按 BOM 领料，库存已扣减`); },
  report: el => { const w = DB.wos.find(x => x.id === el.dataset.id), q = Math.min(50, w.qty - w.done); w.done += q; if (w.done >= w.qty) w.st = '已完工'; DB.inbound.unshift({ id: nid('WG'), src: '工单完工', ref: w.id, who: '生产组', item: w.item, qty: q, st: '待检验' }); keep(render); toast(`${w.id} 报完工 ${q} 只，已送成品检验`); },
  wwBack: el => { const w = DB.wws.find(x => x.id === el.dataset.id), q = w.qty - w.back; w.back = w.qty; DB.inbound.unshift({ id: nid('WS'), src: '委外回货', ref: w.id, who: supOf(w.sup).name, item: w.item, qty: q, st: '待检验' }); keep(render); toast(`已登记回货 ${q} 套，送检验`); },
  apFix: el => { toast('已通知华晶光电重开发票，单价改为 238.00'); },
  pay: el => { const x = DB.ap.find(i => i.id === el.dataset.id); if (x.amt > 30000) { x.st = '审批中'; DB.approvals.unshift({ id: 'AP-4' + (20 + seq++), type: '付款', ref: x.id, who: '财务 · 赵敏', detail: `${supOf(x.sup).name} ¥${fmt(x.amt, 2)}`, status: '待审批', step: '第 1 层 · 财务主管', go: 'ap' }); toast(`金额超过 ¥30,000，已送审批`); } else { x.paid = x.amt; voucher(`付款 ${x.id}`, [['应付账款-' + supOf(x.sup).name, x.amt, 0], ['银行存款-人民币户', 0, x.amt]]); toast(`已付款并核销 ${x.id}`); } keep(render); },
  postV: el => { DB.vouchers.find(v => v.no === el.dataset.id).st = '已过账'; keep(render); toast('凭证已审核过账'); },
  closeMonth: () => toast('11 月已关账（演示）')
};

/* ================= 搜索 ================= */
function search(v) {
  const box = $('results'); if (!box) return;
  const k = v.trim().toLowerCase(); if (!k) { box.hidden = true; return; }
  const idx = [
    ...DB.contracts.map(c => [c.pi + ' ' + custOf(c.cust).name, c.pi, custOf(c.cust).short, 'contract|' + c.pi]),
    ...DB.customers.map(c => [c.name + ' ' + c.short, c.name, c.country, 'customers|' + c.id]),
    ...DB.quotes.map(q => [q.id + ' ' + custOf(q.cust).name, q.id, '报价单', 'quote']),
    ...DB.wos.map(w => [w.id + ' ' + w.pi, w.id, '工单', 'mo']),
    ...DB.pos.map(p => [p.id + ' ' + supOf(p.sup).name, p.id, '采购单', 'po']),
    ...DB.suppliers.map(s => [s.name + ' ' + s.cat, s.name, '供应商', 'suppliers']),
    ...DB.samples.map(s => [s.id + ' ' + custOf(s.cust).name, s.id, '样品', 'samples']),
    ...MAP.filter(m => m[2]).map(m => [m[1] + ' ' + m[0], m[1], '易助功能 → ' + (TITLE[m[2]] || ['', ''])[1], m[2]])
  ];
  const hits = idx.filter(x => x[0].toLowerCase().includes(k)).slice(0, 8);
  box.innerHTML = hits.length ? hits.map(h => `<button type="button" data-go="${h[3]}"><span class="m">${esc(h[1])}</span><small>${esc(h[2])}</small></button>`).join('') : '<div class="note" style="margin:8px 10px">没有找到符合的结果</div>';
  box.hidden = false;
}

/* ================= 事件 ================= */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'), a = e.target.closest('[data-act]'), r = e.target.closest('[data-req]');
  if (r) { S.choice[r.dataset.req] = r.dataset.v; save(); keep(render); return; }
  if (a && a.tagName !== 'INPUT' && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a); return; }
  if (g) { e.preventDefault(); go(g.dataset.go); return; }
  if (!e.target.closest('.search')) { const b = $('results'); if (b) b.hidden = true; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act && ACT[t.dataset.act]) { ACT[t.dataset.act](t); return; }
  if (t.dataset.qs) { S.q[t.dataset.qs] = t.value; if (t.dataset.qs === 'prod') S.q.cost = prodOf(t.value).cost; keep(render); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.note) { S.note[t.dataset.note] = t.value; save(); const ex = $('exportText'); if (ex) ex.value = exportText(); }
  if (t.dataset.q) { const v = parseFloat(t.value); if (!isNaN(v)) { S.q[t.dataset.q] = v; const id = t.id; keep(render); const n = $(id); if (n) n.focus(); } }
  if (t.id === 'q') search(t.value);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (S.drawer) ACT.close(); const b = $('results'); if (b) b.hidden = true; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const q = $('q'); if (q) q.focus(); }
});
const start = (location.hash || '').replace('#', '');
S.view = V[start] ? start : 'dash';
render();
</script>
