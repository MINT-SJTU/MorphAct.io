#!/usr/bin/env python3
"""Render the light website edition from the unmodified v14 demo timeline.

Run with the existing Python/Pillow runtime. Source footage is cropped and pasted
without a color filter; only completion artwork is recolored. Intermediates and
verification frames stay in /tmp/morphact-light-demo for visual review.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import json
import os
import re
import subprocess

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

SITE = Path(__file__).resolve().parents[1]
DEMOS = Path('/Users/liujiting/科研项目/MorphAct/Demos')
V12, V14 = DEMOS / 'demo-edit-v12', DEMOS / 'demo-edit-v14'
PAPER = Path('/Users/liujiting/论文写作/Morphact_ICLR_27')
FF = os.environ.get('FFMPEG', '/Users/liujiting/.cache/uv/archive-v0/BcPzYff0V29quvWe/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
WORK = Path('/tmp/morphact-light-demo')
W, H, FPS = 1920, 1080, 30
BG, INK, GREEN, PURPLE = '#f5f3ee', '#29332e', '#356b58', '#775999'
MUTED, LINE = '#68786e', '#d5dcd3'
FONT = Path('/System/Library/Fonts/Supplemental')
TASK_NAMES = ['Sort Letters', 'Deliver Water', 'Sort Hardware', 'Cabinet Storage']
SLUGS = ['letter-arrangement', 'bottle-handling', 'object-sorting', 'drawer-storage']
FOCUS = ['Grasp & orientation', 'Grasp & lift', 'Sorting & placement', 'Handle engagement']
MAIN = SITE / 'assets/morphact-demo-light-v14.mp4'


def run(args, name):
    with (WORK / f'{name}.log').open('w') as log:
        result = subprocess.run([FF, '-hide_banner', '-loglevel', 'warning', '-y',
                                 '-threads', '4', *map(str, args)], stdout=log, stderr=log)
    if result.returncode:
        raise RuntimeError((WORK / f'{name}.log').read_text()[-4000:])


def encode(path):
    return ['-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
            '-pix_fmt', 'yuv420p', '-r', '30', '-threads', '4',
            '-video_track_timescale', '30000', '-color_primaries', 'bt709',
            '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', path]


def text(draw, xy, value, size=28, color=INK, bold=False):
    draw.text(xy, value, fill=color,
              font=ImageFont.truetype(str(FONT / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size))


def centered(draw, y, value, size, color=INK, bold=False):
    font = ImageFont.truetype(str(FONT / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size)
    draw.text(((W - draw.textlength(value, font=font)) / 2, y), value, font=font, fill=color)


def pi(draw, x, y, size=50, color=MUTED):
    draw.text((x, y - 2), 'π', font=ImageFont.truetype(str(FONT / 'Times New Roman Italic.ttf'), size + 7), fill=color)
    text(draw, (x + int(size * .64), y + int(size * .51)), '0.5', int(size * .48), color)


def canvas():
    return Image.new('RGB', (W, H), BG)


def prepare(timeline):
    subprocess.run(['/opt/homebrew/bin/pdftoppm', '-f', '1', '-singlefile', '-scale-to',
                    '1800', '-png', str(PAPER / 'figures/method.pdf'), str(WORK / 'method')], check=True)
    im = canvas()
    d = ImageDraw.Draw(im)
    centered(d, 206, 'REAL-WORLD MANIPULATION', 27, PURPLE, True)
    centered(d, 295, 'MorphAct', 148, GREEN, True)
    centered(d, 502, 'Contextual Parameterization', 55, INK, True)
    centered(d, 580, 'of Vision–Language–Action Models', 55, INK, True)
    d.line((810, 730, 1110, 730), fill=PURPLE, width=4)
    centered(d, 793, 'Four tasks · Paired trials · Detail replays', 29, MUTED)
    im.save(WORK / 'title.png')
    im = canvas()
    d = ImageDraw.Draw(im)
    text(d, (48, 38), 'Contextual parameterization', 42, GREEN, True)
    text(d, (1640, 51), 'METHOD', 25, PURPLE, True)
    figure = Image.open(WORK / 'method.png').convert('RGB')
    figure.thumbnail((1800, 894), Image.Resampling.LANCZOS)
    im.paste(figure, ((W - figure.width) // 2, 146 + (894 - figure.height) // 2))
    im.save(WORK / 'method-canvas.png')
    im = canvas()
    d = ImageDraw.Draw(im)
    d.line((96, 77, 247, 77), fill=GREEN, width=4)
    overlay = Image.open(V12 / 'assets/ending_overlay.png').convert('RGBA')
    im.paste(overlay, (0, 0), overlay)
    im.save(WORK / 'ending.png')
    for row in timeline:
        if '_task' not in row['name']:
            continue
        task = int(re.search(r'task(\d)', row['name']).group(1))
        detail = row['name'].endswith('detail')
        im = canvas()
        d = ImageDraw.Draw(im)
        text(d, (48, 36), 'MORPHACT  /  REAL-WORLD MANIPULATION', 22, PURPLE, True)
        text(d, (48, 88), TASK_NAMES[task - 1], 51, INK, True)
        text(d, (1732, 88), f'0{task} / 04', 31, MUTED)
        for j in range(4):
            d.rounded_rectangle((49 + j * 60, 166, 93 + j * 60, 170), 2,
                                fill=GREEN if j == task - 1 else LINE)
        y = 207 if detail else 236
        text(d, (48, y), 'MorphAct', 43, GREEN, True)
        pi(d, 976, y - 3, 49)
        for x, col in ((48, GREEN), (976, MUTED)):
            d.rectangle((x, 250 if detail else 278, x + 896, 253 if detail else 281), fill=col)
        if detail:
            d.rounded_rectangle((49, 961, 280, 1004), 8, fill='#e2e9df')
            text(d, (67, 970), 'DETAIL REPLAY', 24, GREEN, True)
            text(d, (313, 969), FOCUS[task - 1], 27, INK, True)
            text(d, (48, 1030), 'Magnified original footage', 21, MUTED)
        else:
            text(d, (48, 850), 'TASK EXECUTION', 22, MUTED, True)
            text(d, (48, 893), FOCUS[task - 1], 36, INK, True)
            text(d, (1410, 907), 'DETAIL REPLAY  →', 24, PURPLE, True)
            text(d, (48, 1020), 'Separate trials', 22, MUTED)
        im.save(WORK / f'{row["name"]}.png')


def render(row, effects):
    name = row['name']
    out = WORK / f'{name}.mp4'
    if '_task' in name:
        task = int(re.search(r'task(\d)', name).group(1))
        detail = name.endswith('detail')
        y, h = (256, 672) if detail else (284, 504)
        args = ['-loop', '1', '-framerate', '30', '-i', WORK / f'{name}.png', '-i', row['clean']]
        filters = ['[1:v]split=2[l0][r0]',
                   f'[l0]crop=896:{h}:48:{y}[l]', f'[r0]crop=896:{h}:976:{y}[r]',
                   f'[0:v][l]overlay=48:{y}[a]', f'[a][r]overlay=976:{y}[b]']
        if not detail:
            effect = next(e for e in effects if e['task'] == task)
            start = effect['segment_start']
            args += ['-i', effect['asset']]
            # Apply color coefficients to artwork only; its original alpha is preserved.
            filters += [f'[2:v]format=rgba,colorchannelmixer=rr={53/88}:gg={107/226}:bb={88/192},setpts=PTS-STARTPTS+{start}/TB[mark]',
                        f"[b][mark]overlay=852:204:eof_action=pass:repeatlast=0:enable='between(t,{start},9)'[v]"]
        else:
            filters += ['[b]format=yuv420p[v]']
        args += ['-filter_complex_threads', '2', '-filter_complex', ';'.join(filters), '-map', '[v]']
    else:
        plate = {'00_paper_title': 'title.png', '01_core_idea': 'method-canvas.png',
                 '10_mint_ending': 'ending.png'}[name]
        args = ['-loop', '1', '-framerate', '30', '-i', WORK / plate]
    run([*args, '-t', row['duration'], *encode(out)], name)
    print(f'Rendered {name}', flush=True)
    return {**row, 'rendered': str(out)}


def stitch(timeline):
    args, filters = [], []
    for i, row in enumerate(timeline):
        args += ['-i', row['rendered']]
        filters.append(f'[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p,fps=30[v{i}]')
    current, elapsed = 'v0', timeline[0]['duration']
    for i, row in enumerate(timeline[1:], 1):
        assert abs(row['export_start'] - (elapsed - .4)) < 1e-6
        filters.append(f'[{current}][v{i}]xfade=transition=fade:duration=0.4:offset={elapsed-.4:.8f},fps=30[x{i}]')
        current = f'x{i}'
        elapsed += row['duration'] - .4
    assert abs(elapsed - 63) < 1e-6
    filters.append(f'[{current}]fade=t=out:st=62.7:d=0.3:color=0xf5f3ee,tpad=stop_mode=clone:stop_duration=0.1,fps=30[final]')
    run([*args, '-filter_complex_threads', '2', '-filter_complex', ';'.join(filters),
         '-map', '[final]', '-t', '63', *encode(MAIN)], 'final-stitch')
    print('Rendered main 63s video', flush=True)


def frame(video, second, out):
    run(['-ss', str(float(second)), '-i', video, '-frames:v', '1', '-update', '1', out], out.stem)


def web_clip(pair):
    index, row = pair
    out = SITE / f'assets/demos/{SLUGS[index]}-light-v14.mp4'
    run(['-i', row['rendered'], '-vf', 'scale=1280:720:flags=lanczos', '-t', '9', *encode(out)], f'web-task{index+1}')
    frame(out, '.6', out.with_suffix('.jpg'))
    return out


def verify(outputs, timeline):
    report = {'source_timeline': str(V14 / 'project/timeline.json'), 'method_figure': str(PAPER / 'figures/method.pdf'),
              'color_filter_scope': 'completion artwork only', 'outputs': [], 'footage_comparison': [], 'completion': []}
    for out in outputs:
        result = subprocess.run([FF, '-hide_banner', '-loglevel', 'info', '-i', str(out),
                                 '-map', '0:v:0', '-an', '-progress', 'pipe:1', '-f', 'null', '-'], capture_output=True, text=True)
        (WORK / f'decode-{out.stem}.log').write_text(result.stderr)
        if result.returncode:
            raise RuntimeError(result.stderr[-2000:])
        count = int(re.findall(r'^frame=(\d+)$', result.stdout, re.M)[-1])
        expected_frames, size = (1890, '1920x1080') if out == MAIN else (270, '1280x720')
        assert count == expected_frames, (out, count)
        assert size in result.stderr and '30 fps' in result.stderr and 'yuv420p' in result.stderr
        assert not re.search(r'(corrupt|invalid|error while|decode error)', result.stderr, re.I), result.stderr[-2000:]
        data = out.read_bytes()
        assert data.find(b'moov') < data.find(b'mdat'), out
        report['outputs'].append({'path': str(out), 'frames': count, 'duration': count / FPS,
                                  'size': size, 'fps': FPS, 'full_decode': True, 'faststart': True})
    for row in timeline:
        if '_task' not in row['name']:
            continue
        name = row['name']
        detail = name.endswith('detail')
        a, b = WORK / f'{name}-source.png', WORK / f'{name}-light.png'
        frame(row['clean'], '.6', a)
        frame(row['rendered'], '.6', b)
        source, target = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        y, h = (256, 672) if detail else (284, 504)
        measurements = []
        for x in (48, 976):
            box = (x + 4, y + 4, x + 892, y + h - 4)
            difference = ImageStat.Stat(ImageChops.difference(source.crop(box), target.crop(box)))
            assert max(difference.mean) < 3.5 and max(difference.rms) < 7, (name, difference.mean, difference.rms)
            measurements.append({'rgb_mean_absolute_difference': difference.mean, 'rgb_rms_difference': difference.rms})
        report['footage_comparison'].append({'segment': name, 'panels': measurements})
        if not detail:
            completion = WORK / f'{name}-completion.png'
            frame(row['rendered'], '8.2', completion)
            mark = Image.open(completion).crop((852, 204, 948, 284)).convert('RGB')
            green_pixels = sum(1 for r, g, b in mark.getdata() if g > r + 20 and g > b + 8 and 55 < g < 155)
            assert green_pixels > 180, (name, green_pixels)
            report['completion'].append({'segment': name, 'sample_time': 8.2, 'green_icon_pixels': green_pixels})
    samples = [0, 2.3, 6, 13.5, 18.5, 27, 32, 40, 46, 55, 60]
    sheet = Image.new('RGB', (1280, 720 * 3), BG)
    for i, second in enumerate(samples):
        out = WORK / f'main-{second:g}.png'
        frame(MAIN, second, out)
        im = Image.open(out).convert('RGB').resize((640, 360), Image.Resampling.LANCZOS)
        ImageDraw.Draw(im).text((8, 8), f'{second:g}s', fill=PURPLE)
        sheet.paste(im, ((i % 2) * 640, (i // 2) * 360))
    sheet.save(WORK / 'contact-sheet.jpg', quality=92)
    (WORK / 'verification.json').write_text(json.dumps(report, indent=2))
    print(json.dumps({'verified': len(outputs), 'footage_panels': len(report['footage_comparison']) * 2,
                      'completion_marks': len(report['completion']), 'report': str(WORK / 'verification.json')}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--reuse-segments', action='store_true')
    args = parser.parse_args()
    WORK.mkdir(parents=True, exist_ok=True)
    (SITE / 'assets/demos').mkdir(parents=True, exist_ok=True)
    source = json.loads((V14 / 'project/timeline.json').read_text())
    effects = json.loads((V14 / 'project/completion_effects.json').read_text())['effects']
    if args.verify_only or args.reuse_segments:
        timeline = [{**row, 'rendered': str(WORK / f'{row["name"]}.mp4')} for row in source]
    else:
        prepare(source)
        with ThreadPoolExecutor(max_workers=2) as pool:
            timeline = list(pool.map(lambda row: render(row, effects), source))
        (WORK / 'timeline.json').write_text(json.dumps(timeline, indent=2))
    overview = [row for row in timeline if row['name'].endswith('overview')]
    outputs = [MAIN, *[SITE / f'assets/demos/{slug}-light-v14.mp4' for slug in SLUGS]]
    if not args.verify_only:
        with ThreadPoolExecutor(max_workers=2) as pool:
            list(pool.map(web_clip, enumerate(overview)))
        stitch(timeline)
        frame(MAIN, '0', MAIN.with_name(MAIN.stem + '-title.jpg'))
    verify(outputs, timeline)


if __name__ == '__main__':
    main()
