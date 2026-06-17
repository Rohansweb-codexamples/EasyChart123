const sheetBody = document.querySelector('#sheetBody');
const chartCanvas = document.querySelector('#chartCanvas');
const ctx = chartCanvas.getContext('2d');
const chartTitle = document.querySelector('#chartTitle');
const chartType = document.querySelector('#chartType');
const theme = document.querySelector('#theme');
const chartHint = document.querySelector('#chartHint');

const palettes = {
  bright: ['#635bff', '#00c2a8', '#ffb020'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef'],
  sunset: ['#ef476f', '#f78c6b', '#ffd166'],
};
const hints = {
  bar: 'Bar chart compares values across labels.',
  line: 'Line chart shows trends between sheet rows.',
  area: 'Area chart emphasizes cumulative movement over labels.',
  pie: 'Pie chart uses Series A to show each label as a slice.',
  doughnut: 'Doughnut chart uses Series A with a center cutout.',
  radar: 'Radar chart compares all active series around the labels.',
  scatter: 'Scatter chart plots Series A on X and Series B on Y.',
  bubble: 'Bubble chart plots Series A and B, sized by Series C.',
};

const initialRows = [
  ['Jan', 42, 28, 18], ['Feb', 58, 34, 24], ['Mar', 64, 52, 31], ['Apr', 73, 48, 36], ['May', 88, 67, 42]
];

function addRow(values = ['', '', '', '']) {
  const tr = document.createElement('tr');
  ['label', 'a', 'b', 'c'].forEach((name, index) => {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = index === 0 ? 'text' : 'number';
    input.value = values[index] ?? '';
    input.dataset.field = name;
    input.addEventListener('input', drawChart);
    td.append(input);
    tr.append(td);
  });
  const action = document.createElement('td');
  const remove = document.createElement('button');
  remove.className = 'remove-row';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => { tr.remove(); drawChart(); });
  action.append(remove);
  tr.append(action);
  sheetBody.append(tr);
  drawChart();
}

function getData() {
  return [...sheetBody.querySelectorAll('tr')].map((row, index) => {
    const cells = row.querySelectorAll('input');
    return {
      label: cells[0].value || `Row ${index + 1}`,
      values: [1, 2, 3].map(i => Number(cells[i].value) || 0),
    };
  }).filter(row => row.values.some(value => value !== 0));
}

