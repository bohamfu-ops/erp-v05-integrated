<script>
/* ================= 采购 ================= */
V.mrp = () => {
  const pr = DB.prs[0];
  return head('物料需求与请购', '系统依合同、BOM、库存、在途自动算缺料；请购单上直接比价，选定后产生采购单') + flow([['合同确认', 1], ['展开 BOM', 1], ['扣库存与在途', 1], ['算出缺料', 1], ['请购比价', !!pr], ['产生采购单', pr && pr.st === '已转采购']]) + `
  <div class="card"><h3>物料需求 <small>需求 + 安全量 − 库存 − 在途 = 缺料</small></h3>${table(['料件', '名称', '需求', '安全量', '库存', '在途', '缺料', '用于', ''], DB.mrp.map(m => { const s = shortage(m); return [mono(m.item), nameOf(m.item), fmt(m.need), fmt(m.safe), fmt(m.stock), fmt(m.onway), s ? `<b class="dn">${fmt(s)}</b>` : pill('足够', 'ok'), m.for.startsWith('PI') || m.for.startsWith('HT') ? piBtn(m.for) : m.for, s ? (m.pr ? pill('已请购 ' + m.pr, 'run') : `<button class="btn sm pri" type="button" data-act="makePR" data-id="${m.item}">产生请购</button>`) : '']; }), { num: [2, 3, 4, 5, 6] })}
  <p class="note">合同变更、工单变更后会自动重算。易助的请购、BOM 自动请购、询价、核价、采购底稿，都合并在这一页完成。</p></div>
  ${DB.prs.map(p => `<div class="card mt"><h3>请购单 ${mono(p.id)} <small>${nameOf(p.item)} · ${fmt(p.qty)} 只 · 需求日 ${p.need} · 来源 ${p.src}</small>${p.st === '已转采购' ? pill('已转采购 ' + p.po, 'ok') : pill(p.st, 'warn')}</h3>
    ${table(['供应商', '含税单价 ¥', '交期（天）', '准时率', '合格率', '金额 ¥', ''], p.offers.map(o => { const s = supOf(o[0]); const best = o[1] === Math.min(...p.offers.map(x => x[1])); return [s.name + (best ? ' ' + pill('最低价', 'ok') : ''), fmt(o[1], 2), o[2], s.ontime + '%', s.qual + '%', fmt(o[1] * p.qty, 2), p.st !== '已转采购' ? `<button class="btn sm ${best ? 'pri' : ''}" type="button" data-act="pickOffer" data-id="${p.id}|${o[0]}">选定并下单</button>` : '']; }), { num: [1, 2, 5] })}
    <p class="note">供应商价格读自供应商价格表；可加询价，报价回来后在这里比较。</p></div>`).join('')}`;
};

V.po = () => head('采购单', '金额超过 ¥30,000 需采购主管审批；到货后进入“收货与检验”') +
  table(['采购单', '供应商', '明细', '金额 ¥', '交期', '到货', '用于', '状态'], DB.pos.map(p => { const amt = p.lines.reduce((a, l) => a + l[1] * l[2], 0), q = p.lines.reduce((a, l) => a + l[1], 0); return [mono(p.id), supOf(p.sup).name, `<span class="wrap">${p.lines.map(l => `${nameOf(l[0])} × ${fmt(l[1])}`).join('<br>')}</span>`, fmt(amt, 2), p.due, `${fmt(p.recv)} / ${fmt(q / p.lines.length)}`, p.for.startsWith('PI') || p.for.startsWith('HT') ? piBtn(p.for) : p.for, p.st === '待审批' ? pill('待审批', 'warn') : p.st === '已入库' ? pill('已入库', 'ok') : p.st === '已到货待检' ? goBtn('inbound', '已到货 · 去检验') : pill(p.st, 'run')]; }), { num: [3] }) + `
  <div class="grid g2 mt">
    <div class="card"><h3>采购变更</h3>${table(['变更单', '采购单', '内容', '状态'], [[mono('CB2026111401'), mono('PO2026111001'), '交期 11-18 改 11-20（供应商排产）', pill('已生效', 'ok')]])}<p class="note">交期变更会自动通知跟单，并重算受影响合同的预计出货日。</p></div>
    <div class="card"><h3>本月采购概况</h3><div class="res"><div><span>采购金额</span><span class="m">¥${fmt(186420)}</span></div><div><span>准时到货率</span><span class="m">91%</span></div><div><span>来料合格率</span><span class="m">99.2%</span></div><div><span>未到货采购单</span><span class="m">2 张</span></div></div></div>
  </div>`;

V.suppliers = () => head('供应商', '供应商资料、价格表、交货与品质评分在同一页', `<button class="btn pri" type="button" data-act="toast" data-msg="已新增供应商（演示）">${ic('plus')}新增供应商</button>`) +
  table(['编号', '供应商', '供应品类', '付款条件', '准时率', '来料合格率', '未付金额 ¥'], DB.suppliers.map(s => [mono(s.id), `<b>${s.name}</b>`, s.cat, s.terms, s.ontime < 90 ? pill(s.ontime + '%', 'warn') : s.ontime + '%', s.qual + '%', s.open ? fmt(s.open, 2) : '—']), { num: [4, 5, 6] }) + `
  <div class="card mt"><h3>价格表 <small>比价时自动带出</small></h3>${table(['料件', '供应商', '含税单价 ¥', '最小订量', '更新日期'], [['VCSEL-25G', '光芯电子', '26.00', '500', '11-02'], ['VCSEL-25G', '立信电子', '27.50', '200', '10-20'], ['TOSA-LR4', '华晶光电', '238.00', '50', '09-15'], ['SHELL-QS28', '精密五金', '12.50', '500', '08-01']].map(r => [mono(r[0]), r[1], r[2], r[3], r[4]]), { num: [2, 3] })}</div>`;

