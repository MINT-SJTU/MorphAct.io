# MorphAct project website

Official research website for **MorphAct: Contextual Parameterization of Vision–Language–Action Models**.

Website: https://mint-sjtu.github.io/MorphAct.io/

Repository: https://github.com/MINT-SJTU/MorphAct.io

## Preview

No package installation or build step is needed. Serve this directory using an existing Python installation:

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

## Publish

GitHub Pages publishes the repository root on `main`. `.nojekyll` preserves the static files as written. Push changes to `main` to update the site.

## Edit

- `index.html`: research narrative, native MathML equations, task videos, result values, and resource controls.
- `styles.css`: article typography, figure and equation layouts, and basic responsive styling.
- `script.js`: vertical benchmark and ablation charts, figure zoom, and task video dialogs. Chart values are read from the manuscript tables in `index.html`; there is no second numerical dataset to synchronize. Both benchmarks, expandable tables, and direct media links remain available without JavaScript. The image viewer supports click-to-zoom and a close control; no corner marks or per-figure PDF links appear on the page.
- `motion.js`: optional viewport entry animation and a single, six-second pass through the method figure. It uses browser-native animation APIs and has no dependencies.
- `assets/`: manuscript figures, emblem, institution logos, and video exports.

The full paper title, authors, affiliations, institution logos, and resource links occupy a centered full-width header. A standalone full-width demo follows. The narrative then proceeds through motivation experiments, the framework overview, the method, benchmarks, ablations, and real-world results. The body pairs a left-aligned 780-pixel reading column with wider paper figures and result plots. Shorter explanations and connected ablation paragraphs keep the figures, equations, and conclusions together. MorphAct is introduced as a framework across VLA architectures; the evaluated backbones describe the experimental evidence, not a restriction on the framework.

The opening title and credits enter in sequence. Section headings, paper figures, and task cards fade upward once over 850 ms. Benchmark and ablation panels stay in place: their bars grow from the displayed axis minimum, with a 110 ms stagger between suites or variants, followed by exact score and gain labels. Baseline and MorphAct bars within a suite share the same timing. Axes, legends, source values, and final geometry stay fixed. Each chart plays once when mostly visible and pauses offscreen; the paper's motivation figures remain unchanged.

A transparent SVG overlay on the unchanged paper method image highlights the VLM update, adapted features, and action update in that order, then disappears. The sequence describes forward parameter generation, without showing online optimization. Motion pauses when the document is hidden and respects the system's reduced-motion preference. Completed animations release their temporary effects. Content and complete charts remain visible if motion is disabled or unsupported.

The main demo autoplays while muted, loops, and retains its native playback controls.

Meta-World is followed by LIBERO, with both benchmarks always visible and no benchmark or metric selector. Each evaluated backbone has paired vertical bars for every suite or difficulty group. Exact scores label every bar. Badges and arrows call out gains; ties retain a neutral badge. Declines remain visible in the original scores and bar heights without an extra negative-delta badge or downward arrow. Overall scores and gains appear above each chart. Ablations show the mean and Long suite in two visible vertical charts. LIBERO charts share a focused 84–100% vertical range, with labeled y-axis ticks and axis-break marks. Meta-World charts share a 15–90% range, and both ablation charts use 30–100%. Each nonzero range is indicated by the y-axis ticks and an axis-break mark; redundant range captions are omitted from the page. The paper’s motivation/diagnostic figures retain their original axes and pixels. Within each benchmark, every model uses the same scale. Dark badges and shaded columns identify each model’s largest gain, while connecting arrows show the baseline-to-MorphAct change. Complete numerical tables and longer training equations remain in disclosures. The overview introduces the contextual policy equation; the method shows coupled generation, low-rank synthesis, and the two gradient routes; the diagnostic section defines gradient alignment and one-step transfer. The coupling terms `g_cond` and `g_param` name the two terms in the manuscript’s chain-rule equation without changing it. Equations use native MathML and need no external rendering library. Keep their accessible `aria-label` text consistent with the mathematical markup when editing them.

The Code link opens https://github.com/MINT-SJTU/MorphAct. The arXiv control remains disabled until the paper URL is available. Author order, affiliation numbers, equal-contribution marks, and corresponding-author marks are maintained in the `.paper-credits` block of `index.html`. The author block was checked against both `paper.tex` and the compiled paper’s first page on 2026-10-11. Ziyan Liu has affiliations 1 and 2. Affiliation 2 is School of Artificial Intelligence, Shanghai Jiao Tong University; the remaining affiliations are University of Science and Technology of China (1), National University of Singapore (3), Nanyang Technological University (4), Tongji University (5), and Shenzhen Technology University (6). The webpage uses all six full affiliation names, and the logo order follows those numbers. Institution logo sources are listed in `assets/institutions/README.md`.

