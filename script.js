// Plot the manuscript tables directly. Both benchmarks are always visible.
const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed = value => `${value > 0.005 ? '+' : value < -0.005 ? '−' : ''}${Math.abs(value).toFixed(2)} pp`;
function pairedColumns(labels, model, benchmark) {
  const width=380, left=36, bottom=273, top=61, plotHeight=bottom-top, step=82;
  const min = benchmark === 'libero' ? 84 : 15;
  const max = benchmark === 'libero' ? 100 : 90;
  const y = value => bottom-(value-min)/(max-min)*plotHeight;
  const gains = labels.map((_,i)=>model.ours[i]-model.baseline[i]);
  const highlightIndex = gains.indexOf(Math.max(...gains));
  const description=labels.map((label,i)=>`${label}: baseline ${model.baseline[i].toFixed(2)}%, MorphAct ${model.ours[i].toFixed(2)}%${gains[i] < -0.005 ? '' : ', gain '+signed(gains[i])}`).join('. ');
  let svg=`<svg class="benchmark-chart" viewBox="0 0 ${width} 320" data-min="${min}" data-max="${max}" role="img" aria-label="${escapeText(model.text+'. Displayed y-axis range '+min+' to '+max+' percent. '+description)}"><title>${escapeText(model.text+' success rates')}</title><desc>${escapeText(description)}</desc><text class="axis-title" x="2" y="45">Success (%)</text>`;
  svg+=`<rect x="${left+step*highlightIndex}" y="51" width="${step}" height="246" rx="3" class="suite-highlight"/>`;
  for(const tick of (min === 84 ? [84,88,92,96,100] : [15,30,45,60,75,90])) svg+=`<line class="chart-gridline" x1="${left}" x2="${left+step*4}" y1="${y(tick)}" y2="${y(tick)}"/><text class="tick-label" x="${left-8}" y="${y(tick)+3}" text-anchor="end">${tick}</text>`;
  if (min > 0) svg+=`<path class="axis-break" d="M ${left-5} ${bottom+6} l 8 -4 m -8 8 l 8 -4"/>`;
  labels.forEach((label,i)=>{
    const center=left+step*(i+.5), baselineX=center-29, oursX=center+4, barWidth=25;
    const gain=model.ours[i]-model.baseline[i], positive=gain>0.005, negative=gain < -0.005;
    const description=negative ? `${label}: baseline ${model.baseline[i].toFixed(2)}%, MorphAct ${model.ours[i].toFixed(2)}%` : `${label}: ${model.baseline[i].toFixed(2)}% → ${model.ours[i].toFixed(2)}% (${signed(gain)})`;
    svg+=`<g class="suite-group"><title>${escapeText(description)}</title>`;
    if (!negative) svg+=`<rect class="gain-bg${i===highlightIndex?' largest-gain':''}${!positive?' neutral-bg':''}" x="${center-33}" y="9" width="66" height="23" rx="3"/><text class="gain-label${i===highlightIndex?' largest-gain':''}${!positive?' neutral-label':''}" x="${center}" y="25" text-anchor="middle">${signed(gain)}</text>`;
    svg+=`<rect class="bar-baseline" data-value="${model.baseline[i]}" x="${baselineX}" y="${y(model.baseline[i])}" width="${barWidth}" height="${bottom-y(model.baseline[i])}" rx="1"/><rect class="bar-ours" data-value="${model.ours[i]}" x="${oursX}" y="${y(model.ours[i])}" width="${barWidth}" height="${bottom-y(model.ours[i])}" rx="1"/>`;
    if (positive) {
      const end=y(model.ours[i]), start=y(model.baseline[i]);
      svg+=`<path class="change-link" d="M ${center} ${start} V ${end} M ${center-2.5} ${end+4} L ${center} ${end} L ${center+2.5} ${end+4}"/>`;
    }
    svg+=`<text class="bar-value baseline-value" x="${baselineX+barWidth/2}" y="${y(model.baseline[i])-7}" text-anchor="middle">${model.baseline[i].toFixed(2)}</text><text class="bar-value ours-value" x="${oursX+barWidth/2}" y="${y(model.ours[i])-7}" text-anchor="middle">${model.ours[i].toFixed(2)}</text>`;
    if(label==='Very Hard') svg+=`<text class="suite-label" x="${center}" y="292" text-anchor="middle"><tspan x="${center}">Very Hard</tspan></text>`;
    else svg+=`<text class="suite-label" x="${center}" y="292" text-anchor="middle">${escapeText(label)}</text>`;
    svg+='</g>';
  });
  return svg+'</svg>';
}
for(const table of document.querySelectorAll('.results-table:not(.ablation-table)')) {
  const labels=[...table.querySelectorAll('thead th')].slice(2,6).map(c=>c.textContent.trim());
  const container=document.querySelector(`[data-charts="${table.dataset.benchmark}"]`);
  container.innerHTML=[...table.tBodies].map(group=>{
    const [base,ours]=group.rows;
    const scores=row=>[...row.querySelectorAll('.suite-cell,.mean-cell')].map(c=>Number(c.textContent.trim()));
    const model={name:base.querySelector('.backbone-cell').innerHTML,text:base.querySelector('.backbone-cell').textContent,baseline:scores(base),ours:scores(ours)};
    return `<figure class="backbone-chart"><h4>${model.name}</h4><p class="backbone-summary"><span>${model.baseline[4].toFixed(2)}</span><span class="score-arrow" aria-hidden="true">→</span><strong>${model.ours[4].toFixed(2)}%</strong><b>${signed(model.ours[4]-model.baseline[4])}</b></p><p class="mean-label">Overall success</p>${pairedColumns(labels,model,table.dataset.benchmark)}</figure>`;
  }).join('');
  container.hidden=false;
}
// Keep the full demonstration available through native video controls.
const demoPlayer = document.getElementById('demo-video');
const demoReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (demoReducedMotion.matches) {
  demoPlayer.autoplay = false;
  demoPlayer.pause();
}
const ablationRows=[...document.querySelector('.ablation-table').tBodies[0].rows];
for(const container of document.querySelectorAll('[data-ablation-chart]')) {
  const index=Number(container.dataset.ablationChart), suite=index===4?'Mean':'Long';
  const width=580,left=37,bottom=275,top=48,plotHeight=bottom-top,step=88;
  const min=30, max=100;
  const y=value=>bottom-(value-min)/(max-min)*plotHeight;
  const names=ablationRows.map(row=>row.querySelector('th').childNodes[0].textContent.trim());
  const values=ablationRows.map(row=>Number(row.querySelectorAll('td')[index].textContent));
  let svg=`<svg class="ablation-chart" viewBox="0 0 ${width} 331" data-min="${min}" data-max="${max}" role="img" aria-label="${escapeText('X-VLA LIBERO '+suite+'. Displayed y-axis range 30 to 100 percent. '+names.map((n,i)=>`${n}: ${values[i].toFixed(2)}%`).join('. '))}"><title>X-VLA LIBERO ${suite} ablation success rates</title><text class="axis-title" x="3" y="17">Success (%)</text>`;
  for(const tick of [30,40,50,60,70,80,90,100]) svg+=`<line class="chart-gridline" x1="${left}" x2="${left+step*6}" y1="${y(tick)}" y2="${y(tick)}"/><text class="tick-label" x="${left-8}" y="${y(tick)+4}" text-anchor="end">${tick}</text>`;
  svg+=`<path class="axis-break" d="M ${left-5} ${bottom+6} l 8 -4 m -8 8 l 8 -4"/>`;
  names.forEach((name,i)=>{
    const center=left+step*(i+.5), lines=name==='VLM-only'?['VLM','only']:name==='Action-only'?['Action','only']:[name];
    svg+=`<g><title>${escapeText(`${name}: ${values[i].toFixed(2)}%`)}</title><rect class="${i===0?'bar-ours':'bar-baseline'}" data-value="${values[i]}" x="${center-24}" y="${y(values[i])}" width="48" height="${bottom-y(values[i])}" rx="1"/><text class="ablation-value${i===0?' ours-value':''}" x="${center}" y="${y(values[i])-9}" text-anchor="middle">${values[i].toFixed(2)}</text><text class="variant-label${i===0?' ours-value':''}" x="${center}" y="298" text-anchor="middle">${lines.map((t,j)=>`<tspan x="${center}" dy="${j?16:0}">${escapeText(t)}</tspan>`).join('')}</text></g>`;
  });
  container.innerHTML=svg+'</svg>';
}