/* ================= 仓库与品质 ================= */
V.inbound = () => {
  const pend = DB.inbound.filter(x => x.st === '待检验'), done = DB.inbound.filter(x => x.st !== '待检验');
  const rows = list => list.map(x => [mono(x.id), x.src === '采购到货' ? pill(x.src, 'run') : x.src === '委外回货' ? pill(x.src, 'yz') : pill(x.src, 'ok'), x.ref.startsWith('PO') ? goBtn('po', x.ref) : x.ref.startsWith('WW') ? goBtn('ww', x.ref) : goBtn('mo', x.ref), x.who, `${mono(x.item)} ${nameOf(x.item)}`, fmt(x.qty),
    x.st === '待检验' ? `<div class="toolbar"><button class="btn sm pri" type="button" data-act="qcPass" data-id="${x.id}">合格入库</button><button class="btn sm dng" type="button" data-act="qcFail" data-id="${x.id}">验退</button></div>` : x.st === '已入库' ? pill('已入库', 'ok') : pill(x.st, 'bad')]);
  return head('收货与检验', '采购到货、委外回货、工单完工都在同一个队列检验；合格自动入库并产生应付暂估或完工成本') + flow([['到货或完工', 1], ['检验', 1], ['合格入库', 1], ['应付暂估／完工成本', 1]]) + `
  <div class="grid g4"><div class="card kpi"><div class="k">待检验</div><div class="v">${pend.length}</div></div><div class="card kpi"><div class="k">本月来料合格率</div><div class="v">99.2%</div></div><div class="card kpi"><div class="k">本月验退</div><div class="v">1 批</div></div><div class="card kpi"><div class="k">平均检验时间</div><div class="v">0.6 天</div></div></div>
  <div class="card mt"><h3>待检验 <small>${pend.length} 笔</small></h3>${pend.length ? table(['收货单', '来源', '来源单据', '供应商／部门', '品项', '数量', ''], rows(pend), { num: [5] }) : '<p class="note">目前没有待检验的收货。</p>'}</div>
  <div class="card mt"><h3>已处理</h3>${table(['收货单', '来源', '来源单据', '供应商／部门', '品项', '数量', '结果'], rows(done), { num: [5] })}<p class="note">易助的进货单、收料单、进货检验、委外检验、生产入库检验、验退，都合并在这一页。</p></div>`;
};

V.stock = () => {
  const tabs = [['stock', '库存'], ['moves', '出入库记录'], ['dead', '呆滞与 ABC']];
  const T = {
    stock: () => table(['品号', '名称', '仓库', '现有', '已分配', '可用', '单位成本 ¥', '金额 ¥'], DB.stock.map(r => [mono(r[0]), nameOf(r[0]), r[1], fmt(r[2]), fmt(r[3]), r[2] - r[3] <= 0 && r[2] ? pill('0', 'warn') : fmt(r[2] - r[3]), fmt(r[4], 2), fmt(r[2] * r[4], 2)]), { num: [3, 4, 5, 6, 7] }) + `<div class="toolbar" style="margin-top:12px"><button class="btn" type="button" data-act="toast" data-msg="已建立调拨单（演示）">调拨</button><button class="btn" type="button" data-act="toast" data-msg="已建立盘点单，盘点期间冻结出入库（演示）">盘点</button><button class="btn" type="button" data-act="toast" data-msg="已建立其他出库单（演示）">其他出入库</button><button class="btn" type="button" data-act="toast" data-msg="已建立组合单（演示）">组合与拆解</button></div><p class="note">单位成本为月加权平均；“已分配”是已被合同或工单占用的数量。</p>`,
    moves: () => `<div class="toolbar" style="margin-bottom:12px"><div class="filters">${['全部', '采购入库', '生产领料', '完工入库', '委外送料', '委外回货入库', '销售出库', '样品借出', '调拨', '盘点调整'].map(f => `<button type="button" data-act="moveF" data-id="${f}" aria-pressed="${S.moveF === f}">${f}</button>`).join('')}</div></div>` +
      table(['日期', '类型', '来源单据', '品号', '数量', '仓库'], DB.moves.filter(m => S.moveF === '全部' || m[1] === S.moveF).map(m => [m[0], m[1], mono(m[2]), `${mono(m[3])} ${nameOf(m[3])}`, `<span class="${m[4] < 0 ? 'dn' : 'up'}">${m[4] > 0 ? '+' : ''}${fmt(m[4])}</span>`, m[5]]), { num: [4] }) + `<p class="note">每笔异动都由来源单据自动产生，不需要另外开出入库单。</p>`,
    dead: () => table(['品号', '名称', '库存', '金额 ¥', '最近异动', '呆滞天数', 'ABC'], [['C91SPCW55-40', '1.25G CWDM 40km', 1240, 33604, '11-05', 13, 'C'], ['SHELL-SFP', 'SFP 外壳', 5200, 11440, '11-10', 8, 'C'], ['91GPON-OLD', 'GPON C+（旧版外壳）', 380, 22800, '05-14', 188, 'B']].map(r => [mono(r[0]), r[1], fmt(r[2]), fmt(r[3]), r[4], r[5] > 90 ? pill(r[5] + ' 天', 'bad') : r[5] + ' 天', r[6]]), { num: [2, 3, 5] }) + '<p class="note">超过 90 天未异动列为呆滞，提醒业务优先促销或改用。</p>'
  };
  return head('库存', '库存、批号、出入库记录与呆滞分析') + `<div class="card"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.stockTab === k}" data-act="stockTab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.stockTab]()}</div>`;
};

