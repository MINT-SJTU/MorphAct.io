// All content and final plotted values remain available without motion.
(() => {
  'use strict';
  if (!window.IntersectionObserver || !Element.prototype.animate) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.22, .61, .36, 1)';
  const entered = new WeakSet();
  const active = new Map();
  const targets = [...document.querySelectorAll(
    '.hero-copy > p, .demo-stage, ' +
    'main .section-heading h2, .section-intro > p, .paper-figure, .diagnostic-notes, ' +
    '.diagnostic-math > div, .diagnostic-grid h3, .method-core h3, .method-core > p, ' +
    '.benchmark-heading, .backbone-chart, .ablation-chart-panel, ' +
    '.ablation-findings > p, .task-image, .task-body, .footer-mark'
  )];
  let observer;
  function play(target, frames, delay = 0, duration = 650) {
    if (preference.matches || target.contains(document.activeElement)) return;
    const animation = target.animate(frames, { duration, delay, easing, fill: 'backwards' });
    active.set(target, animation);
    animation.onfinish = () => active.delete(target);
  }
  function connect() {
    if (preference.matches) return;
    observer = new IntersectionObserver(entries => {
      const chapters = new Map();
      for (const entry of entries) {
        if (!entry.isIntersecting || entered.has(entry.target)) continue;
        const target = entry.target;
        entered.add(target);
        observer.unobserve(target);
        const chapter = target.closest('section') || document.body;
        const order = chapters.get(chapter) || 0;
        chapters.set(chapter, order + 1);
        const picture = target.matches('.paper-figure, .demo-stage, .task-image');
        const plot = target.matches('.backbone-chart, .ablation-chart-panel');
        const from = picture ? 'translateX(16px)' : plot ? 'translateY(10px)' : 'translateY(22px)';
        play(target, [{ opacity: .3, transform: from }, { opacity: 1, transform: 'none' }], Math.min(order * 75, 225));
      }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(target => { if (!entered.has(target)) observer.observe(target); });
  }
  const headline = document.querySelector('.headline-reveal');
  if (headline && !preference.matches) {
    play(headline, [{ opacity: .15, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], 0, 900);
  }
  connect();

  // Preserve the original paired bar-growth effect. Each suite's two methods
  // share timing and the plotted lower bound; scrolling away completes it.
  const charts = new Map([...document.querySelectorAll('.benchmark-chart, .ablation-chart')]
    .map(chart => [chart, { animations: [], started: false, complete: false }]));
  let chartObserver;
  function finishChart(chart, state) {
    state.complete = true;
    state.animations.forEach(animation => animation.cancel());
    state.animations.length = 0;
    chartObserver?.unobserve(chart);
  }
  function growChart(chart, state) {
    state.started = true;
    const bars = [...chart.querySelectorAll('.bar-baseline, .bar-ours')];
    const groups = [...new Set(bars.map(bar => bar.parentElement))];
    groups.forEach((group, index) => {
      const delay = index * 110;
      for (const bar of group.querySelectorAll('.bar-baseline, .bar-ours')) {
        const bottom = Number(bar.getAttribute('y')) + Number(bar.getAttribute('height'));
        state.animations.push(bar.animate([
          { transform: `translateY(${bottom}px) scaleY(0) translateY(${-bottom}px)` },
          { transform: 'none' }
        ], { duration: 900, delay, easing, fill: 'both' }));
      }
      for (const label of group.querySelectorAll('.bar-value, .ablation-value, .gain-bg, .gain-label')) {
        state.animations.push(label.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: 180, delay: delay + 900, easing, fill: 'both' }));
      }
    });
    Promise.all(state.animations.map(animation => animation.finished.catch(() => {})))
      .then(() => { if (!state.complete) finishChart(chart, state); });
  }
  function connectCharts() {
    if (preference.matches) return;
    chartObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const state = charts.get(entry.target);
        if (state.complete) continue;
        if (!entry.isIntersecting && state.started) finishChart(entry.target, state);
        else if (entry.intersectionRatio >= .25 && !state.started) growChart(entry.target, state);
      }
    }, { threshold: [0, .25], rootMargin: '0px 0px -24px 0px' });
    charts.forEach((state, chart) => { if (!state.complete) chartObserver.observe(chart); });
  }
  connectCharts();
  preference.addEventListener('change', () => {
    observer?.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
    chartObserver?.disconnect();
    if (!preference.matches) { connect(); connectCharts(); }
    if (preference.matches) {
      charts.forEach((state, chart) => { if (state.started) finishChart(chart, state); });
      const film = document.getElementById('demo-video');
      film.autoplay = false;
      film.pause();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) charts.forEach((state, chart) => { if (state.started && !state.complete) finishChart(chart, state); });
  });
  document.addEventListener('focusin', event => {
    active.forEach((animation, target) => {
      if (target.contains(event.target)) { animation.cancel(); active.delete(target); }
    });
  });
})();
