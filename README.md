# Extreme Driving Dataset

> **Released by the Intelligent Chassis Team, School of Vehicle and Mobility, Tsinghua University.**
>
> A multi-modal driving dataset focused on **extreme, critical, and adverse-condition driving scenarios**, collected and curated by the **Tsinghua University Intelligent Chassis Team** with a surround camera rig, a ZED 2i stereo camera (with depth), a forward-facing LiDAR, and synchronized vehicle dynamics / GPS state (Includes human driving data as well as autonomous decision-making and control functions for extreme operating conditions developed by the research group). The dataset is organized in an episode-based, instruction-conditioned format suitable for end-to-end driving, world models, vision-language-action (VLA) models, and trajectory planning research.

🇨🇳 中文版 README 请见 [`README_zh.md`](./README_zh.md)。

> **📦 Packaging note for the Hugging Face release.**
> In the released `Extreme_Driving_Dataset/`, every episode directory is packed into a single `<episode>.tar` file at the same location as the original folder. The directory tree (split → category → sub-scene) is preserved.
>
> **One episode is intentionally left unpacked as a browsable sample**:
> `train/Critical_Driving/Emergency_Braking/episode_6/`
>
> Use this sample to inspect the raw layout (images, ZED stereo, depth `.npy`, LiDAR `.npy`, `metadata.jsonl`, `episode_annotation.json`) before you decide which `.tar` files to download / extract. Extract any other episode with `tar -xf episode_<id>.tar` to recover the same layout.

---

## 1. Highlights

- **Curated by the Tsinghua Intelligent Chassis Team** — sensor design, vehicle platform, calibration, data acquisition and labeling were all carried out in-house, with a strong focus on **vehicle dynamics and chassis-relevant signals** (yaw rate, raw IMU, GPS velocities, GPS heading) that most public driving datasets do not expose.
- **6 top-level scene categories** covering normal, complex, critical (emergency), low-light, rain, and snow driving.
- **589 episodes** in total (train + val), each containing fully synchronized multi-sensor streams resampled to **4 Hz (250 ms)**.
- **7 camera streams per frame**: 4 surround RGB (front-left, front-right, rear-left, rear-right, rear-center) + ZED 2i stereo (left + right) + per-frame **dense depth map (.npy)** + **front LiDAR point cloud (.npy)**.
- **Vehicle state**: speed, yaw rate, raw acceleration (X/Y), GPS N/E velocities, absolute GPS yaw → side-slip angle can be derived directly.
- **Action label**: next-step ego-frame trajectory delta `(Δx, Δy, Δyaw)` for direct planning supervision.
- **Per-episode language prompt** (driving intent) + a rich **annotation JSON** (weather, traffic, hazards, focus points, suggestions, crisis score, summary) generated with VLM assistance.

---

## 2. Directory Layout

```
organized_dataset/
├── train/
│   ├── Normal_Driving/
│   ├── Complex_Traffic_Driving/
│   ├── Critical_Driving/
│   ├── Low_Light_Driving/
│   ├── Rain_Driving/
│   └── Snow_Driving/
├── val/
│   └── (same 6 categories)
└── (utility scripts: timestamp normalization, path checks, repair, upload, …)
```

Each scene category contains many sub-scenes (e.g. `Emergency_Braking`, `Intersection_Left_Turn`, `Lane_Change_Right`, …), and each sub-scene contains one or more **episodes**:

```
episode_<id>/
├── images/
│   ├── ZED_LEFT/              ZED_LEFT_<YYYYMMDD>_<HHMMSS>_<usec>.jpg
│   ├── CAM_FRONT_LEFT/        FRONT_LEFT_*.jpg
│   ├── CAM_FRONT_RIGHT/       FRONT_RIGHT_*.jpg
│   ├── CAM_REAR_LEFT/         REAR_LEFT_*.jpg
│   ├── CAM_REAR_RIGHT/        REAR_RIGHT_*.jpg
│   └── CAM_REAR_CENTER/       REAR_CENTER_*.jpg
├── zed/
│   └── right/                 ZED_RIGHT_*.jpg          (stereo right)
├── depth/                     DEPTH_*.npy              (ZED 2i depth, float32, meters)
├── lidar/                     LIDAR_*.npy              (front LiDAR point cloud)
├── metadata.jsonl             one JSON per frame (4 Hz)
├── episode_annotation.json    episode-level VLM annotation + summary
└── calibration.json           sensor calibration (may be empty/placeholder)
```

> File names share the same timestamp pattern `YYYYMMDD_HHMMSS_<microseconds>` across all sensors, so cross-modal alignment can be done by string matching of the timestamp suffix.

---

## 3. Scene Taxonomy

| Category | Description | # sub-scenes (train / val) |
|---|---|---|
| `Normal_Driving` | Everyday driving: car-following, lane changes, turns, intersections, tunnels, deceleration. | 25 / 5 |
| `Complex_Traffic_Driving` | Dense traffic, ramps, overpasses, construction zones, yielding to pedestrians/skateboarders, complex intersections. | 32 / 8 |
| `Critical_Driving` | **Emergency / extreme** scenarios: emergency braking, evasive maneuvers, obstacle avoidance, collision-avoidance turns. | 11 / 2 |
| `Low_Light_Driving` | Night / underexposed driving. | 5 / 2 |
| `Rain_Driving` | Rainy weather with reflections and reduced visibility. | 11 / 1 |
| `Snow_Driving` | Snowy / snow-covered road scenes. | 2 / 1 |