/* ================= 生产 ================= */
V.mo = () => head('工单', '合同确认后自动产生工单建议；按 BOM 一键领料，完工进入成品检验') + flow([['合同确认', 1], ['工单建议', 1], ['齐套检查', 1], ['领料', 1], ['生产', 1], ['完工检验入库', 1]]) +
  table(['工单', 'PI', '产品（内部品号）', '数量', '已完工', '预计完工', '齐套', '状态', ''], DB.wos.map(w => { const sh = DB.mrp.filter(m => m.for === w.pi && shortage(m) > 0 && (DB.boms[w.item] || []).some(b => b[0] === m.item)); return [mono(w.id), piBtn(w.pi), `${mono(prodOf(w.item).inner)} ${prodOf(w.item).name}`, fmt(w.qty), fmt(w.done), w.due, sh.length ? pill('缺 ' + sh.map(m => m.item).join('、'), 'bad') : pill('齐套', 'ok'),
    w.st === '已完工' ? pill('已完工', 'ok') : w.st === '欠料' ? pill('欠料', 'bad') : w.st === '待领料' ? pill('待领料', 'mute') : pill(`生产中 ${Math.round(w.done / w.qty * 100)}%`, 'run'),
    w.st === '待领料' ? `<button class="btn sm pri" type="button" data-act="issue" data-id="${w.id}">按 BOM 领料</button>` : w.st === '生产中' ? `<button class="btn sm" type="button" data-act="report" data-id="${w.id}">报完工 50 只</button>` : '']; }), { num: [3, 4] }) + `
  <div class="grid g2 mt">
    <div class="card"><h3>领料明细 <small>WO2026111602 · 按 BOM 计算</small></h3>${table(['料件', '单位用量', '应领', '库存', '结果'], DB.boms['C91SP10LR-D1'].map(b => { const s = DB.stock.find(r => r[0] === b[0]) || [0, 0, 0]; const need = b[1] * 1500; return [`${mono(b[0])} ${nameOf(b[0])}`, b[1], fmt(need), fmt(s[2]), s[2] >= need ? pill('足够', 'ok') : pill('不足', 'bad')]; }), { num: [1, 2, 3] })}<p class="note">超领要填原因并审批；退料回到原仓位。</p></div>
    <div class="card"><h3>本月生产概况</h3><div class="res"><div><span>完工数量</span><span class="m">${fmt(3090)} 只</span></div><div><span>按期完工率</span><span class="m">88%</span></div><div><span>平均良率</span><span class="m">98.4%</span></div><div><span>欠料工单</span><span class="m">1 张</span></div></div></div>
  </div>`;

V.ww = () => head('委外加工', 'PCBA 外协贴片：送料、回货、检验、加工费一页管到底') + flow([['委外单', 1], ['送料到外协仓', 1], ['外协加工', 1], ['回货检验', 1], ['加工费入应付', 1]]) +
  table(['委外单', '工单', '外协厂', '主件', '数量', '已送料', '已回货', '加工费 ¥／套', '预计回货', ''], DB.wws.map(w => [mono(w.id), goBtn('mo', w.wo), supOf(w.sup).name, `${mono(w.item)} ${nameOf(w.item)}`, w.qty, w.sent, w.back, fmt(w.price, 2), w.due, w.back < w.qty ? `<button class="btn sm" type="button" data-act="wwBack" data-id="${w.id}">登记回货 ${w.qty - w.back} 套</button>` : pill('已回齐', 'ok')]), { num: [4, 5, 6, 7] }) + `
  <div class="grid g2 mt">
    <div class="card"><h3>外协厂手上的料 <small>外协厂甲（委外仓）</small></h3>${table(['料件', '已送', '已耗用', '结余'], [['IC-DRV100 100G 驱动芯片', 220, 100, 120], ['PCB-QS100 PCB 板', 225, 102, 123]], { num: [1, 2, 3] })}<p class="note">送料时从原材料仓转到外协厂的委外仓，回货时按 BOM 扣除，月底对账。</p></div>
    <div class="card"><h3>为什么合成一页</h3><p class="note" style="margin-top:0">易助的委外单、委外变更、送料、超耗送料、超送、退料、进货、退货、委外明细，共 9 种单据。这里以委外单为主线，送料与回货都在同一行操作，加工费在回货检验后自动产生应付。</p></div>
  </div>`;

V.bom = () => {
  const code = 'C91QS100LR4-A2', p = prodOf(code), parts = DB.boms[code], cost = parts.reduce((a, b) => a + b[1] * DB.mats[b[0]][2], 0);
  return head('产品与 BOM', '产品主档、客户品号、BOM、替代料与变更记录') + `
  <div class="card"><h3>产品</h3>${table(['客户品号', '内部品号', '品名', '海关编码', '退税率', '月加权平均成本 ¥'], DB.products.map(x => [mono(x.code), mono(x.inner), x.name, mono(x.hs), x.rebate + '%', fmt((DB.stock.find(r => r[0] === x.code) || [0, 0, 0, 0, x.cost])[4], 2)]), { num: [4, 5] })}<p class="note">客户品号（C91 开头）用于报价、合同与单证；内部品号（91 开头）用于生产。一个内部品号可以对应多个客户品号（例如中性包装版）。</p></div>
  <div class="grid g2 mt">
    <div class="card"><h3>${p.name} 的 BOM <small>${code} → ${p.inner} · V3</small></h3>${table(['子件', '名称', '用量', '单价 ¥', '小计 ¥', '来源'], parts.map(b => [mono(b[0]), nameOf(b[0]), b[1], fmt(DB.mats[b[0]][2], 2), fmt(b[1] * DB.mats[b[0]][2], 2), b[2]]), { num: [2, 3, 4] })}<p class="note">材料成本 ¥${fmt(cost, 2)}／只，自动带入报价试算。</p></div>
    <div class="card"><h3>替代料与变更记录</h3>${table(['主料', '替代料', '条件'], [['TOSA-LR4（华晶光电）', 'TOSA-LR4B（光芯电子）', '主料缺料时，需工程确认']])}<h3 class="mt">变更记录</h3>${table(['版本', '日期', '内容', '人员'], DB.bomHist.map(h => [h[0], h[1], `<span class="wrap">${h[2]}</span>`, h[3]]))}</div>
  </div>`;
};

