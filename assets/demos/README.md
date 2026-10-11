# Bimanual task clips

The displayed light clips recompose the v14 MorphAct demo edit on a cream background. Both columns retain the source timing, layout, and completion marker. They show separate MorphAct and π0.5 trials. The video pixels receive no color filter; titles and completion artwork use the page palette. The original dark assets are preserved.

| Web asset | Source segment in `MorphAct/Demos/demo-edit-v14/segments/` | Task | Playback speed |
| --- | --- | --- | --- |
| `letter-arrangement-light-v14.mp4` | `01_task1_overview.mp4` | Sort Letters | 3.8352941176× |
| `bottle-handling-light-v14.mp4` | `03_task2_overview.mp4` | Deliver Water | 2.9176470588× |
| `object-sorting-light-v14.mp4` | `05_task3_overview.mp4` | Sort Hardware | 4.7764705882× |
| `drawer-storage-light-v14.mp4` | `07_task4_overview.mp4` | Cabinet Storage | 2.2117647059× |

Speed values come from the shared task timing in `demo-edit-v12/project/edit_config.json`, retained by v14. Object sorting uses the updated baseline recording `fenlei.mp4`.

Light web clips are encoded as H.264, yuv420p, 1280 × 720, 30 fps, CRF 18, with MP4 metadata at the beginning. Each is 9 seconds long. Matching JPEG posters are frames at 0.6 seconds. The source recordings and demo-edit projects are preserved separately; `tools/render_light_demo.py` generates the light assets.
