#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Callable, Iterable

import requests


ROOT = Path(__file__).resolve().parent.parent
COMFY_ROOT = ROOT / "ComfyUI"
WORKFLOWS_ROOT = COMFY_ROOT / "workflows"

IGNORE_NODE_TYPES = {
    "Reroute",
    "PrimitiveNode",
    "Note",
    "MarkdownNote",
    "SetNode",
    "GetNode",
    "Label (rgthree)",
    "Bookmark (rgthree)",
    "Mute / Bypass Relay (rgthree)",
    "Mute / Bypass Repeater (rgthree)",
    "Fast Groups Bypasser (rgthree)",
    "Fast Groups Muter (rgthree)",
}

ASSET_DIRS = (
    COMFY_ROOT / "models" / "diffusion_models",
    COMFY_ROOT / "models" / "unet",
    COMFY_ROOT / "models" / "clip",
    COMFY_ROOT / "models" / "text_encoders",
    COMFY_ROOT / "models" / "vae",
    COMFY_ROOT / "models" / "loras",
    COMFY_ROOT / "models" / "upscale_models",
    COMFY_ROOT / "input",
)


def first_string(values: list[object]) -> list[str]:
    if values and isinstance(values[0], str):
        return [values[0]]
    return []


def lora_values(values: list[object]) -> list[str]:
    results: list[str] = []
    for value in values:
        if not isinstance(value, str):
            continue
        if value in {"", "none"}:
            continue
        if value.endswith((".safetensors", ".pt", ".gguf")):
            results.append(value)
    return results


def auto_prefixed(values: list[object], label: str) -> list[str]:
    if values and isinstance(values[0], str):
        return [f"{values[0]} ({label})"]
    return []


ASSET_EXTRACTORS: dict[str, Callable[[list[object]], list[str]]] = {
    "UNETLoader": first_string,
    "UNETLoaderDisTorch2MultiGPU": first_string,
    "CLIPLoader": first_string,
    "CLIPLoaderGGUF": first_string,
    "VAELoader": first_string,
    "VAELoaderDisTorch2MultiGPU": first_string,
    "WanVideoModelLoader": first_string,
    "WanVideoVAELoader": first_string,
    "WanVideoTextEncodeCached": first_string,
    "MelBandRoFormerModelLoader": first_string,
    "LoadImage": first_string,
    "LoadAudio": first_string,
    "LoadVideo": first_string,
    "VHS_LoadVideoFFmpegPath": first_string,
    "WanVideoLoraSelectMulti": lora_values,
    "LoadUpscalerTensorrtModel": lambda values: auto_prefixed(values, "auto-download/build"),
    "AutoLoadRifeTensorrtModel": lambda values: auto_prefixed(values, "auto-download/build"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit ComfyUI workflows for missing node classes and referenced assets."
    )
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:8191/object_info",
        help="ComfyUI object_info endpoint.",
    )
    parser.add_argument(
        "--workflows-root",
        default=str(WORKFLOWS_ROOT),
        help="Path to the ComfyUI workflows directory.",
    )
    return parser.parse_args()


def load_object_info(url: str) -> dict[str, object]:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()


def iter_workflow_files(workflows_root: Path) -> Iterable[Path]:
    for path in sorted(workflows_root.rglob("*.json")):
        if path.name in {"all-deps.json", "deps.json", "deps-current.json"}:
            continue
        yield path


def collect_existing_assets() -> set[str]:
    keys: set[str] = set()
    for root in ASSET_DIRS:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            keys.add(path.name)
            try:
                keys.add(path.relative_to(root).as_posix())
            except ValueError:
                pass
    return keys


def is_guid_like(node_type: object) -> bool:
    return isinstance(node_type, str) and len(node_type) == 36


def asset_status(asset: str, existing_assets: set[str]) -> str:
    if asset.endswith("(auto-download/build)"):
        return "auto"
    normalized = asset.replace("\\", "/")
    basename = Path(normalized).name
    if asset in existing_assets or normalized in existing_assets or basename in existing_assets:
        return "present"
    return "missing"


def main() -> int:
    args = parse_args()
    workflows_root = Path(args.workflows_root).resolve()
    object_info = load_object_info(args.url)
    existing_assets = collect_existing_assets()

    workflow_count = 0
    problem_count = 0

    for workflow_path in iter_workflow_files(workflows_root):
        workflow_count += 1
        data = json.loads(workflow_path.read_text(encoding="utf-8"))

        missing_nodes: list[str] = []
        asset_rows: list[tuple[str, str, str]] = []

        for node in data.get("nodes", []):
            node_type = node.get("type")
            if not node_type:
                continue
            if node_type not in object_info and node_type not in IGNORE_NODE_TYPES and not is_guid_like(node_type):
                if node_type not in missing_nodes:
                    missing_nodes.append(node_type)

            extractor = ASSET_EXTRACTORS.get(node_type)
            if not extractor:
                continue

            values = node.get("widgets_values")
            if not isinstance(values, list):
                continue

            for asset in extractor(values):
                status = asset_status(asset, existing_assets)
                row = (status, node_type, asset)
                if row not in asset_rows:
                    asset_rows.append(row)

        has_problem = bool(missing_nodes) or any(status == "missing" for status, _, _ in asset_rows)
        if has_problem:
            problem_count += 1

        print(f"## {workflow_path.relative_to(ROOT).as_posix()}")
        if missing_nodes:
            print("missing node classes:")
            for node_type in missing_nodes:
                print(f"  - {node_type}")
        else:
            print("missing node classes: none")

        if asset_rows:
            print("referenced assets:")
            for status, node_type, asset in asset_rows:
                print(f"  - [{status}] {node_type}: {asset}")
        else:
            print("referenced assets: none")
        print()

    print(f"Audited {workflow_count} workflow files; {problem_count} still reference missing assets or node classes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
