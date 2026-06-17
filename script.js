const sheetHead = document.querySelector('#sheetHead');
const sheetBody = document.querySelector('#sheetBody');
const chartCanvas = document.querySelector('#chartCanvas');
const ctx = chartCanvas.getContext('2d');
const chartTitle = document.querySelector('#chartTitle');
const chartType = document.querySelector('#chartType');
const theme = document.querySelector('#theme');
const chartHint = document.querySelector('#chartHint');

const palettes = {
  bright: ['#635bff', '#00c2a8', '#ffb020', '#ef476f', '#118ab2', '#7c3aed', '#06d6a0', '#f97316'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#023e8a', '#48cae4', '#2a9d8f', '#264653', '#caf0f8'],
  sunset: ['#ef476f', '#f78c6b', '#ffd166', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b', '#3a86ff'],
};
const hints = {
  bar: 'Bar chart compares every active series across labels.',
  line: 'Line chart shows trends for every series column.',
  area: 'Area chart fills each series trend for quick comparison.',
  pie: 'Pie chart uses the first numeric column to show each label as a slice.',
  doughnut: 'Doughnut chart uses the first numeric column with a center cutout.',
  radar: 'Radar chart compares every series around the labels.',
  scatter: 'Scatter chart plots the first numeric column on X and the second on Y.',
  bubble: 'Bubble chart plots the first two numeric columns, sized by the third.',
};

let columns = ['Online', 'Retail', 'Wholesale', 'Subscriptions', 'Services'];
const sampleRows = [
  ['North America', 132, 98, 74, 58, 42],
  ['Europe', 118, 87, 69, 71, 39],
  ['Asia Pacific', 156, 112, 88, 64, 53],
  ['Latin America', 84, 67, 51, 43, 28],
  ['Middle East', 73, 54, 46, 35, 24],
  ['Africa', 61, 48, 39, 31, 19],
];

function colorFor(index) {
  const colors = palettes[theme.value];
  return colors[index % colors.length];
}

function renderHeader() {
  sheetHead.innerHTML = '';
  const tr = document.createElement('tr');
  tr.append(createHeaderCell('Label'));
  columns.forEach((name, index) => {
    const th = createHeaderCell('');
    const input = document.createElement('input');
    input.className = 'column-name';
    input.value = name;
    input.ariaLabel = `Series ${index + 1} name`;
    input.addEventListener('input', () => { columns[index] = input.value || `Series ${index + 1}`; drawChart(); });
    th.append(input);
    if (columns.length > 1) {
      const remove = document.createElement('button');
      remove.className = 'remove-column';
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = `Remove ${name}`;
      remove.addEventListener('click', () => removeColumn(index));
      th.append(remove);
    }
    tr.append(th);
  });
  tr.append(createHeaderCell(''));
  sheetHead.append(tr);
}

function createHeaderCell(text) {
  const th = document.createElement('th');
  th.textContent = text;
  return th;
}

function createCell(value = '', type = 'number') {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.addEventListener('input', drawChart);
  td.append(input);
  return td;
}

function addRow(values = []) {
  const tr = document.createElement('tr');
  tr.append(createCell(values[0] ?? '', 'text'));
  columns.forEach((_, index) => tr.append(createCell(values[index + 1] ?? '')));
  const action = document.createElement('td');
  const remove = document.createElement('button');
  remove.className = 'remove-row';
  remove.type = 'button';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => { tr.remove(); drawChart(); });
  action.append(remove);
  tr.append(action);
  sheetBody.append(tr);
  drawChart();
}

function addColumn(name = `Series ${columns.length + 1}`) {
  columns.push(name);
  renderHeader();
  [...sheetBody.querySelectorAll('tr')].forEach(row => {
    row.insertBefore(createCell(''), row.lastElementChild);
  });
  drawChart();
}

function removeColumn(index) {
  columns.splice(index, 1);
  renderHeader();
  [...sheetBody.querySelectorAll('tr')].forEach(row => row.children[index + 1]?.remove());
  drawChart();
}

function loadSampleData() {
  columns = ['Online', 'Retail', 'Wholesale', 'Subscriptions', 'Services'];
  sheetBody.innerHTML = '';
  chartTitle.value = '2026 Revenue by Region and Channel';
  renderHeader();
  sampleRows.forEach(addRow);
}

function getData() {
  return [...sheetBody.querySelectorAll('tr')].map((row, index) => {
    const cells = row.querySelectorAll('input');
    return {
      label: cells[0].value || `Row ${index + 1}`,
      values: [...cells].slice(1).map(cell => Number(cell.value) || 0),
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
function legend() {
  columns.forEach((name, i) => {
    const x = 680 + Math.floor(i / 5) * 130;
    const y = 26 + (i % 5) * 22;
    ctx.fillStyle = colorFor(i); ctx.fillRect(x, y, 12, 12);
    ctx.fillStyle = '#647089'; ctx.textAlign = 'left'; ctx.font = '13px system-ui'; ctx.fillText(name || `Series ${i + 1}`, x + 18, y + 11);
  });
}
function drawBar(data) {
  const area = chartArea(); const max = maxValue(data);
  axes(area); labels(data, area); legend();
  const groupW = area.w / data.length;
  const barW = Math.max(3, (groupW * .76) / columns.length);
  data.forEach((row, i) => row.values.forEach((value, j) => {
    const h = value / max * area.h;
    const x = area.x + i * groupW + groupW * .12 + j * barW;
    const y = area.bottom - h;
    ctx.fillStyle = colorFor(j);
    ctx.fillRect(x, y, barW * .82, h);
  }));
}
function drawLine(data, areaMode = false) {
  const area = chartArea(); const max = maxValue(data);
  axes(area); labels(data, area); legend();
  columns.forEach((_, series) => {
    ctx.beginPath();
    data.forEach((row, i) => {
      const x = area.x + (i + .5) * area.w / data.length;
      const y = area.bottom - (row.values[series] || 0) / max * area.h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    if (areaMode) { ctx.lineTo(area.x + (data.length - .5) * area.w / data.length, area.bottom); ctx.lineTo(area.x + .5 * area.w / data.length, area.bottom); ctx.closePath(); ctx.globalAlpha = .14; ctx.fillStyle = colorFor(series); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = colorFor(series); ctx.lineWidth = 3; ctx.stroke();
  });
}
function drawPie(data, doughnut = false) {
  const total = data.reduce((sum, row) => sum + row.values[0], 0) || 1; let start = -Math.PI / 2;
  data.forEach((row, i) => { const arc = row.values[0] / total * Math.PI * 2; ctx.beginPath(); ctx.moveTo(480, 290); ctx.arc(480, 290, 170, start, start + arc); ctx.closePath(); ctx.fillStyle = colorFor(i); ctx.fill(); start += arc; });
  if (doughnut) { ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(480, 290, 82, 0, Math.PI * 2); ctx.fill(); }
}
function drawRadar(data) {
  const max = maxValue(data); const cx = 480, cy = 292, r = 170;
  data.forEach((row, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / data.length; ctx.strokeStyle = '#dfe5f2'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); ctx.fillStyle = '#647089'; ctx.textAlign = 'center'; ctx.fillText(row.label, cx + Math.cos(a) * (r + 32), cy + Math.sin(a) * (r + 32)); });
  columns.forEach((_, series) => { ctx.beginPath(); data.forEach((row, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / data.length; const rr = (row.values[series] || 0) / max * r; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.globalAlpha = .16; ctx.fillStyle = colorFor(series); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = colorFor(series); ctx.lineWidth = 2; ctx.stroke(); });
  legend();
}
function drawScatter(data, bubbles = false) {
  const area = chartArea(); const max = maxValue(data); axes(area);
  data.forEach((row, index) => { const x = area.x + (row.values[0] || 0) / max * area.w; const y = area.bottom - (row.values[1] || 0) / max * area.h; ctx.beginPath(); ctx.fillStyle = colorFor(index); ctx.globalAlpha = .78; ctx.arc(x, y, bubbles ? Math.max(8, (row.values[2] || 0) / max * 38) : 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
}
function drawChart() {
  const data = getData(); clear(); title(); chartHint.textContent = hints[chartType.value];
  if (!data.length) return;
  if (chartType.value === 'bar') drawBar(data);
  if (chartType.value === 'line') drawLine(data);
  if (chartType.value === 'area') drawLine(data, true);
  if (chartType.value === 'pie') drawPie(data);
  if (chartType.value === 'doughnut') drawPie(data, true);
  if (chartType.value === 'radar') drawRadar(data);
  if (chartType.value === 'scatter') drawScatter(data);
  if (chartType.value === 'bubble') drawScatter(data, true);
}

document.querySelector('#addRow').addEventListener('click', () => addRow());
document.querySelector('#addColumn').addEventListener('click', () => addColumn());
document.querySelector('#sampleData').addEventListener('click', loadSampleData);
document.querySelector('#downloadChart').addEventListener('click', () => { const link = document.createElement('a'); link.download = 'easy-chat-chart.png'; link.href = chartCanvas.toDataURL(); link.click(); });
[chartTitle, chartType, theme].forEach(control => control.addEventListener('input', drawChart));
loadSampleData();
