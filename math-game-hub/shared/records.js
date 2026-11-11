/*!
 * 수학 게임 허브 - 순위 기록 도우미 (shared/records.js)
 * 기록은 이 기기 브라우저의 localStorage('math_hub_records')에만 저장됩니다.
 * 이 파일은 읽기 / 내보내기(JSON, CSV) / 가져오기(병합) / 삭제를 안전하게 처리합니다.
 *
 * window.MathHubRecords
 *   .KEY                       'math_hub_records'
 *   .read()                    -> 기록 배열 (깨진 JSON/없음이면 [])
 *   .count()                   -> 기록 수
 *   .write(array)              -> boolean (용량 초과 등 실패 시 false)
 *   .clear()                   -> boolean
 *   .toJSON() / .toCSV()       -> 문자열
 *   .exportJSON([filename])    -> JSON 파일 다운로드 (기록 수 반환)
 *   .exportCSV([filename])     -> CSV 파일 다운로드 (UTF-8 BOM, 엑셀 한글 OK)
 *   .parse(text)               -> { records, invalid }  (JSON 텍스트 해석. 배열 또는 {records:[...]} 허용)
 *   .merge(incoming)           -> { added, skipped, invalid, total }  (중복 제거 후 저장)
 *   .importFile(file)          -> Promise<위 결과>  (<input type=file> 의 File)
 *   .dedupeKey(record)         -> 중복 판단 키 (gameId|name|timestamp|score|clearTimeSeconds)
 */
(function () {
  'use strict';
  var KEY = 'math_hub_records';

  var GAME_LABELS = {
    cipher_escape: '암호 연구소 탈출',
    galton_drop: '확률 구슬 챌린지',
    sequence_vault: '수열 금고 스피드런',
    omega_protocol: '오메가 프로토콜'
  };
  var DIFF_LABELS = { easy: '쉬움', normal: '보통', hard: '어려움' };

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  function valid(r) {
    return isObj(r) && typeof r.gameId === 'string' && r.gameId && r.name != null &&
      (isFinite(Number(r.clearTimeSeconds)) || isFinite(Number(r.score)));
  }

  // 가져온 기록을 안전한 형태로 정리 (허브 화면이 일부 값을 HTML 로 출력하므로 이름은 <, > 만, 나머지 문자열은 <, >, &, 따옴표 제거)
  function clean(v, max) { return String(v == null ? '' : v).replace(/[<>&"'`]/g, '').slice(0, max || 60); }
  function num(v) { v = Number(v); return isFinite(v) ? v : undefined; }
  function normalize(r) {
    var o = {
      gameId: clean(r.gameId, 40).replace(/[^A-Za-z0-9_\-]/g, ''),
      gameTitle: clean(r.gameTitle, 60),
      name: String(r.name == null ? '' : r.name).replace(/[<>]/g, '').slice(0, 30).trim(),
      difficulty: DIFF_LABELS[r.difficulty] ? r.difficulty : 'normal',
      score: num(r.score),
      clearTimeFormatted: clean(r.clearTimeFormatted, 30),
      clearTimeSeconds: num(r.clearTimeSeconds),
      timestamp: num(r.timestamp) || 0
    };
    Object.keys(o).forEach(function (k) { if (o[k] === undefined) delete o[k]; });
    return o;
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a.filter(isObj) : [];
    } catch (e) { return []; }
  }

  function write(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; }
    catch (e) { console.error('[MathHubRecords] 저장 실패', e); return false; }
  }

  function clear() {
    try { localStorage.removeItem(KEY); return true; } catch (e) { return false; }
  }

  function dedupeKey(r) {
    return [r.gameId, String(r.name == null ? '' : r.name).trim(), r.timestamp || 0,
      r.score == null ? '' : r.score, r.clearTimeSeconds == null ? '' : r.clearTimeSeconds].join('|');
  }

  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function toJSON() {
    var recs = read();
    return JSON.stringify({ app: 'math-game-hub', schema: 1, exportedAt: new Date().toISOString(), count: recs.length, records: recs }, null, 2);
  }

  function csvCell(v, textGuard) {
    var s = v == null ? '' : String(v);
    // 엑셀 수식 주입 방지 (이름 같은 문자열 칸)
    if (textGuard && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function toCSV() {
    var rows = [['게임', 'gameId', '이름', '난이도', '기록', '점수', '클리어시간(초)', '일시', 'timestamp']];
    read().forEach(function (r) {
      rows.push([
        r.gameTitle || GAME_LABELS[r.gameId] || r.gameId, r.gameId, r.name,
        DIFF_LABELS[r.difficulty] || r.difficulty, r.clearTimeFormatted, r.score,
        r.clearTimeSeconds, fmtDate(r.timestamp), r.timestamp
      ]);
    });
    return rows.map(function (row, i) {
      return row.map(function (c, j) { return csvCell(c, i > 0 && (j === 2 || j === 0 || j === 4)); }).join(',');
    }).join('\r\n') + '\r\n';
  }

  function download(text, filename, mime, withBom) {
    var parts = withBom ? ['﻿', text] : [text];
    var blob = new Blob(parts, { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }

  function exportJSON(filename) {
    download(toJSON(), filename || ('math-hub-records-' + stamp() + '.json'), 'application/json', false);
    return read().length;
  }

  function exportCSV(filename) {
    download(toCSV(), filename || ('math-hub-records-' + stamp() + '.csv'), 'text/csv', true);
    return read().length;
  }

  function parse(text) {
    var data;
    try { data = JSON.parse(String(text).replace(/^﻿/, '')); }
    catch (e) { throw new Error('JSON 형식이 올바르지 않습니다.'); }
    var arr = Array.isArray(data) ? data : (isObj(data) && Array.isArray(data.records) ? data.records : null);
    if (!arr) throw new Error('순위 기록 파일이 아닙니다.');
    var good = [], invalid = 0;
    arr.forEach(function (r) { if (valid(r)) good.push(r); else invalid++; });
    return { records: good, invalid: invalid };
  }

  function merge(incoming) {
    var cur = read();
    var seen = {};
    cur.forEach(function (r) { seen[dedupeKey(r)] = true; });
    var added = 0, skipped = 0, invalid = 0;
    (incoming || []).forEach(function (r) {
      if (!valid(r)) { invalid++; return; }
      r = normalize(r);
      if (!r.gameId) { invalid++; return; }
      var k = dedupeKey(r);
      if (seen[k]) { skipped++; return; }
      seen[k] = true; cur.push(r); added++;
    });
    if (added) {
      cur.sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0); });
      if (!write(cur)) throw new Error('저장 공간에 기록하지 못했습니다.');
    }
    return { added: added, skipped: skipped, invalid: invalid, total: cur.length };
  }

  function importFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('파일이 선택되지 않았습니다.'));
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('파일을 읽지 못했습니다.')); };
      fr.onload = function () {
        try {
          var p = parse(fr.result);
          var res = merge(p.records);
          res.invalid += p.invalid;
          resolve(res);
        } catch (e) { reject(e); }
      };
      fr.readAsText(file, 'utf-8');
    });
  }

  window.MathHubRecords = {
    KEY: KEY, read: read, count: function () { return read().length; }, write: write, clear: clear,
    toJSON: toJSON, toCSV: toCSV, exportJSON: exportJSON, exportCSV: exportCSV,
    parse: parse, merge: merge, importFile: importFile, dedupeKey: dedupeKey
  };
})();