The **Critical_Driving** split is the centerpiece of this release: it is one of the few open driving corpora that explicitly targets **emergency, near-collision, and limit-handling maneuvers**, an area the Tsinghua Intelligent Chassis Team specializes in.

---

## 4. Per-frame `metadata.jsonl` Schema

`metadata.jsonl` is a JSON-Lines file, one line per timestep, sampled uniformly at **4 Hz (Δt = 250 ms)**. Example:

```json
{
  "images_1": {"type": "image", "url": ".../images/ZED_LEFT/ZED_LEFT_20251121_122122_572194.jpg"},
  "images_2": {"type": "image", "url": ".../images/CAM_FRONT_LEFT/FRONT_LEFT_20251121_122122_572194.jpg"},
  "images_3": {"type": "image", "url": ".../images/CAM_FRONT_RIGHT/FRONT_RIGHT_20251121_122122_572194.jpg"},
  "images_4": {"type": "image", "url": ".../images/CAM_REAR_CENTER/REAR_CENTER_20251121_122122_572194.jpg"},
  "state":  [32.7375, 1.25, -0.0422, 0.1135, -8.96, -2.43, 195.37],
  "action": [1.8779, -0.0140, 0.00331],
  "prompt": "Perform emergency maneuver to ensure safety",
  "is_robot": true
}
```

### 4.1 `state` (length 7) — Vehicle state at the current frame

| Index | Field | Unit | Description |
|------:|-------|------|-------------|
| 0 | `speed`        | km/h | Vehicle longitudinal speed. |
| 1 | `yaw_rate`     | deg/s (or rad/s, see note) | Yaw angular rate around the vertical axis. |
| 2 | `accel_raw_x`  | g    | Raw longitudinal acceleration from the IMU (gravity units). |
| 3 | `accel_raw_y`  | g    | Raw lateral acceleration from the IMU (gravity units). |
| 4 | `gps_v_north`  | m/s  | GPS velocity, north component (south–north axis). |
| 5 | `gps_v_east`   | m/s  | GPS velocity, east component (west–east axis). |
| 6 | `gps_yaw_abs`  | deg  | Absolute GPS heading (true-north reference). Together with `gps_v_north` / `gps_v_east` it lets you compute the true side-slip angle β = yaw − atan2(v_east, v_north). |

### 4.2 `action` (length 3) — Next-step ego-frame trajectory delta

| Index | Field | Unit | Description |
|------:|-------|------|-------------|
| 0 | `delta_x`   | m   | Forward displacement to the next sampled pose, expressed in the **current** ego frame. |
| 1 | `delta_y`   | m   | Lateral displacement to the next sampled pose (left positive, right-handed ego frame). |
| 2 | `delta_yaw` | rad | Heading change to the next pose. |

These three quantities are the canonical **planning targets**: chaining them produces the future trajectory in the ego frame, suitable for behavior cloning, diffusion planners, or VLA action heads.

### 4.3 Other fields

- `images_1..4`: four canonical input views per frame (ZED-left, front-left, front-right, rear-center). All other views (rear-left, rear-right, ZED-right, depth, LiDAR) can be looked up by matching the timestamp under `images/`, `zed/right/`, `depth/`, `lidar/` of the same episode.
- `prompt`: natural-language driving intent for the episode (English).
- `is_robot`: always `true`; included for dataset-format compatibility.

---

## 5. Sensor Modalities

| Modality | Path | Format | Notes |
|---|---|---|---|
| Front-left RGB         | `images/CAM_FRONT_LEFT/`   | `.jpg` | Surround camera, forward-left view. |
| Front-right RGB        | `images/CAM_FRONT_RIGHT/`  | `.jpg` | Forward-right view. |
| Rear-left RGB          | `images/CAM_REAR_LEFT/`    | `.jpg` | Rear-left view. |
| Rear-right RGB         | `images/CAM_REAR_RIGHT/`   | `.jpg` | Rear-right view. |
| Rear-center RGB        | `images/CAM_REAR_CENTER/`  | `.jpg` | Rear-center view. |
| ZED 2i left RGB        | `images/ZED_LEFT/`         | `.jpg` | Stereo left. |
| ZED 2i right RGB       | `zed/right/`               | `.jpg` | Stereo right. |
| ZED 2i depth           | `depth/`                   | `.npy` (float32, meters) | Per-pixel depth from ZED 2i, aligned to ZED-left. |
| Front LiDAR point cloud| `lidar/`                   | `.npy` | Forward-facing LiDAR sweep, per-frame point cloud (load with `numpy.load`). |

Loading example:

