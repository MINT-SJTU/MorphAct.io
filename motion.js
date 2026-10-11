// Optional motion: the document and original figures stay visible without it.
(() => {
  'use strict';

  if (typeof window.IntersectionObserver !== 'function' ||
      typeof Element.prototype.animate !== 'function' ||
      typeof window.matchMedia !== 'function') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.22, .61, .36, 1)';
  const entryBlocks = [...document.querySelectorAll(
    '#paper-title, .hero-lead, .paper-credits, .institution-logos, .resource-links, ' +
    '.demo-section > figure, .section-heading, .paper-figure, .task-card'
  )];
  const entered = new Set();
  const entryAnimations = new Map();
  let entryObserver = null;

  function stopEntries() {
    if (entryObserver) entryObserver.disconnect();
    entryObserver = null;
    for (const animation of entryAnimations.values()) {
      animation.onfinish = null;
      animation.cancel();
    }
    entryAnimations.clear();
  }

  function observeEntries() {
    if (entryObserver || entered.size === entryBlocks.length) return;
    const observer = new IntersectionObserver(entries => {
      if (entryObserver !== observer || document.hidden || reducedMotion.matches) return;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.16 || entered.has(entry.target)) continue;
        const block = entry.target;
        entered.add(block);
        observer.unobserve(block);
        // Keyboard navigation always gets the block in its resting position.
        if (block.contains(document.activeElement)) continue;
        const restingTransform = getComputedStyle(block).transform;
        const delay = block.closest('.hero') ? Math.min(entryBlocks.indexOf(block) * 85, 255) : 0;
        const animation = block.animate([
          { opacity: 0.12, transform: `translateY(28px) ${restingTransform === 'none' ? '' : restingTransform}` },
          { opacity: 1, transform: restingTransform }
        ], { duration: 850, delay, easing, fill: 'backwards' });
        entryAnimations.set(block, animation);
        animation.onfinish = () => entryAnimations.delete(block);
      }
      if (entered.size === entryBlocks.length) {
        observer.disconnect();
        entryObserver = null;
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -80px 0px' });
    entryObserver = observer;
    for (const block of entryBlocks) {
      if (!entered.has(block)) observer.observe(block);
    }
  }

  function onFocus(event) {
    for (const [block, animation] of entryAnimations) {
      if (!block.contains(event.target)) continue;
      animation.onfinish = null;
      animation.cancel();
      entryAnimations.delete(block);
    }
  }

  const charts = new Map([...document.querySelectorAll('.benchmark-chart, .ablation-chart')]
    .map(chart => [chart, { animations: [], ready: false, visible: false, complete: false }]));
  let chartObserver = null;

  function finishChart(chart, state) {
    state.complete = true;
    for (const animation of state.animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    state.animations.length = 0;
    if (chartObserver) chartObserver.unobserve(chart);
  }

  function syncChartPlayback(state) {
    const mayPlay = state.ready && state.visible && !document.hidden && !reducedMotion.matches;
    for (const animation of state.animations) {
      if (mayPlay && animation.playState === 'paused') animation.play();
      else if (!mayPlay && animation.playState === 'running') animation.pause();
    }
  }

  function prepareChart(chart, state) {
    function animate(element, keyframes, timing) {
      const animation = element.animate(keyframes, { ...timing, fill: 'both' });
      animation.pause();
      animation.currentTime = 0;
      state.animations.push(animation);
    }
    const bars = [...chart.querySelectorAll('.bar-baseline, .bar-ours')];
    const groups = [...new Set(bars.map(bar => bar.parentElement))];
    groups.forEach((group, index) => {
      const delay = index * 110;
      // Both methods in a suite share the same timing and plotted lower bound.
      for (const bar of group.querySelectorAll('.bar-baseline, .bar-ours')) {
        const bottom = Number(bar.getAttribute('y')) + Number(bar.getAttribute('height'));
        animate(bar, [
          { transform: `translateY(${bottom}px) scaleY(0) translateY(${-bottom}px)` },
          { transform: `translateY(${bottom}px) scaleY(1) translateY(${-bottom}px)` }
        ], { duration: 900, delay, easing });
      }
      for (const label of group.querySelectorAll('.bar-value, .ablation-value, .gain-bg, .gain-label, .change-link')) {
        animate(label, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: delay + 900 });
      }
    });
    if (state.animations.length) {
      state.animations[state.animations.length - 1].onfinish = () => finishChart(chart, state);
    }
  }

  function syncCharts() {
    if (reducedMotion.matches) {
      if (chartObserver) chartObserver.disconnect();
      chartObserver = null;
      for (const [chart, state] of charts) {
        if (state.animations.length) finishChart(chart, state);
      }
      return;
    }
    if (!chartObserver) {
      chartObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const state = charts.get(entry.target);
          state.visible = entry.isIntersecting;
          state.ready ||= entry.intersectionRatio >= 0.8;
          syncChartPlayback(state);
        }
      }, { threshold: [0, 0.8], rootMargin: '0px 0px -24px 0px' });
      for (const [chart, state] of charts) {
        if (state.complete) continue;
        prepareChart(chart, state);
        chartObserver.observe(chart);
      }
    }
    for (const state of charts.values()) syncChartPlayback(state);
  }

  const overlay = document.querySelector('[data-method-motion]');
  const methodTarget = overlay && (overlay.closest('.figure-link') || overlay);
  const methodFigure = overlay && overlay.closest('.method-figure');
  const methodImage = methodTarget && methodTarget.querySelector('img');
  const phaseNames = ['vlm', 'features', 'action'];
  const phaseColors = ['#4d7380', '#5e7d6c', '#946f55'];
  const phaseGroups = overlay && phaseNames.map(name =>
    overlay.querySelector(`[data-method-phase="${name}"]`)
  );
  const methodAnimations = [];
  let methodObserver = null;
  let methodInView = false;
  let methodStarted = false;
  let methodComplete = !overlay || !methodImage || !phaseGroups.every(Boolean);

  function finishMethod() {
    methodComplete = true;
    for (const animation of methodAnimations) {
      animation.onfinish = null;
      animation.cancel();
    }
    methodAnimations.length = 0;
    if (methodObserver) methodObserver.disconnect();
    methodObserver = null;
    if (methodImage) {
      methodImage.removeEventListener('load', syncMethodPlayback);
      methodImage.removeEventListener('error', finishMethod);
    }
  }

  function addMethodAnimation(element, keyframes, timing) {
    const animation = element.animate(keyframes, { ...timing, fill: 'none' });
    animation.pause();
    animation.currentTime = 0;
    methodAnimations.push(animation);
    return animation;
  }

  function startMethod() {
    methodStarted = true;
    const fade = [
      { opacity: 0 },
      { opacity: 0.86, offset: 0.16, easing },
      { opacity: 0.86, offset: 0.8 },
      { opacity: 0, easing }
    ];
    for (let index = 0; index < phaseGroups.length; index++) {
      const group = phaseGroups[index];
      const delay = index * 2000;
      const phaseAnimation = addMethodAnimation(group, fade, { duration: 2000, delay });
      // The generator precedes its injection; these are forward parameter updates.
      for (const route of group.querySelectorAll('[data-method-late]')) {
        addMethodAnimation(route, [
          { opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1 }
        ], { duration: 1500, delay: delay + 400, easing });
      }
      const caption = methodFigure && methodFigure.querySelector(
        `[data-method-caption-phase="${phaseNames[index]}"]`
      );
      if (caption) {
        const restingColor = getComputedStyle(caption).color;
        addMethodAnimation(caption, [
          { color: restingColor, textDecorationColor: 'transparent' },
          { color: phaseColors[index], textDecorationColor: phaseColors[index], offset: 0.16 },
          { color: phaseColors[index], textDecorationColor: phaseColors[index], offset: 0.8 },
          { color: restingColor, textDecorationColor: 'transparent' }
        ], { duration: 2000, delay, easing });
      }
      if (index === phaseGroups.length - 1) phaseAnimation.onfinish = finishMethod;
    }
  }

  function syncMethodPlayback() {
    if (methodComplete) return;
    const mayPlay = !reducedMotion.matches && !document.hidden && methodInView &&
      methodImage.complete && methodImage.naturalWidth > 0;
    if (mayPlay && !methodStarted) startMethod();
    for (const animation of methodAnimations) {
      if (mayPlay && animation.playState === 'paused') animation.play();
      else if (!mayPlay && animation.playState === 'running') animation.pause();
    }
  }

  function observeMethod() {
    if (methodComplete || methodObserver) return;
    methodObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      methodInView = entry.isIntersecting && entry.intersectionRatio >= 0.45;
      syncMethodPlayback();
    }, { threshold: [0, 0.45], rootMargin: '0px 0px -24px 0px' });
    methodObserver.observe(methodTarget);
  }

  function syncMotion() {
    if (reducedMotion.matches || document.hidden) stopEntries();
    else observeEntries();
    syncCharts();
    if (reducedMotion.matches) {
      if (methodStarted) finishMethod();
      else if (methodObserver) {
        methodObserver.disconnect();
        methodObserver = null;
        methodInView = false;
      }
    } else observeMethod();
    syncMethodPlayback();
  }

  function destroy() {
    stopEntries();
    for (const [chart, state] of charts) finishChart(chart, state);
    if (chartObserver) chartObserver.disconnect();
    finishMethod();
    document.removeEventListener('visibilitychange', syncMotion);
    document.removeEventListener('focusin', onFocus);
    if (reducedMotion.removeEventListener) reducedMotion.removeEventListener('change', syncMotion);
    else if (reducedMotion.removeListener) reducedMotion.removeListener(syncMotion);
  }

  if (!methodComplete) {
    methodImage.addEventListener('load', syncMethodPlayback, { once: true });
    methodImage.addEventListener('error', finishMethod, { once: true });
  }
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
  else if (reducedMotion.addListener) reducedMotion.addListener(syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  document.addEventListener('focusin', onFocus);
  window.addEventListener('pagehide', destroy, { once: true });
  syncMotion();
})();
