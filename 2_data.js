<script>
/* ================= 基础工具 ================= */
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = t => String(t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const TODAY = new Date(2026, 10, 18);
const md = s => { const [m, d] = s.split('-').map(Number); return new Date(2026, m - 1, d); };
const daysPast = s => Math.round((TODAY - md(s)) / 864e5);
const S = {
  view: 'dash', arg: null, tab: 'lines', drawer: null, choice: {}, note: {},
  custF: '全部', scF: '全部', recSel: 'SK-1188', shipSel: 'SH-2611-03', sampleF: '全部', arTab: 'claim', arF: '全部', apTab: 'inv', stockTab: 'stock', moveF: '全部', glTab: 'vou', costTab: 'pi', mapF: '全部', perfRule: 'gp', perfCash: true,
  q: { cust: 'C-304', prod: 'C91QS100LR4-A2', cost: 680, rebate: 13, fx: 7.1432, freight: 0.9, qty: 300, comm: 2, margin: 12, extra: 4 }
};
try { const c = JSON.parse(localStorage.getItem('erp5a-req') || '{}'); if (c && typeof c === 'object') S.choice = c; } catch (_) {}
try { const n = JSON.parse(localStorage.getItem('erp5a-note') || '{}'); if (n && typeof n === 'object') S.note = n; } catch (_) {}

/* ================= 示例数据（全部为虚构） ================= */
function seed() {
  return {
    customers: [
      { id: 'C-301', name: 'Kepler Telecom GmbH', short: 'Kepler', country: '德国', cc: 'DE', cur: 'USD', level: 'A', sales: '林晓', pool: '私海', last: '2 天前', type: '外销', contact: 'Jonas Weber（采购经理）', ch: '邮件', credit: 150000, terms: '30% 订金，出货前付清',
        follow: [['11-16', '邮件', '确认追加 300 只 10G LR，交期改 11-28'], ['11-03', '视频会议', 'PI 确认，订金三天内付'], ['10-21', '邮件', '100G LR4 样品测试通过']],
        chat: [['客户', '11-16 15:02', 'Can you add 300 pcs of 10G LR to the current PI?'], ['我', '11-16 15:20', 'Yes. Updated PI will be sent today, lead time 11/28.']] },
      { id: 'C-302', name: 'Altamira Networks S.A. de C.V.', short: 'Altamira', country: '墨西哥', cc: 'MX', cur: 'USD', level: 'A', sales: '陈一凡', pool: '私海', last: '昨天', type: '外销', contact: 'Lucía Romero（技术采购）', ch: 'WhatsApp', credit: 120000, terms: '30% 订金，见提单副本付清',
        follow: [['11-17', 'WhatsApp', '客户要求改中性包装＋英文说明书'], ['11-09', '快递', '寄出 100G LR4 样品 4 只']],
        chat: [['客户', '11-17 09:41', 'Please ship with neutral packing and English manual.'], ['我', '11-17 09:55', 'Noted, change order submitted. No extra cost.']] },
      { id: 'C-303', name: 'Saigon FiberLink JSC', short: 'Saigon FL', country: '越南', cc: 'VN', cur: 'USD', level: 'B', sales: '林晓', pool: '私海', last: '6 天前', type: '外销', contact: 'Nguyen Thu Ha（采购）', ch: 'Zalo', credit: 60000, terms: '全款发货',
        follow: [['11-12', 'Zalo', '已签收，询问下一批 CWDM 价格']], chat: [['客户', '11-12 10:05', 'Goods received. Price for next 6,000 pcs?']] },
      { id: 'C-304', name: 'Bangkok NetOps Co., Ltd.', short: 'BKK NetOps', country: '泰国', cc: 'TH', cur: 'USD', level: 'B', sales: '周可', pool: '私海', last: '今天', type: '外销', contact: 'Somchai P.（老板）', ch: 'LINE', credit: 50000, terms: '30% 订金，到货后 20 天付清',
        follow: [['11-18', 'LINE', '催收尾款，客户说月底前付'], ['11-08', 'LINE', '反映 12 只 10G LR 的 DDM 读数异常']],
        chat: [['我', '11-18 10:12', 'Kindly arrange the balance USD 26,320, it is 12 days overdue.'], ['客户', '11-18 10:40', 'Will pay before month end.']] },
      { id: 'C-305', name: 'Manila Opticom Inc.', short: 'Manila Opticom', country: '菲律宾', cc: 'PH', cur: 'USD', level: 'C', sales: '陈一凡', pool: '私海', last: '4 天前', type: '外销', contact: 'Paolo Reyes（采购）', ch: 'WhatsApp', credit: 30000, terms: '30% 订金，出货前付清',
        follow: [['11-14', 'WhatsApp', '订金由香港贸易公司代付']], chat: [['客户', '11-14 18:20', 'Deposit paid by our HK partner, Optimax Trading.']] },
      { id: 'C-306', name: 'PT Jakarta LinkWorks', short: 'Jakarta LW', country: '印尼', cc: 'ID', cur: 'USD', level: 'C', sales: '—', pool: '公海', last: '35 天前', type: '外销', contact: 'Budi S.', ch: 'WhatsApp', credit: 20000, terms: '—',
        follow: [['10-14', 'WhatsApp', '询价 10G LR 800 只，提到需要 SDPPI 认证']], chat: [['客户', '10-14 11:02', 'Do you have SDPPI certificate?']] },
      { id: 'C-307', name: '深圳云帆网络科技有限公司', short: '云帆网络', country: '中国', cc: 'CN', cur: 'CNY', level: 'B', sales: '周可', pool: '私海', last: '今天', type: '内销', contact: '刘工（采购）', ch: '微信', credit: 500000, terms: '货到 30 天',
        follow: [['11-18', '微信', '确认 11-30 送货']], chat: [['客户', '11-18 08:50', '25G 那批 11 月底能到吗？'], ['我', '11-18 09:02', '要等 VCSEL 到料，最晚 12 月 3 日。']] }
    ],
    suppliers: [
      { id: 'S-01', name: '光芯电子', cat: '激光器、VCSEL', terms: '月结 30 天', ontime: 92, qual: 98.6, open: 44200 },
      { id: 'S-02', name: '华晶光电', cat: 'TOSA、ROSA 器件', terms: '月结 60 天', ontime: 88, qual: 99.1, open: 60800 },
      { id: 'S-03', name: '精密五金', cat: '外壳、拉环、散热片', terms: '月结 30 天', ontime: 97, qual: 99.6, open: 4110 },
      { id: 'S-04', name: '外协厂甲', cat: 'PCBA 贴片（委外）', terms: '月结 30 天', ontime: 90, qual: 98.9, open: 432 },
      { id: 'S-05', name: '立信电子', cat: '芯片、阻容', terms: '款到发货', ontime: 95, qual: 99.8, open: 0 },
      { id: 'S-06', name: '顺达物流', cat: '国际快递、空运', terms: '月结', ontime: 96, qual: 100, open: 2860 }
    ],
    products: [
      { code: 'C91QS100LR4-A2', inner: '91QS100LR4-A2', name: '100G QSFP28 LR4 10km', hs: '8517.6200', kg: 0.12, cost: 680, rebate: 13 },
      { code: 'C91SP10LR-D1', inner: '91SP10LR-D1', name: '10G SFP+ LR 1310nm 10km', hs: '8517.6200', kg: 0.05, cost: 58, rebate: 13 },
      { code: 'C91SP25SR-B1', inner: '91SP25SR-B1', name: '25G SFP28 SR 850nm 100m', hs: '8517.6200', kg: 0.05, cost: 72, rebate: 13 },
      { code: 'C91SPCW55-40', inner: '91SPCW55-40', name: '1.25G SFP CWDM 1550nm 40km', hs: '8517.6200', kg: 0.05, cost: 38, rebate: 13 },
      { code: 'C91GPON-CP', inner: '91GPON-CP', name: 'GPON OLT Class C+ SFP', hs: '8517.6200', kg: 0.05, cost: 96, rebate: 13 }
    ],
    mats: {
      'TOSA-LR4': ['发射器件 TOSA LR4', 'S-02', 238], 'ROSA-LR4': ['接收器件 ROSA LR4', 'S-02', 142], 'PCBA-QS100': ['PCBA 100G LR4', 'S-04', 186], 'IC-DRV100': ['100G 驱动芯片', 'S-05', 96],
      'SHELL-QS28': ['QSFP28 外壳', 'S-03', 12.5], 'PULL-QS28': ['QSFP28 拉环', 'S-03', 1.2], 'HS-QS28': ['散热片', 'S-03', 3.4],
      'TOSA-10LR': ['发射器件 TOSA 10G LR', 'S-02', 21], 'ROSA-10LR': ['接收器件 ROSA 10G', 'S-02', 14], 'SHELL-SFP': ['SFP 外壳', 'S-03', 2.2], 'VCSEL-25G': ['VCSEL 25G 激光器', 'S-01', 26]
    },
    boms: {
      'C91QS100LR4-A2': [['PCBA-QS100', 1, '委外贴片'], ['TOSA-LR4', 1, '采购'], ['ROSA-LR4', 1, '采购'], ['SHELL-QS28', 1, '采购'], ['PULL-QS28', 1, '采购'], ['HS-QS28', 2, '采购']],
      'C91SP10LR-D1': [['TOSA-10LR', 1, '采购'], ['ROSA-10LR', 1, '采购'], ['SHELL-SFP', 1, '采购']],
      'C91SP25SR-B1': [['VCSEL-25G', 1, '采购'], ['SHELL-SFP', 1, '采购']]
    },
    bomHist: [['V3', '11-02', 'HS-QS28 散热片由 1 片改 2 片', '工程 · 何工'], ['V2', '08-15', 'TOSA 改用华晶光电', '工程 · 何工']],
    quotes: [
      { id: 'BJ2026111702', ver: 1, cust: 'C-304', prod: 'C91QS100LR4-A2', qty: 300, price: 121.0, margin: 9.4, status: '待审批', att: 2, sales: '周可' },
      { id: 'BJ2026111401', ver: 1, cust: 'C-306', prod: 'C91SP10LR-D1', qty: 800, price: 10.4, margin: 18.1, status: '已发客户', att: 1, sales: '林晓' },
      { id: 'BJ2026110301', ver: 3, cust: 'C-301', prod: 'C91QS100LR4-A2', qty: 200, price: 128.0, margin: 15.8, status: '已转合同', pi: 'PI20261103KEP', att: 3, sales: '林晓' },
      { id: 'BJ2026102501', ver: 2, cust: 'C-302', prod: 'C91SP25SR-B1', qty: 3000, price: 14.6, margin: 16.4, status: '已转合同', pi: 'PI20261028ALT', att: 2, sales: '陈一凡' }
    ],
    quoteVers: [['V1', '10-21', 'USD 136.00', '首次报价'], ['V2', '10-28', 'USD 131.00', '客户要求 200 只以上降价'], ['V3', '11-02', 'USD 128.00', '加订 10G LR 1,500 只打包价']],
    contracts: [
      { pi: 'PI20261103KEP', cust: 'C-301', type: '外销', term: 'FOB 深圳', cur: 'USD', sales: '林晓', lines: [['C91QS100LR4-A2', 200, 128.0], ['C91SP10LR-D1', 1500, 9.8]], node: 3, ver: 2,
        pay: [['订金 30%', 12090, '11-06', '已收'], ['出货前 70%', 28210, '11-28', '未收']], wo: ['WO2026111601', 'WO2026111602'], po: ['PO2026111001'], ship: '', inv: '', est: 61200, act: null, co: '—', late: 0, use: '量产' },
      { pi: 'PI20261028ALT', cust: 'C-302', type: '外销', term: 'CIP 墨西哥城', cur: 'USD', sales: '陈一凡', lines: [['C91SP25SR-B1', 3000, 14.6]], node: 5, ver: 1,
        pay: [['订金 30%', 13140, '10-30', '已收'], ['见提单副本 70%', 30660, '12-05', '到账待认领']], wo: ['WO2026110201'], po: [], ship: 'SH-2611-03', inv: '', est: 52300, act: null, co: '—', late: 0, use: '量产' },
      { pi: 'PI20261021SGF', cust: 'C-303', type: '外销', term: 'CPT 胡志明', cur: 'USD', sales: '林晓', lines: [['C91SPCW55-40', 4000, 6.2]], node: 10, ver: 1,
        pay: [['全款', 24800, '11-10', '已收']], wo: ['WO2026102401'], po: [], ship: 'SH-2611-01', inv: 'INV2026110501', est: 27900, act: 27120, co: 'Form E', late: 0, use: '量产' },
      { pi: 'PI20261015BKN', cust: 'C-304', type: '外销', term: 'FOB 深圳', cur: 'USD', sales: '周可', lines: [['C91SP10LR-D1', 3000, 9.5], ['C91GPON-CP', 500, 18.2]], node: 9, ver: 1,
        pay: [['订金 30%', 11280, '10-17', '已收'], ['尾款 70%', 26320, '11-06', '逾期']], wo: ['WO2026101801'], po: [], ship: 'SH-2610-07', inv: 'INV2026102702', est: 46800, act: null, co: 'RCEP', late: 12, use: '量产' },
      { pi: 'PI20261009MNO', cust: 'C-305', type: '外销', term: 'CPT 马尼拉', cur: 'USD', sales: '陈一凡', lines: [['C91GPON-CP', 1200, 17.6]], node: 1, ver: 1,
        pay: [['订金 30%', 6336, '11-14', '到账待认领'], ['出货前 70%', 14784, '12-10', '未收']], wo: [], po: [], ship: '', inv: '', est: 21400, act: null, co: 'Form E', late: 0, use: '量产', block: '信用额度待审批，暂不排产' },
      { pi: 'HT20261108YF', cust: 'C-307', type: '内销', term: '送货上门', cur: 'CNY', sales: '周可', lines: [['C91SP25SR-B1', 2000, 98.0]], node: 2, ver: 1,
        pay: [['货到 30 天', 196000, '12-30', '未收']], wo: ['WO2026111301'], po: ['PO2026111302'], ship: '', inv: '', est: 33600, act: null, co: '—', late: 0, use: '量产' }
    ],
    changes: [
      { id: 'BG-0013', pi: 'PI20261028ALT', ver: '002', date: '11-17', diff: [['包装', '标准彩盒', '中性包装＋英文说明书'], ['标签', '贵司 Logo', '无 Logo']], reason: '客户要求中性包装', st: '待审批', by: '陈一凡', effect: '通知包装组改包材，生产不受影响' },
      { id: 'BG-0012', pi: 'PI20261103KEP', ver: '002', date: '11-12', diff: [['C91SP10LR-D1 数量', '1,200', '1,500'], ['交期', '11-25', '11-28'], ['合同金额', 'USD 37,360.00', 'USD 40,300.00']], reason: '客户追加 300 只', st: '已生效', by: '林晓', effect: '工单 WO2026111602 数量自动由 1,200 改 1,500，物料需求重算' }
    ],
    samples: [
      { id: 'YP-0033', cust: 'C-304', prod: 'C91QS100LR4-A2', qty: 2, out: '11-18', due: '12-18', st: '待出库', note: '客户评估 100G 方案' },
      { id: 'YP-0031', cust: 'C-302', prod: 'C91QS100LR4-A2', qty: 4, out: '11-09', due: '12-09', st: '测试中', note: '客户实验室兼容性测试' },
      { id: 'YP-0028', cust: 'C-301', prod: 'C91SP25SR-B1', qty: 10, out: '10-15', due: '11-15', st: '逾期未还', note: '客户说测试完会归还 6 只' },
      { id: 'YP-0024', cust: 'C-303', prod: 'C91SPCW55-40', qty: 6, out: '09-20', due: '10-20', st: '已转订单', note: '测试通过，转为 PI20261021SGF', pi: 'PI20261021SGF' }
    ],
    /* 采购：物料需求由合同与工单自动计算 */
    mrp: [
      { item: 'VCSEL-25G', need: 2000, stock: 300, onway: 0, safe: 200, for: 'HT20261108YF', pr: 'QG2026111801' },
      { item: 'TOSA-LR4', need: 200, stock: 36, onway: 160, safe: 20, for: 'PI20261103KEP', pr: '' },
      { item: 'ROSA-LR4', need: 200, stock: 60, onway: 160, safe: 20, for: 'PI20261103KEP', pr: '' },
      { item: 'TOSA-10LR', need: 1500, stock: 1100, onway: 0, safe: 300, for: 'PI20261103KEP', pr: '' },
      { item: 'ROSA-10LR', need: 1500, stock: 1680, onway: 0, safe: 300, for: 'PI20261103KEP', pr: '' },
      { item: 'SHELL-SFP', need: 3500, stock: 5200, onway: 0, safe: 500, for: '多张合同', pr: '' }
    ],
    prs: [{ id: 'QG2026111801', item: 'VCSEL-25G', qty: 1900, need: '11-24', src: 'HT20261108YF', st: '已转采购', po: 'PO2026111302', offers: [['S-01', 26.0, 7], ['S-05', 27.5, 5]] }],
    pos: [
      { id: 'PO2026111302', sup: 'S-01', lines: [['VCSEL-25G', 1900, 26.0]], due: '11-26', recv: 0, st: '待审批', for: 'HT20261108YF' },
      { id: 'PO2026111001', sup: 'S-02', lines: [['TOSA-LR4', 160, 238], ['ROSA-LR4', 160, 142]], due: '11-20', recv: 160, st: '已到货待检', for: 'PI20261103KEP' },
      { id: 'PO2026110501', sup: 'S-03', lines: [['SHELL-QS28', 300, 12.5], ['PULL-QS28', 300, 1.2]], due: '11-12', recv: 300, st: '已入库', for: '备货' }
    ],
    /* 仓库：收货与检验合并为一个队列 */
    inbound: [
      { id: 'SL2026111801', src: '采购到货', ref: 'PO2026111001', who: '华晶光电', item: 'TOSA-LR4', qty: 160, st: '待检验' },
      { id: 'SL2026111802', src: '采购到货', ref: 'PO2026111001', who: '华晶光电', item: 'ROSA-LR4', qty: 160, st: '待检验' },
      { id: 'WS2026111701', src: '委外回货', ref: 'WW2026111601', who: '外协厂甲', item: 'PCBA-QS100', qty: 120, st: '待检验' },
      { id: 'WG2026111801', src: '工单完工', ref: 'WO2026111601', who: '生产组', item: 'C91QS100LR4-A2', qty: 90, st: '待检验' },
      { id: 'SL2026111201', src: '采购到货', ref: 'PO2026110501', who: '精密五金', item: 'SHELL-QS28', qty: 300, st: '已入库' }
    ],
    stock: [
      ['C91QS100LR4-A2', '成品仓', 36, 0, 512.40], ['C91SP10LR-D1', '成品仓', 820, 600, 41.20], ['C91SP25SR-B1', '成品仓', 3060, 3000, 52.80], ['C91SPCW55-40', '成品仓', 1240, 0, 27.10], ['C91GPON-CP', '成品仓', 140, 0, 70.30],
      ['TOSA-LR4', '原材料仓', 36, 36, 238], ['ROSA-LR4', '原材料仓', 60, 60, 142], ['PCBA-QS100', '半成品仓', 0, 0, 186], ['TOSA-10LR', '原材料仓', 1100, 1100, 21], ['ROSA-10LR', '原材料仓', 1680, 1500, 14], ['SHELL-SFP', '原材料仓', 5200, 3500, 2.2], ['VCSEL-25G', '原材料仓', 300, 300, 26], ['IC-DRV100', '外协厂甲（委外仓）', 220, 220, 96]
    ],
    moves: [
      ['11-18', '样品借出', 'YP-0031', 'C91QS100LR4-A2', -4, '成品仓'],
      ['11-17', '委外回货入库', 'WS2026111501', 'PCBA-QS100', 100, '半成品仓'],
      ['11-17', '销售出库', 'CK2026111702', 'C91SP25SR-B1', -3000, '成品仓'],
      ['11-16', '生产领料', 'LL2026111601', 'TOSA-LR4', -164, '原材料仓'],
      ['11-16', '委外送料', 'WL2026111601', 'IC-DRV100', -220, '原材料仓 → 委外仓'],
      ['11-15', '完工入库', 'WG2026111501', 'C91SP25SR-B1', 3000, '成品仓'],
      ['11-12', '采购入库', 'SL2026111201', 'SHELL-QS28', 300, '原材料仓'],
      ['11-10', '盘点调整', 'PD2026111001', 'SHELL-SFP', -12, '原材料仓'],
      ['11-03', '调拨', 'DB2026110301', 'ROSA-10LR', 200, '原材料仓 → 现场仓']
    ],
    wos: [
      { id: 'WO2026111601', pi: 'PI20261103KEP', item: 'C91QS100LR4-A2', qty: 200, done: 90, issued: true, due: '11-22', st: '生产中' },
      { id: 'WO2026111602', pi: 'PI20261103KEP', item: 'C91SP10LR-D1', qty: 1500, done: 0, issued: false, due: '11-25', st: '待领料' },
      { id: 'WO2026111301', pi: 'HT20261108YF', item: 'C91SP25SR-B1', qty: 2000, done: 0, issued: false, due: '11-30', st: '欠料' },
      { id: 'WO2026110201', pi: 'PI20261028ALT', item: 'C91SP25SR-B1', qty: 3000, done: 3000, issued: true, due: '11-15', st: '已完工' }
    ],
    wws: [{ id: 'WW2026111601', wo: 'WO2026111601', sup: 'S-04', item: 'PCBA-QS100', qty: 220, sent: 220, back: 100, price: 3.6, due: '11-23' }],
    /* 财务 */
    receipts: [
      { id: 'SK-1188', date: '11-17', payer: 'ALTAMIRA NETWORKS S.A. DE C.V.', amt: 30660, cur: 'USD', bank: '中国银行 美元户', claimed: null },
      { id: 'SK-1186', date: '11-14', payer: 'OPTIMAX TRADING LIMITED (HK)', amt: 6336, cur: 'USD', bank: '跨境收款平台', claimed: null },
      { id: 'SK-1179', date: '11-06', payer: 'KEPLER TELECOM GMBH', amt: 12090, cur: 'USD', bank: '中国银行 美元户', claimed: 'PI20261103KEP · 订金 30%', rate: 7.1432 }
    ],
    ar: [
      { inv: 'INV2026102702', pi: 'PI20261015BKN', cust: 'C-304', cur: 'USD', amt: 26320, got: 0, due: '11-06', log: [['11-18', 'LINE', '客户承诺月底前付']] },
      { inv: 'INV2026091803', pi: 'PI20260912KEP', cust: 'C-301', cur: 'USD', amt: 18600, got: 0, due: '10-08', log: [['11-10', '邮件', '客户付款流程卡在内部审批']] },
      { inv: 'INV2026080401', pi: 'PI20260728ALT', cust: 'C-302', cur: 'USD', amt: 22400, got: 12000, due: '09-03', log: [['10-30', 'WhatsApp', '已付 12,000，余款等对方银行放行']] },
      { inv: 'INV2026061102', pi: 'PI20260605MNO', cust: 'C-305', cur: 'USD', amt: 9800, got: 0, due: '07-11', log: [['09-02', 'WhatsApp', '客户称货有质量问题，要求扣款']] },
      { inv: 'INV2026042001', pi: 'PI20260416BKN', cust: 'C-304', cur: 'USD', amt: 7400, got: 0, due: '05-20', log: [] },
      { inv: 'INV2026110501', pi: 'PI20261021SGF', cust: 'C-303', cur: 'USD', amt: 24800, got: 24800, due: '11-10', log: [] }
    ],
    ap: [
      { id: 'JX2026111201', sup: 'S-03', ref: 'PO2026110501 · SL2026111201', amt: 4110, tax: 472.83, match: '三单一致', due: '12-12', paid: 0, st: '待付款' },
      { id: 'JX2026111701', sup: 'S-04', ref: 'WW2026111601 · 回货 100 套', amt: 360, tax: 41.42, match: '按回货数量', due: '12-17', paid: 0, st: '待付款' },
      { id: 'JX2026110801', sup: 'S-02', ref: 'PO2026100802 · SL2026101901', amt: 60800, tax: 6994.69, match: '单价不一致', due: '12-08', paid: 0, st: '待核对', diff: '发票单价 TOSA 240.00，采购单 238.00' },
      { id: 'QT2026111601', sup: 'S-06', ref: '11 月空运运费（分摊到 PI20261028ALT）', amt: 2860, tax: 161.89, match: '其他应付', due: '11-30', paid: 0, st: '待付款' },
      { id: 'JX2026102101', sup: 'S-01', ref: 'PO2026100501 · SL2026101701', amt: 44200, tax: 5084.96, match: '三单一致', due: '11-20', paid: 0, st: '本周到期' }
    ],
    fx: {
      locks: [['2026-11', 7.1432, '财务 · 赵敏', '11-01 09:12'], ['2026-10', 7.1186, '财务 · 赵敏', '10-01 09:05'], ['2026-09', 7.1120, '财务 · 赵敏', '09-01 09:20']],
      daily: [['11-11', 7.1395], ['11-12', 7.1421], ['11-13', 7.1460], ['11-14', 7.1452], ['11-17', 7.1488], ['11-18', 7.1503]],
      hist: [['11-12', 24800, 7.1350, 'PI20261021SGF 全款'], ['10-31', 13140, 7.1290, 'PI20261028ALT 订金'], ['10-20', 11280, 7.1210, 'PI20261015BKN 订金']],
      unsettled: 12090
    },
    vouchers: [
      { no: '记-1118-004', src: '采购发票 JX2026111701', lines: [['委托加工物资', 360, 0], ['应交税费-进项税', 41.42, 0], ['应付账款-外协厂甲', 0, 401.42]], st: '待审核' },
      { no: '记-1117-012', src: '销售出库 CK2026111702', lines: [['主营业务成本', 158400, 0], ['库存商品', 0, 158400]], st: '已过账' },
      { no: '记-1117-011', src: '委外回货 WS2026111501', lines: [['半成品', 18600, 0], ['委托加工物资', 0, 18600]], st: '已过账' },
      { no: '记-1112-006', src: '结汇 PI20261021SGF', lines: [['银行存款-人民币户', 176948, 0], ['财务费用-汇兑损益', 203.36, 0], ['银行存款-美元户', 0, 177151.36]], st: '已过账' },
      { no: '记-1106-003', src: '收款 SK-1179', lines: [['银行存款-美元户', 86361.29, 0], ['预收账款-Kepler', 0, 86361.29]], st: '已过账' }
    ],
    rules: [['销售出库', '主营业务成本', '库存商品'], ['销售发票（外销）', '应收账款', '主营业务收入-出口收入'], ['收款认领', '银行存款-美元户', '应收账款／预收账款'], ['采购入库', '原材料', '应付暂估'], ['采购发票', '应付暂估＋进项税', '应付账款'], ['付款', '应付账款', '银行存款'], ['生产领料', '生产成本', '原材料'], ['完工入库', '库存商品', '生产成本'], ['委外送料', '委托加工物资', '原材料'], ['结汇', '银行存款-人民币户', '银行存款-美元户（差额进汇兑损益）'], ['月末调汇', '银行存款-美元户', '财务费用-汇兑损益']],
    approvals: [
      { id: 'AP-414', type: '采购单', ref: 'PO2026111302', who: '采购 · 吴佳', detail: '光芯电子 VCSEL 1,900 只，¥49,400', status: '待审批', step: '第 1 层 · 采购主管', go: 'po' },
      { id: 'AP-412', type: '订单变更', ref: 'BG-0013', who: '陈一凡', detail: 'PI20261028ALT 改中性包装＋英文说明书', status: '待审批', step: '第 1 层 · 业务主管', go: 'contract|PI20261028ALT|change' },
      { id: 'AP-411', type: '信用额度超限', ref: 'PI20261009MNO', who: '陈一凡', detail: '额度 USD 30,000，已有未收 USD 9,800，本单 USD 21,120', status: '待审批', step: '第 2 层 · 总经理', go: 'contract|PI20261009MNO' },
      { id: 'AP-409', type: '报价毛利低于门槛', ref: 'BJ2026111702', who: '周可', detail: '毛利 9.4%，门槛 12%', status: '待审批', step: '第 1 层 · 业务主管', go: 'quote' }
    ],
    ships: [
      { id: 'SH-2611-03', mode: '空运', route: '深圳 → 墨西哥城 MEX', etd: '11-24', items: [['PI20261028ALT', 'C91SP25SR-B1', 3000]], freight: 1860, ck: 'CK2026111702', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 0, 空运提单: 0, 原产地声明: 0 }, st: '已出库待订舱' },
      { id: 'SH-2611-01', mode: '快递 DHL', route: '深圳 → 胡志明 SGN', etd: '11-05', items: [['PI20261021SGF', 'C91SPCW55-40', 4000]], freight: 620, ck: 'CK2026110402', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 1, 运单: 1, 'Form E 产地证': 1 }, st: '已签收' },
      { id: 'SH-2610-07', mode: '空运', route: '深圳 → 曼谷 BKK', etd: '10-30', items: [['PI20261015BKN', 'C91SP10LR-D1', 3000], ['PI20261015BKN', 'C91GPON-CP', 500]], freight: 980, ck: 'CK2026102902', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 1, 空运提单: 1, 'RCEP 原产地证书': 1 }, st: '已到港' }
    ],
    after: [
      { id: 'AS-0021', pi: 'PI20261015BKN', cust: 'C-304', prod: 'C91SP10LR-D1', qty: 12, kind: '返修', reason: 'DDM 读数异常（温度偏高 8°C）', step: 2, steps: ['登记', '客户寄回', '检测', '维修或换新', '寄回客户'] },
      { id: 'AS-0019', pi: 'PI20260728ALT', cust: 'C-302', prod: 'C91SP25SR-B1', qty: 30, kind: '退货', reason: '客户交换机兼容性问题，改订 10G', step: 4, steps: ['登记', '退货证明', '进口报关', '入库检验', '退款或换货'] }
    ],
    rebates: [
      { cd: '5316 2026 1100 0412', pi: 'PI20261021SGF', inv: '进项专票 2 张', match: '一致', amt: 19940, st: '可申报' },
      { cd: '5316 2026 1000 0388', pi: 'PI20261015BKN', inv: '进项专票 3 张', match: '规格写法不一致', amt: 31230, st: '待更正' },
      { cd: '—', pi: 'PI20261028ALT', inv: '已到票', match: '—', amt: 0, st: '未报关' }
    ]
  };
}
let DB = seed();