```python
import numpy as np
from PIL import Image

img   = Image.open("episode_6/images/CAM_FRONT_LEFT/FRONT_LEFT_20251121_122122_572194.jpg")
depth = np.load("episode_6/depth/DEPTH_20251121_122122_572194.npy")     # HxW float32, meters
lidar = np.load("episode_6/lidar/LIDAR_20251121_122122_572194.npy")     # Nx{3,4} points
```

---

## 6. Episode-level Annotation

`episode_annotation.json` accompanies each episode and contains a VLM-assisted, structured description:

- `episode`: path / intent / name.
- `source`: the frames sampled to feed the VLM (frame indices, image URLs, camera directions), the model used, and the generation timestamp.
- `trajectory_summary`: `frame_count`, `total_distance_xy` (m), `state_start`, `state_end`, `action_mean`, sampled `prompt_examples`.
- `annotation`:
  - `weather` — sunny / cloudy / rain / snow / night ...
  - `traffic_analysis` — free-text traffic description.
  - `road_surface` — surface and lane-marking description.
  - `driving_intent` — high-level intent string.
  - `crisis_score` (0–100) and `crisis_level` (低/中/高/极高) — risk rating.
  - `hazards` — list of hazard sources.
  - `focus_points` — list of attention points.
  - `driving_suggestions` — list of recommended actions.
  - `confidence` — VLM self-rated confidence.
  - `summary` — natural-language episode summary.

---

## 7. Sampling Rate & Synchronization

- All modalities are normalized to a uniform **4 Hz** grid (Δt = 0.25 s) by the included `normalize_timestamps_to_4hz.py` / `fix_metadata_jsonl_to_4hz.py` scripts.
- A row in `metadata.jsonl` is the canonical **time anchor**: matched RGB / depth / LiDAR files share the exact timestamp suffix in their filenames.
- `state` is the measurement **at** the frame timestamp; `action` is the ego-frame delta **from this frame to the next sampled frame**.

---

## 8. Suggested Use Cases

- End-to-end driving / behavior cloning with multi-camera + LiDAR + depth inputs and `(Δx, Δy, Δyaw)` supervision.
- VLA / instruction-following driving using `prompt` and `episode_annotation.json`.
- World models and future prediction conditioned on adverse weather and emergencies.
- **Vehicle-dynamics and chassis-control research** (a core focus of the Tsinghua Intelligent Chassis Team): side-slip estimation, limit-handling, emergency-maneuver modeling — directly supported by the 7-D `state` (β can be derived from GPS heading vs. GPS velocity heading).
- Stereo / monocular depth, LiDAR-camera fusion benchmarks under rain, snow, and low-light.

---

## 9. Quick Start

```python
import json, pathlib

ep = pathlib.Path("train/Critical_Driving/Emergency_Braking/episode_6")
with open(ep / "metadata.jsonl") as f:
    frames = [json.loads(l) for l in f]

print(len(frames), "frames @ 4 Hz")
print("state[0] =", frames[0]["state"])     # [v(km/h), yaw_rate, ax(g), ay(g), v_N, v_E, yaw_abs]
print("action[0] =", frames[0]["action"])   # [dx (m), dy (m), dyaw (rad)] in ego frame
print("prompt   =", frames[0]["prompt"])
```

---

## 10. Splits

| Split | Episodes | Categories |
|---|---:|---|
| `train/` | majority (≈ 90 %) | all 6 |
| `val/`   | held-out (≈ 10 %) | all 6 |

Total episodes across `train/` + `val/`: **589**.

---

## 11. Notes & Caveats

- `calibration.json` may currently be empty for some episodes; sensor extrinsics will be released alongside a future calibration update.
- Depth maps come from the ZED 2i SDK and are aligned to the ZED-left RGB. Invalid / out-of-range pixels may appear as `0`, `nan`, or `inf` — filter before use.
- The `prompt` and `annotation` fields are **VLM-assisted**; treat them as soft labels and use `confidence` for filtering.
- LiDAR is **front-facing only** — do not assume 360° coverage.

---

## 12. About the Team

This dataset is released by the **Intelligent Chassis Team, School of Vehicle and Mobility, Tsinghua University**. The team's research spans intelligent chassis control, vehicle dynamics, and limit-handling control, and end-to-end / VLA driving systems. This release is the team's effort to provide the community with a chassis-aware, dynamics-rich driving corpus emphasizing **extreme and safety-critical scenarios** that are under-represented in existing public datasets.

---

## 13. Contact

For any inquiries or further information, please feel free to contact us:

- **Email**: [Stary132@163.com](mailto:Stary132@163.com)
- **Author's Homepage**: [https://sean-shiyuez.github.io/](https://sean-shiyuez.github.io/)


## 14. Citation

If you use this dataset, please cite:

```bibtex
@misc{extreme_driving_dataset_2026,
  title        = {Extreme Driving Dataset: Multi-Modal Episodes for Critical and Adverse-Condition Driving},
  author       = {Shiyue Zhao and Yuhong Jiang and Xinhan Li and Chengkun He and Junzhi Zhang},
  howpublished = {Intelligent Chassis Team, School of Vehicle and Mobility, Tsinghua University},
  year         = {2026}
}
```