/* ================= 财务 ================= */
V.ar = () => {
  const tabs = [['claim', '到账认领'], ['inv', '销售发票'], ['aging', '账龄与跟催']];
  const lk = curLock()[1];
  const r = DB.receipts.find(x => x.id === S.recSel) || DB.receipts[0];
  const cands = DB.contracts.flatMap(c => c.pay.map((p, i) => ({ c, p, i }))).filter(x => x.c.cur === r.cur && x.p[3] !== '已收');
  const best = cands.find(x => custOf(x.c.cust).name.toUpperCase() === r.payer) || cands.find(x => Math.abs(x.p[1] - r.amt) < 1);
  const mismatch = best && custOf(best.c.cust).name.toUpperCase() !== r.payer;
  const all = arOpen(), sum = all.reduce((a, x) => a + x.amt - x.got, 0);
  const by = BUCKETS.map(([b, col]) => [b, col, all.filter(x => agingBucket(daysPast(x.due)) === b).reduce((a, x) => a + x.amt - x.got, 0)]);
  const T = {
    claim: () => `<div class="grid g2"><div>${table(['流水', '日期', '付款人', '金额', '状态'], DB.receipts.map(x => [mono(x.id), x.date, `<span class="wrap">${x.payer}</span>`, `${x.cur} ${fmt(x.amt, 2)}`, x.claimed ? pill('已认领', 'ok') : pill('待认领', 'warn')]), { num: [3], click: i => `data-act="recSel" data-id="${DB.receipts[i].id}"`, sel: i => DB.receipts[i].id === r.id })}</div>
      <div class="card" style="background:var(--card2)"><h3>认领 ${mono(r.id)}</h3>${r.claimed ? `<div class="banner ok"><b>已认领</b><span>${r.claimed}<br>记账汇率 ${r.rate.toFixed(4)}，折合 ¥${fmt(r.amt * r.rate, 2)}<br>已核销发票并产生凭证</span></div>` : best ? `
        <div class="kv"><div><span>付款人</span>${r.payer}</div><div><span>金额</span>${r.cur} ${fmt(r.amt, 2)}</div><div><span>建议对应</span>${best.c.pi} · ${best.p[0]}</div><div><span>合同买方</span>${custOf(best.c.cust).name}</div><div><span>记账汇率</span>${lk.toFixed(4)}</div><div><span>折合人民币</span>¥${fmt(r.amt * lk, 2)}</div></div>
        ${mismatch ? `<div class="banner warn mt"><b>付款人与买方不一致</b><span>第三方代付要留存客户的付款委托书，否则可能影响出口退税。</span></div><label class="chk"><input type="checkbox" id="ackPayer"> 已取得客户付款委托书</label>` : '<div class="banner ok mt"><b>付款人与买方一致</b><span>可以直接认领。</span></div>'}
        <div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="claim" data-id="${best.c.pi}|${best.i}">认领并核销</button></div>` : '<p class="note">没有找到可对应的未收款项。</p>'}
        <p class="note">认领＝收款＋核销＋凭证一次完成，不再分收款单与核销单。</p></div></div>`,
    inv: () => table(['发票', 'PI', '客户', '金额', '已收', '到期', '金税'], DB.ar.map(x => [mono(x.inv), mono(x.pi), custOf(x.cust).short, `${x.cur} ${fmt(x.amt, 2)}`, fmt(x.got, 2), x.due, pill('已上传', 'ok')]), { num: [3, 4] }) + `<p class="note">外销发票在出运生成单证时自动产生；内销发票可经金税接口导出开具，红字发票在退货流程中产生。</p>`,
    aging: () => `<div class="aging">${by.map(([b, col, v]) => v ? `<i style="width:${v / sum * 100}%;background:${col}" title="${b}"></i>` : '').join('')}</div><div class="legend">${by.map(([b, col, v]) => `<span><i style="background:${col}"></i>${b} · USD ${fmt(v)}</span>`).join('')}</div>
      <div class="mt">${table(['发票', 'PI', '客户', '负责业务', '到期', '未收', '账龄', '最近跟催', ''], all.map(x => { const d = daysPast(x.due); return [mono(x.inv), mono(x.pi), custOf(x.cust).short, custOf(x.cust).sales, x.due, `${x.cur} ${fmt(x.amt - x.got, 2)}`, d > 0 ? pill(`逾期 ${d} 天`, d > 90 ? 'bad' : 'warn') : pill('未到期', 'mute'), x.log[0] ? `<span class="wrap">${x.log[0][0]} ${x.log[0][2]}</span>` : '<span class="dn">尚未跟催</span>', d > 0 ? `<button class="btn sm" type="button" data-act="dun" data-id="${x.inv}">记录跟催</button>` : '']; }), { num: [5] })}</div>`
  };
  return head('应收与收款', '发票、到账认领、核销、账龄跟催都在这里') + `
  <div class="grid g4"><div class="card kpi"><div class="k">未收合计</div><div class="v">USD ${fmt(sum)}</div></div><div class="card kpi"><div class="k">逾期金额</div><div class="v dn">USD ${fmt(overdueAmt())}</div></div><div class="card kpi"><div class="k">逾期 90 天以上</div><div class="v dn">USD ${fmt(by[4][2] + by[5][2])}</div></div><div class="card kpi"><div class="k">待认领到账</div><div class="v">${DB.receipts.filter(x => !x.claimed).length} 笔</div></div></div>
  <div class="card mt"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.arTab === k}" data-act="arTab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.arTab]()}</div>`;
};

