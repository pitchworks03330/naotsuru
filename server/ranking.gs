// なおつる「おかね ランキング」の ほぞんさき（Google Apps Script ウェブアプリ）
// きろくは スクリプト プロパティ「ranking」に、おかねの おおい じゅんで MAX_KEEP にん ぶん だけ のこす。
// へんな なまえを けしたい ときは、Apps Script の「プロジェクトの設定 → スクリプト プロパティ」で ranking を へんしゅうする。

const MAX_KEEP = 50;
const NAME_MAX = 8;
const MONEY_MAX = 1e15;

function doGet() {
  return json_({ top: load_().slice(0, 3).map(pub_) });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ error: 'bad request' }); }
  const id = String(d.id || '').replace(/[^a-z0-9]/g, '').slice(0, 40);
  const name = String(d.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, NAME_MAX);
  const money = Math.floor(Number(d.money));
  if (!id || !name || !isFinite(money) || money < 0 || money > MONEY_MAX) return json_({ error: 'bad request' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let list = load_().filter(r => r.id !== id);
    list.push({ id: id, name: name, money: money, t: Date.now() });
    list.sort((a, b) => b.money - a.money || a.t - b.t);
    list = list.slice(0, MAX_KEEP);
    PropertiesService.getScriptProperties().setProperty('ranking', JSON.stringify(list));
    const idx = list.findIndex(r => r.id === id);
    return json_({ top: list.slice(0, 3).map(pub_), rank: idx >= 0 ? idx + 1 : null });
  } finally {
    lock.releaseLock();
  }
}

function load_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ranking') || '[]'); }
  catch (err) { return []; }
}
function pub_(r) { return { name: r.name, money: r.money }; }
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