Figures and results follow the `Morphact_ICLR_27` manuscript source (verified 2026-10-11). The simulation tables reproduce `sections/experiments.tex`, including all four suites or difficulty groups, the overall score, and reported variance. MorphAct scores average three selected evaluations. Each LIBERO evaluation covers 40 tasks with 50 rollouts per task; each Meta-World evaluation covers 50 tasks with 20 rollouts per task. Both overall scores give equal weight to the four groups. Gains are absolute differences in success rate, displayed with `%`.

The six X-VLA ablations reproduce `sections/analysis.tex`. Their comparisons distinguish generation conditions (Constant / Task-ID / current context), module coverage, and the features used to condition action-side generation. In Unadapted, action prediction still receives adapted VLM features; only the action generator uses pre-adaptation features.

The method equations follow `sections/method.tex`. Factors use the row-vector convention: A has shape input-width × rank and B has shape rank × output-width. Both generator outputs and the adapted action condition are refreshed once per replanning observation and reused across the native solver evaluations for that chunk. Training uses the native action objective; trainable parameters include the generators, state projection, and projectors retained by the adaptation configuration.

The teaser is a direct 144-dpi render of the manuscript figure `figures/morphact-teaser.pdf` (3199 × 1106 pixels, updated 2026-10-08). The matching original PDF is retained in `assets/` for provenance. Figure captions show the scientific explanation without standalone asset-download links or corner controls; clicking an image still opens the figure viewer.

`assets/morphact-method.png` is a direct 144-dpi render of the current `figures/method.pdf` (2662 × 1331 pixels). Its original PDF is included as `assets/morphact-method.pdf`. The figure includes joint learning and chunk-level reuse; the older `morphact-overview.png` is retained but is no longer displayed.

The analysis section uses three additional figures actually included in the current manuscript. PNGs in `assets/paper/` are direct 360-dpi renders; their accompanying PDFs match the source files byte for byte.

| Website asset | Manuscript figure | PNG dimensions |
| --- | --- | --- |
| `diagnostic-summary` | `figures/diagnostic-summary.pdf`, Figure 2 | 1980 × 765 |
| `negative-contributions` | `figures/diagnostic-contributions.pdf`, Figure 5 | 2340 × 1105 |
| `depth-profiles` | `figures/diagnostic-depth-profiles.pdf`, Figure 6 | 2340 × 1835 |

The diagnostics measure sampled gradients and local losses at one fixed checkpoint. Negative contribution shares and group-local cosine profiles have different normalizations; neither is a closed-loop success rate. Captions follow `sections/motivation.tex` and `sections/appendix.tex`.

## Real-world demo

The 63-second real-world demo occupies its own full-width section below the paper header on desktop and mobile. `assets/morphact-demo-light-v14.mp4` is the 1080p, 30 fps light edition; its poster, `assets/morphact-demo-light-v14-title.jpg`, shows the actual title frame at 0 seconds. This matches the opening encoded frame; the previous 6-second task-scene poster is no longer displayed. The light edition recomposes the v14 timeline on a cream background, with green/purple titles. Robot footage receives no color filter. Completion markers, playback speeds, detail replays, and transition timing are preserved. The opening method segment uses the current paper figure. Original dark exports remain available in `assets/`.

The real-world section follows the manuscript order: Sort Letters, Sort Hardware, Deliver Water, and Cabinet Storage. Task images in `assets/paper/` copy the current `real-world-panel-000`, `002`, and `003` files without modification; `sort-hardware.png` reproduces the paper's 112-pixel bottom crop of panel `001`. The older website task images remain stored but are not displayed. Each task opens its paired 9-second 720p light v14 clip in a native dialog, with direct video links as the fallback. Asset sources and playback speeds are recorded in `assets/demos/README.md`. Each pair contains separate MorphAct and π0.5 trials with equal playback speed within that task. Success rates reproduce the matching four tasks in `sections/experiments.tex`, each evaluated over 50 physical rollouts per method; they do not describe only the displayed clip.

`tools/render_light_demo.py` rebuilds the light edition from the existing local v12/v14 projects and current manuscript. It requires an existing FFmpeg and Python/Pillow runtime. Its verification decodes all five outputs and compares the recomposed footage regions with the source. Review intermediates are written outside the site in `/tmp/morphact-light-demo`.

To update the video, add the new video and poster assets and update `src` and `poster` on `#demo-video` in `index.html`. Use versioned asset names so visitors receive the current video. Keep the native `controls` and `playsinline`; do not add a separate play overlay. Playback starts only when the visitor chooses to play. Videos use `object-fit: contain`, so recordings are shown without cropping; closing a task dialog pauses and unloads its video.