/* 外销 12 个节点：采购备料与生产都在本系统 */
const NODES = {
  外销: ['报价', 'PI 确认', '备料', '生产', '检验', '出库', '订舱', '报关', '提单', '收款', '结汇', '退税'],
  内销: ['报价', '合同', '备料', '生产', '检验', '出库', '开票', '回款']
};
const custOf = id => DB.customers.find(c => c.id === id) || {};
const supOf = id => DB.suppliers.find(s => s.id === id) || { name: id };
const prodOf = code => DB.products.find(p => p.code === code) || { name: (DB.mats[code] || [code])[0], inner: code };
const nameOf = code => DB.products.find(p => p.code === code) ? prodOf(code).name : (DB.mats[code] || [code])[0];
const scOf = pi => DB.contracts.find(c => c.pi === pi);
const total = c => c.lines.reduce((a, l) => a + l[1] * l[2], 0);
const pendingAp = () => DB.approvals.filter(a => a.status === '待审批').length;
const arOpen = () => DB.ar.filter(r => r.amt - r.got > 0);
const overdueAmt = () => arOpen().filter(r => daysPast(r.due) > 0).reduce((a, r) => a + r.amt - r.got, 0);
const curLock = () => DB.fx.locks[0];
const shortage = m => Math.max(0, m.need + m.safe - m.stock - m.onway);
</script>