V.ap = () => {
  const tabs = [['inv', '采购发票与匹配'], ['pay', '付款计划']];
  const T = {
    inv: () => table(['发票', '供应商', '对应单据', '金额 ¥', '税额 ¥', '匹配', '到期', ''], DB.ap.map(x => [mono(x.id), supOf(x.sup).name, `<span class="wrap">${x.ref}</span>`, fmt(x.amt, 2), fmt(x.tax, 2), x.match === '单价不一致' ? pill(x.match, 'bad') : pill(x.match, 'ok'), x.due, x.st === '待核对' ? `<button class="btn sm" type="button" data-act="apFix" data-id="${x.id}">请供应商更正</button>` : '']), { num: [3, 4] }) +
      (DB.ap.find(x => x.diff) ? `<div class="banner warn mt"><b>单价不一致</b><span>${DB.ap.find(x => x.diff).diff}。取代易助的“采购价差异常表”，发票登记时就提示。</span></div>` : '') + `<p class="note">三单匹配：采购单、入库数量、供应商发票三者一致才能排付款。</p>`,
    pay: () => table(['到期', '供应商', '发票', '金额 ¥', '状态', ''], DB.ap.filter(x => x.st !== '待核对').sort((a, b) => md(a.due) - md(b.due)).map(x => [x.due, supOf(x.sup).name, mono(x.id), fmt(x.amt, 2), x.paid ? pill('已付款', 'ok') : x.st === '本周到期' ? pill('本周到期', 'warn') : pill('待付款', 'mute'), x.paid ? '' : `<button class="btn sm pri" type="button" data-act="pay" data-id="${x.id}">送审付款</button>`]), { num: [3] }) + `<p class="note">付款超过 ¥30,000 需总经理审批；付款后自动核销发票并产生凭证。</p>`
  };
  const open = DB.ap.filter(x => !x.paid).reduce((a, x) => a + x.amt, 0);
  return head('应付与付款', '采购发票、三单匹配、付款计划与核销') + `
  <div class="grid g4"><div class="card kpi"><div class="k">未付合计</div><div class="v">¥${fmt(open)}</div></div><div class="card kpi"><div class="k">本周到期</div><div class="v dn">¥${fmt(DB.ap.filter(x => x.st === '本周到期' && !x.paid).reduce((a, x) => a + x.amt, 0))}</div></div><div class="card kpi"><div class="k">待核对发票</div><div class="v">${DB.ap.filter(x => x.st === '待核对').length}</div></div><div class="card kpi"><div class="k">本月已付</div><div class="v">¥${fmt(DB.ap.filter(x => x.paid).reduce((a, x) => a + x.amt, 0) + 128600)}</div></div></div>
  <div class="card mt"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.apTab === k}" data-act="apTab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.apTab]()}</div>`;
};