const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of navLinks) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -60% 0px' });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}

const figureDialog = document.getElementById('figure-dialog');
if (typeof figureDialog.showModal === 'function') {
  const canvas = figureDialog.querySelector('.dialog-canvas');
  const image = canvas.querySelector('img');
  const title = figureDialog.querySelector('#figure-dialog-title');
  let previousOverflow = '';

  function setZoom(zoomed) {
    canvas.classList.toggle('is-zoomed', zoomed);
    image.style.setProperty('--zoom-width', `${Math.min(image.naturalWidth, Math.max(canvas.clientWidth * 2, 1200))}px`);
    if (!zoomed) canvas.scrollTo(0, 0);
  }

  for (const link of document.querySelectorAll('[data-lightbox]')) {
    link.addEventListener('click', (event) => {
      // Preserve new-tab and download gestures on the underlying image link.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      title.textContent = link.dataset.figureTitle;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      figureDialog.showModal();
      setZoom(false);
    });
  }
  image.addEventListener('click', () => setZoom(!canvas.classList.contains('is-zoomed')));
  figureDialog.querySelector('[data-close]').addEventListener('click', () => figureDialog.close());
  figureDialog.addEventListener('click', (event) => {
    if (event.target !== figureDialog) return;
    const bounds = figureDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) figureDialog.close();
  });
  figureDialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    setZoom(false);
  });
}

// Task links remain direct video links when native dialogs are unavailable.
const videoDialog = document.getElementById('video-dialog');
if (typeof videoDialog.showModal === 'function') {
  const player = videoDialog.querySelector('video');
  let videoPreviousOverflow = '';
  for (const link of document.querySelectorAll('[data-video]')) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.getElementById('demo-video').pause();
      videoDialog.querySelector('#video-dialog-title').textContent = link.dataset.task;
      videoDialog.querySelector('[data-video-description]').textContent = link.dataset.description;
      player.poster = link.dataset.poster;
      player.src = link.href;
      player.setAttribute('aria-label', `${link.dataset.task}: paired MorphAct and pi 0.5 trials`);
      videoPreviousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      videoDialog.showModal();
      player.play().catch(() => { /* Native controls allow playback if autoplay is restricted. */ });
    });
  }
  videoDialog.querySelector('[data-close-video]').addEventListener('click', () => videoDialog.close());
  videoDialog.addEventListener('click', event => {
    if (event.target !== videoDialog) return;
    const bounds = videoDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) videoDialog.close();
  });
  videoDialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    document.documentElement.style.overflow = videoPreviousOverflow;
  });
}