function clear() {
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
}
function title() {
  ctx.fillStyle = '#172033'; ctx.font = '700 32px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(chartTitle.value || 'Untitled chart', chartCanvas.width / 2, 52);
}
function chartArea() { return { x: 84, y: 92, w: 800, h: 380, bottom: 472 }; }
function maxValue(data) { return Math.max(10, ...data.flatMap(row => row.values)); }
function axes(area) {
  ctx.strokeStyle = '#dfe5f2'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(area.x, area.y); ctx.lineTo(area.x, area.bottom); ctx.lineTo(area.x + area.w, area.bottom); ctx.stroke();
}
function labels(data, area) {
  ctx.fillStyle = '#647089'; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
  data.forEach((row, i) => ctx.fillText(row.label, area.x + (i + .5) * area.w / data.length, area.bottom + 28));
}
function legend(colors) {
  ['Series A', 'Series B', 'Series C'].forEach((name, i) => {
    ctx.fillStyle = colors[i]; ctx.fillRect(700, 30 + i * 24, 14, 14);
    ctx.fillStyle = '#647089'; ctx.textAlign = 'left'; ctx.font = '14px system-ui'; ctx.fillText(name, 722, 42 + i * 24);
  });
}
function drawBarLike(data, mode) {
  const area = chartArea(); const colors = palettes[theme.value]; const max = maxValue(data);
  axes(area); labels(data, area); legend(colors);
  const groupW = area.w / data.length;
  data.forEach((row, i) => row.values.forEach((value, j) => {
    const h = value / max * area.h;
    const x = area.x + i * groupW + j * groupW / 4 + groupW * .12;
    const y = area.bottom - h;
    ctx.fillStyle = colors[j];
    if (mode === 'area') ctx.globalAlpha = .28;
    ctx.fillRect(x, y, groupW / 5, h);
    ctx.globalAlpha = 1;
  }));
}
function drawLine(data, areaMode = false) {
  const area = chartArea(); const colors = palettes[theme.value]; const max = maxValue(data);
  axes(area); labels(data, area); legend(colors);
  [0, 1, 2].forEach(series => {
    ctx.beginPath();
    data.forEach((row, i) => {
      const x = area.x + (i + .5) * area.w / data.length;
      const y = area.bottom - row.values[series] / max * area.h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    if (areaMode) { ctx.lineTo(area.x + (data.length - .5) * area.w / data.length, area.bottom); ctx.lineTo(area.x + .5 * area.w / data.length, area.bottom); ctx.closePath(); ctx.globalAlpha = .18; ctx.fillStyle = colors[series]; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = colors[series]; ctx.lineWidth = 4; ctx.stroke();
  });
}
function drawPie(data, doughnut = false) {
  const colors = [...palettes[theme.value], '#8ecae6', '#b8f2e6', '#ffafcc'];
  const total = data.reduce((sum, row) => sum + row.values[0], 0) || 1; let start = -Math.PI / 2;
  data.forEach((row, i) => { const arc = row.values[0] / total * Math.PI * 2; ctx.beginPath(); ctx.moveTo(480, 290); ctx.arc(480, 290, 170, start, start + arc); ctx.closePath(); ctx.fillStyle = colors[i % colors.length]; ctx.fill(); start += arc; });
  if (doughnut) { ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(480, 290, 82, 0, Math.PI * 2); ctx.fill(); }
}
function drawRadar(data) {
  const colors = palettes[theme.value]; const max = maxValue(data); const cx = 480, cy = 292, r = 170;
  data.forEach((row, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / data.length; ctx.strokeStyle = '#dfe5f2'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); ctx.fillStyle = '#647089'; ctx.fillText(row.label, cx + Math.cos(a) * (r + 28), cy + Math.sin(a) * (r + 28)); });
  [0, 1, 2].forEach(series => { ctx.beginPath(); data.forEach((row, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / data.length; const rr = row.values[series] / max * r; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.globalAlpha = .22; ctx.fillStyle = colors[series]; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = colors[series]; ctx.lineWidth = 3; ctx.stroke(); });
  legend(colors);
}
function drawScatter(data, bubbles = false) {
  const area = chartArea(); const colors = palettes[theme.value]; const max = maxValue(data); axes(area);
  data.forEach(row => { const x = area.x + row.values[0] / max * area.w; const y = area.bottom - row.values[1] / max * area.h; ctx.beginPath(); ctx.fillStyle = colors[0]; ctx.globalAlpha = .78; ctx.arc(x, y, bubbles ? Math.max(8, row.values[2] / max * 38) : 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
}
function drawChart() {
  const data = getData(); clear(); title(); chartHint.textContent = hints[chartType.value];
  if (!data.length) return;
  if (chartType.value === 'bar') drawBarLike(data, 'bar');
  if (chartType.value === 'line') drawLine(data);
  if (chartType.value === 'area') drawLine(data, true);
  if (chartType.value === 'pie') drawPie(data);
  if (chartType.value === 'doughnut') drawPie(data, true);
  if (chartType.value === 'radar') drawRadar(data);
  if (chartType.value === 'scatter') drawScatter(data);
  if (chartType.value === 'bubble') drawScatter(data, true);
}

document.querySelector('#addRow').addEventListener('click', () => addRow());
document.querySelector('#sampleData').addEventListener('click', () => { sheetBody.innerHTML = ''; initialRows.forEach(addRow); });
document.querySelector('#downloadChart').addEventListener('click', () => { const link = document.createElement('a'); link.download = 'easy-chat-chart.png'; link.href = chartCanvas.toDataURL(); link.click(); });
[chartTitle, chartType, theme].forEach(control => control.addEventListener('input', drawChart));
initialRows.forEach(addRow);