V.fx = () => {
  const lk = curLock(), d = DB.fx.daily, last = d[d.length - 1], u = DB.fx.unsettled;
  const W = 520, H = 150, mn = Math.min(...d.map(x => x[1]), lk[1]) - .003, mx = Math.max(...d.map(x => x[1]), lk[1]) + .003;
  const X = i => 40 + i * (W - 60) / (d.length - 1), Y = v => 14 + (mx - v) / (mx - mn) * (H - 34);
  const line = d.map((x, i) => `${X(i).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' ');
  const reval = u * (last[1] - lk[1]);
  return head('汇率与结汇', '月初锁定记账汇率 → 收款按锁定汇率入账 → 结汇记实际汇差 → 月末自动调汇') + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">本月锁定汇率</div><div class="v">${lk[1].toFixed(4)}</div><div class="d">${lk[2]} · ${lk[3]}</div></div>
    <div class="card kpi"><div class="k">今日参考汇率</div><div class="v">${last[1].toFixed(4)}</div><div class="d ${last[1] > lk[1] ? 'up' : 'dn'}">比锁定 ${last[1] > lk[1] ? '+' : ''}${fmt((last[1] - lk[1]) / lk[1] * 100, 2)}%</div></div>
    <div class="card kpi"><div class="k">未结汇美元</div><div class="v">USD ${fmt(u)}</div></div>
    <div class="card kpi"><div class="k">月末调汇预估</div><div class="v ${reval >= 0 ? 'up' : 'dn'}">${reval >= 0 ? '+' : '−'}¥${fmt(Math.abs(reval), 2)}</div><div class="d">按今日汇率重估美元户</div></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>参考汇率走势 <small>虚线为本月锁定汇率</small></h3><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近一周美元兑人民币参考汇率从 7.1395 升到 7.1503" style="width:100%;height:auto">
      <line x1="40" x2="${W - 20}" y1="${Y(lk[1]).toFixed(1)}" y2="${Y(lk[1]).toFixed(1)}" stroke="var(--yz)" stroke-dasharray="4 4"/><text x="${W - 20}" y="${(Y(lk[1]) - 5).toFixed(1)}" text-anchor="end" style="fill:var(--yz)">锁定 ${lk[1].toFixed(4)}</text>
      <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2"/>${d.map((x, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="3" fill="var(--accent)"/><text x="${X(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">${x[0]}</text>`).join('')}</svg></div>
    <div class="card"><h3>登记结汇</h3><div class="form">
      <label for="fx-amt">结汇金额（USD）<input id="fx-amt" type="number" value="${u}" min="0" step="100"></label>
      <label for="fx-rate">银行结汇汇率<input id="fx-rate" type="number" value="${last[1].toFixed(4)}" step="0.0001"></label>
    </div><div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="settle" ${u ? '' : 'disabled'}>登记结汇</button><button class="btn" type="button" data-act="toast" data-msg="已登记远期锁汇 USD 50,000 @ 7.1200（演示）">登记远期锁汇</button></div><p class="note">结汇与调汇都自动产生凭证，汇差计入“财务费用-汇兑损益”，并带回对应 PI 的利润。</p></div>
  </div>
  <div class="card mt"><h3>每月锁定记录</h3>${table(['月份', '汇率', '锁定人', '时间'], DB.fx.locks.map(l => [l[0], l[1].toFixed(4), l[2], l[3]]), { num: [1] })}<p class="note">每月 1 日 9:00 提醒财务锁定；超过 3 天未锁定，工作台会标红。</p></div>`;
};

V.rebate = () => head('出口退税', '专票与报关单配对，申报前先检查品名、规格是否一致') + `
  <div class="banner own"><b>申报期限</b><span>须在报关出口之日次月起至次年 4 月 30 日前申报，系统对每张报关单倒数提醒。</span></div>` +
  table(['报关单号', 'PI', '进项发票', '一致性', '可退税额 ¥', '状态'], DB.rebates.map(r => [mono(r.cd), mono(r.pi), r.inv, r.match === '一致' ? pill('一致', 'ok') : r.match === '—' ? '—' : pill(r.match, 'warn'), r.amt ? fmt(r.amt) : '—', r.st === '可申报' ? pill('可申报', 'ok') : r.st === '待更正' ? pill('待更正', 'warn') : pill(r.st, 'mute')]), { num: [4] }) + `
  <p class="note">进项专票来自“应付与付款”的采购发票，报关单来自“出运与单证”，不用重复录入。</p>`;

V.cost = () => {
  const tabs = [['pi', '单票利润'], ['month', '月成本计算'], ['wo', '工单与委外成本']];
  const c = scOf('PI20261021SGF');
  const rows = [['收入（折人民币）', 177151, 176948], ['生产成本', -152000, -152760], ['运费与杂费', -4300, -4428], ['退税', 17489, 17489], ['佣金', -3540, -3540]];
  const est = rows.reduce((a, r) => a + r[1], 0), act = rows.reduce((a, r) => a + r[2], 0);
  const diffs = rows.map(r => [r[0], r[2] - r[1]]).filter(d => d[1]), maxAbs = Math.max(...diffs.map(d => Math.abs(d[1])));
  const W = 520, mid = 300;
  const bars = diffs.map(([n, d], i) => { const w = Math.abs(d) / maxAbs * 180, y = 14 + i * 40, x = d < 0 ? mid - w : mid; return `<text x="8" y="${y + 17}" style="fill:var(--ink);font-size:12.5px">${n}</text><rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="26" rx="5" fill="${d < 0 ? 'var(--bad)' : 'var(--ok)'}" opacity=".8"/><text x="${d < 0 ? (x - 6).toFixed(1) : (x + w + 6).toFixed(1)}" y="${y + 17}" text-anchor="${d < 0 ? 'end' : 'start'}" style="fill:var(--ink)">${d < 0 ? '−' : '+'}¥${fmt(Math.abs(d))}</text>`; }).join('');
  const T = {
    pi: () => `<div class="grid g4"><div class="card kpi"><div class="k">预估利润</div><div class="v">¥${fmt(est)}</div></div><div class="card kpi"><div class="k">实际利润</div><div class="v">¥${fmt(act)}</div><div class="d dn">少 ¥${fmt(est - act)}</div></div><div class="card kpi"><div class="k">预估毛利率</div><div class="v">${fmt(est / rows[0][1] * 100, 1)}%</div></div><div class="card kpi"><div class="k">实际毛利率</div><div class="v">${fmt(act / rows[0][2] * 100, 1)}%</div></div></div>
      <div class="grid g2 mt"><div><h3>${c.pi} 差异拆解 <small>实际减预估</small></h3><svg class="chart" viewBox="0 0 ${W} ${14 + diffs.length * 40}" role="img" aria-label="利润差异：汇差少 203 元，生产成本多 760 元，运费多 128 元" style="width:100%;height:auto"><line x1="${mid}" x2="${mid}" y1="6" y2="${10 + diffs.length * 40}" stroke="var(--line)"/>${bars}</svg></div>
      <div><h3>各合同利润</h3>${table(['PI', '客户', '预估', '实际'], DB.contracts.map(x => [piBtn(x.pi), custOf(x.cust).short, '¥' + fmt(x.est), x.act == null ? pill('进行中', 'run') : '¥' + fmt(x.act)]), { num: [2, 3] })}</div></div>`,
    month: () => table(['产品', '期初数量', '期初金额 ¥', '本期入库', '入库金额 ¥', '加权平均单价 ¥'], [['C91QS100LR4-A2', 36, 18446, 90, 46116, 512.40], ['C91SP25SR-B1', 60, 3168, 3000, 158400, 52.80], ['C91SP10LR-D1', 820, 33784, 0, 0, 41.20]].map(r => [mono(r[0]), fmt(r[1]), fmt(r[2]), fmt(r[3]), fmt(r[4]), fmt(r[5], 2)]), { num: [1, 2, 3, 4, 5] }) + `<div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="toast" data-msg="已完成 11 月成本计算，销售成本已回写（演示）">执行本月成本计算</button></div><p class="note">月加权平均：材料、人工、制造费用、委外加工费分摊到完工产品，再回写销售成本。</p>`,
    wo: () => table(['工单', '产品', '数量', '材料 ¥', '委外加工 ¥', '人工制费 ¥', '单位成本 ¥'], [['WO2026110201', 'C91SP25SR-B1', 3000, 141000, 0, 17400, 52.80], ['WO2026111601', 'C91QS100LR4-A2', 90, 39780, 324, 6012, 512.40]].map(r => [mono(r[0]), mono(r[1]), fmt(r[2]), fmt(r[3]), fmt(r[4]), fmt(r[5]), fmt(r[6], 2)]), { num: [2, 3, 4, 5, 6] }) + `<p class="note">人工与制造费用按部门工时分摊，分摊比例在总账基础设置维护。</p>`
  };
  return head('成本与利润', '月加权平均成本、工单与委外成本、每张 PI 的实际利润') + `<div class="card"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.costTab === k}" data-act="costTab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.costTab]()}</div>`;
};

V.gl = () => {
  const tabs = [['vou', '自动凭证'], ['rules', '分录规则'], ['rep', '报表'], ['close', '月末关账']];
  const pend = DB.vouchers.filter(v => v.st === '待审核').length;
  const checks = [['未审核单据', `${pend + pendingAp()} 张`, pend + pendingAp() === 0], ['待检验收货', `${DB.inbound.filter(x => x.st === '待检验').length} 笔`, DB.inbound.every(x => x.st !== '待检验')], ['本月记账汇率已锁定', curLock()[0], true], ['成本计算', '未执行', false], ['月末调汇', '未执行', false], ['损益结转', '关账时自动执行', true]];
  const T = {
    vou: () => DB.vouchers.map(v => `<div class="card" style="margin-bottom:10px;background:var(--card2)"><h3>${mono(v.no)} <small>来源：${v.src}</small>${v.st === '待审核' ? pill('待审核', 'warn') : pill('已过账', 'ok')}</h3>${table(['科目', '借方 ¥', '贷方 ¥'], v.lines.map(l => [l[0], l[1] ? fmt(l[1], 2) : '', l[2] ? fmt(l[2], 2) : '']), { num: [1, 2] })}${v.st === '待审核' ? `<div class="toolbar" style="margin-top:10px"><button class="btn sm pri" type="button" data-act="postV" data-id="${v.no}">审核过账</button></div>` : ''}</div>`).join('') + '<p class="note">单据审核后自动产生凭证，会计只需审核；也可以按月导出给其他会计软件或会计师。</p>',
    rules: () => table(['单据', '借方', '贷方'], DB.rules.map(r => [r[0], r[1], r[2]])) + '<p class="note">分录规则可依贵司科目表调整；外币科目按币别分户（美元户、人民币户）。</p>',
    rep: () => `<div class="grid g2"><div>${table(['利润表（11 月 1–18 日）', '金额 ¥'], [['营业收入', '1,642,380.00'], ['  其中：出口收入', '1,446,380.00'], ['  内销收入', '196,000.00'], ['营业成本', '−1,371,260.00'], ['销售费用（运费、佣金）', '−38,410.00'], ['财务费用-汇兑损益', '−203.36'], ['<b>营业利润</b>', '<b>232,506.64</b>']], { num: [1] })}</div><div>${table(['科目余额（节选）', '期末余额 ¥'], [['银行存款-美元户', '86,361.29'], ['应收账款', '763,214.40'], ['库存商品', '312,580.00'], ['原材料', '96,742.00'], ['应付账款', '−112,402.00']], { num: [1] })}</div></div><p class="note">资产负债表、现金流量表、明细账与往来账也都可以查询与导出。</p>`,
    close: () => table(['检查项', '状态', '结果'], checks.map(c => [c[0], c[1], c[2] ? pill('通过', 'ok') : pill('待处理', 'warn')])) + `<div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="closeMonth" ${checks.every(c => c[2]) ? '' : 'disabled'}>关账 11 月</button><span class="note" style="margin:0">全部通过才能关账；关账后该月单据不能再修改，需要时可由财务主管反关账。</span></div>`
  };
  return head('总账与关账', '凭证由单据自动产生，关账前自动检查；若正式账在其他软件，可只用导出') + `<div class="card"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.glTab === k}" data-act="glTab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.glTab]()}</div>`;
};

/* ================= 设置 ================= */
V.apprset = () => {
  const docs = [['报价单', '毛利低于 12%', '业务主管', '总经理（毛利低于 8%）'], ['合同（PI）', '超过信用额度或金额 > USD 100,000', '业务主管', '总经理'], ['订单变更', '任何变更', '业务主管', '—'], ['采购单', '金额 > ¥30,000', '采购主管', '总经理（> ¥200,000）'], ['付款', '金额 > ¥30,000', '财务主管', '总经理'], ['收款认领', '付款人与买方不一致', '财务主管', '—'], ['超领', '超过 BOM 用量', '生产主管', '—'], ['样品借出', '单次价值 > USD 500', '业务主管', '—']];
  const P = ['业务主管', '采购主管', '生产主管', '财务主管', '总经理'];
  return head('审批设置', '每种单据各自设定：什么情况要审批、谁审、批完通知谁') + `
  <div class="banner own"><b>默认两段</b><span>“送审＋审核”两段，需要时可加到第 3～6 层，或设金额门槛与会签。</span></div>
  <div class="tbl"><table><thead><tr><th>单据</th><th>触发条件</th><th>第 1 层</th><th>第 2 层</th><th></th></tr></thead><tbody>${docs.map((d, i) => `<tr><td><b>${d[0]}</b></td><td class="wrap">${d[1]}</td><td><select id="ap1-${i}" aria-label="第 1 层审批人">${P.map(o => `<option ${o === d[2] ? 'selected' : ''}>${o}</option>`).join('')}</select></td><td class="wrap">${d[3] === '—' ? '<span class="note" style="margin:0">不需要</span>' : d[3]}</td><td><button class="btn sm" type="button" data-act="toast" data-msg="已为「${d[0]}」新增一层审批（演示）">${ic('plus')}加一层</button></td></tr>`).join('')}</tbody></table></div>
  <div class="toolbar mt"><button class="btn pri" type="button" data-act="toast" data-msg="审批设置已保存（演示）">保存设置</button></div>`;
};

V.category = () => {
  const opt = { 业务类型: ['外销', '内销'], 用途: ['量产', '样品', '验证', '需求预测'], 产品线: ['光模块', '芯片'] };
  const map = [['外贸', '业务类型', '外销'], ['国外', '业务类型', '外销'], ['内贸', '业务类型', '内销'], ['国内', '业务类型', '内销'], ['样品', '用途', '样品'], ['验证', '用途', '验证'], ['需求', '用途', '需求预测'], ['芯片', '产品线', '芯片'], ['22', '项目号', ''], ['365', '项目号', ''], ['647', '项目号', '']];
  return head('业务分类', '易助“性质类型”一个下拉混了内外销、用途、产品线和项目号，迁移时拆成四个字段') + `
  <div class="grid g2">
    <div class="card"><h3>旧值怎么对应</h3><div style="display:grid;gap:8px">${map.map(([o, f, v], i) => `<div class="map"><span class="old">${o}</span><span class="arr">→</span><span class="toolbar" style="flex-wrap:nowrap"><span class="tag own">${f}</span>${f === '项目号' ? pill('请贵司确认含义', 'warn') : `<select id="cat-${i}" aria-label="${o} 对应值" style="width:auto">${opt[f].map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select>`}</span></div>`).join('')}</div></div>
    <div class="card"><h3>拆分后的四个字段</h3>${table(['字段', '可选值', '用在哪里'], [['业务类型', '外销、内销', '流程节点、单证、开票'], ['用途', '量产、样品、验证、需求预测', '样品统计、利润分开看'], ['产品线', '光模块、芯片', '业绩与毛利按产品线'], ['项目号', '自由输入', '对应客户项目或专案']])}<p class="note">拆开后，报表能直接按“外销量产”“样品”分开统计。</p></div>
  </div>`;
};

V.perm = () => {
  const roles = [['业务员', '自己的客户与合同', '可看', '隐藏', '隐藏'], ['业务主管', '本部门', '可看', '可看', '可看'], ['采购', '采购与供应商', '隐藏', '可看', '隐藏'], ['仓库', '库存与收货', '隐藏', '隐藏', '隐藏'], ['生产', '工单与委外', '隐藏', '可看', '隐藏'], ['财务', '全部', '可看', '可看', '可看'], ['总经理', '全部', '可看', '可看', '可看']];
  const cell = v => v === '可看' ? pill('可看', 'ok') : pill('隐藏', 'mute');
  return head('权限与日志', '按角色决定看得到哪些资料、哪些字段；重要操作留日志') + `
  <div class="banner ok"><b>新账号默认看不到任何客户</b><span>先指定角色与负责范围才开放。</span></div>` +
  table(['角色', '数据范围', '售价', '成本与采购价', '利润'], roles.map(r => [`<b>${r[0]}</b>`, r[1], cell(r[2]), cell(r[3]), cell(r[4])])) + `
  <div class="card mt"><h3>操作日志</h3>${table(['时间', '人员', '操作', '单据'], [['11-18 10:32', '王总', '核准信用额度', 'PI20261009MNO'], ['11-18 09:15', '赵敏', '审核凭证', '记-1117-012'], ['11-17 16:40', '林晓', '提交订单变更', 'BG-0012']])}</div>`;
};

V.country = () => head('国家配置', '开拓新国家只改配置，不改程序') +
  table(['国家', '语言', '币种', '日期格式', '产地证', '合规要点'], [['越南', '英文、越南文', 'USD', 'DD/MM/YYYY', 'Form E', '越文标签'], ['泰国', '英文', 'USD', 'DD/MM/YYYY', 'RCEP / Form E', '—'], ['菲律宾', '英文', 'USD', 'MM/DD/YYYY', 'Form E', '—'], ['印尼', '英文、印尼文', 'USD', 'DD/MM/YYYY', 'Form E', 'SDPPI 认证'], ['墨西哥', '英文、西班牙文', 'USD', 'DD/MM/YYYY', '原产地声明', '进口商 RFC'], ['德国', '英文、德文', 'USD／EUR', 'DD.MM.YYYY', '—', 'CE、RoHS 声明']]) +
  `<p class="note">单证与打印模板、表尾签核栏、假日表也在这里按国家与单据设定。</p>`;

V.migrate = () => {
  const steps = [['主档', '客户、供应商、商品、BOM、仓库、科目', '从易助导出后导入', '完成', 'ok'], ['期初库存', '各仓库存数量、批号、单位成本', '以切换日盘点数为准', '待盘点', 'warn'], ['未结单据', '进行中订单、未完工单、未到货采购单', '逐张转入，保留原单号对照', '进行中', 'run'], ['未结应收应付', '未收发票、未付发票、预收预付', '按发票逐张导入', '待开始', 'mute'], ['历史报价附件', '易助报价单的 Excel 附件', '导入附件清单，按客户与产品可查', '待开始', 'mute'], ['平行运行', '新旧系统同时跑一个月', '每周对账库存与应收', '待开始', 'mute']];
  return head('上线迁移', '从易助切换到本系统的步骤；切换后易助保留为只读，查询历史资料') + `
  <div class="card">${stepper(steps.map(s => s[0]), 1)}</div>
  <div class="mt">${table(['步骤', '内容', '做法', '状态'], steps.map(s => [`<b>${s[0]}</b>`, `<span class="wrap">${s[1]}</span>`, `<span class="wrap">${s[2]}</span>`, pill(s[3], s[4])]))}</div>
  <p class="note">建议在月初切换，期初数用上月关账结果；切换前一周冻结主档修改。</p>`;
};

V.window = () => head('国际贸易单一窗口', '先做“导出符合格式的资料”，再评估直接对接') + `
  <div class="card">${table(['资料', '格式', '状态'], [['报关单草稿', '单一窗口导入格式', pill('可用', 'ok')], ['原产地证申请', 'Form E / RCEP', pill('可用', 'ok')], ['商业发票与装箱单', 'PDF、Excel', pill('可用', 'ok')]])}<div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="toast" data-msg="已导出 SH-2611-03 报关资料（演示）">导出 SH-2611-03</button></div></div>`;

V.portal = () => head('客户门户', '客户与外协厂用链接登录，只看自己的单') + `
  <div class="grid g2">
    <div class="card"><h3>客户看到的画面</h3><div class="phone"><div class="pc"><h5>Kepler Telecom · Orders</h5>${[['PI20261103KEP', 'In production 45%', 'ETD 11-28'], ['PI20260912KEP', 'Delivered', 'Invoice due']].map(r => `<div style="border-top:1px solid var(--line);padding-top:8px;margin-top:8px"><b class="m">${r[0]}</b><br><span style="color:var(--muted)">${r[1]} · ${r[2]}</span></div>`).join('')}<div class="toolbar" style="margin-top:10px"><span class="btn sm">Download PI</span><span class="btn sm">Packing list</span></div></div></div></div>
    <div class="card"><h3>外协厂看到的画面</h3>${table(['委外单', '主件', '数量', '已回货', '预计回货'], DB.wws.map(w => [mono(w.id), w.item, w.qty, w.back, w.due]), { num: [2, 3] })}<p class="note">外协厂可上传回货照片与检验报告。</p></div>
  </div>`;
</script>
