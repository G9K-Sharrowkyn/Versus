#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
COMFY_ROOT = ROOT / "ComfyUI"
MODELS = COMFY_ROOT / "models"
INPUT_DIR = COMFY_ROOT / "input"


DOWNLOADS = [
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
        "target": MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
    },
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
        "target": MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
    },
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
        "target": MODELS / "diffusion_models" / "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
    },
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors",
        "target": MODELS / "diffusion_models" / "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors",
    },
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors",
        "target": MODELS / "vae" / "wan_2.1_vae.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/umt5-xxl-enc-fp8_e4m3fn.safetensors",
        "target": MODELS / "text_encoders" / "umt5-xxl-enc-fp8_e4m3fn.safetensors",
    },
    {
        "url": "https://huggingface.co/city96/umt5-xxl-encoder-gguf/resolve/main/umt5-xxl-encoder-Q5_K_M.gguf",
        "target": MODELS / "text_encoders" / "umt5-xxl-encoder-Q5_K_M.gguf",
    },
    {
        "url": "https://huggingface.co/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/HighNoise/Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf",
        "target": MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf",
    },
    {
        "url": "https://huggingface.co/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/LowNoise/Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf",
        "target": MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf",
    },
    {
        "url": "https://huggingface.co/bullerwins/Wan2.2-T2V-A14B-GGUF/resolve/main/wan2.2_t2v_high_noise_14B_Q3_K_M.gguf",
        "target": MODELS / "unet" / "wan2.2_t2v_high_noise_14B_Q3_K_M.gguf",
    },
    {
        "url": "https://huggingface.co/bullerwins/Wan2.2-T2V-A14B-GGUF/resolve/main/wan2.2_t2v_low_noise_14B_Q3_K_M.gguf",
        "target": MODELS / "unet" / "wan2.2_t2v_low_noise_14B_Q3_K_M.gguf",
    },
    {
        "url": "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors",
        "target": MODELS / "clip_vision" / "clip_vision_h.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/MelBandRoFormer_comfy/resolve/main/MelBandRoformer_fp16.safetensors",
        "target": MODELS / "diffusion_models" / "MelBandRoformer_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/MMAudio_safetensors/resolve/main/mmaudio_vae_44k_fp16.safetensors",
        "target": MODELS / "mmaudio" / "mmaudio_vae_44k_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/MMAudio_safetensors/resolve/main/mmaudio_synchformer_fp16.safetensors",
        "target": MODELS / "mmaudio" / "mmaudio_synchformer_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/MMAudio_safetensors/resolve/main/apple_DFN5B-CLIP-ViT-H-14-384_fp16.safetensors",
        "target": MODELS / "mmaudio" / "apple_DFN5B-CLIP-ViT-H-14-384_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/phazei/NSFW_MMaudio/resolve/main/mmaudio_large_44k_nsfw_gold_8.5k_final_fp16.safetensors",
        "target": MODELS / "mmaudio" / "mmaudio_large_44k_nsfw_gold_8.5k_final_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors",
        "target": MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_I2V_14B_480p_cfg_step_distill_rank256_bf16.safetensors",
        "target": MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank256_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_14B_T2V_cfg_step_distill_lora_adaptive_rank_quantile_0.15_bf16.safetensors",
        "target": MODELS / "loras" / "lightx2v_14B_T2V_cfg_step_distill_lora_adaptive_rank_quantile_0.15_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Lightx2v/lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors",
        "target": MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Wan22_Lightx2v/Wan_2_2_I2V_A14B_HIGH_lightx2v_4step_lora_v1030_rank_64_bf16.safetensors",
        "target": MODELS / "loras" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_4step_lora_v1030_rank_64_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Wan22_Lightx2v/Wan_2_2_I2V_A14B_HIGH_lightx2v_MoE_distill_lora_rank_64_bf16.safetensors",
        "target": MODELS / "loras" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_MoE_distill_lora_rank_64_bf16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Stable-Video-Infinity/v2.0/SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors",
        "target": MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/LoRAs/Stable-Video-Infinity/v2.0/SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors",
        "target": MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors",
    },
    {
        "url": "https://huggingface.co/marduk191/rife/resolve/main/rife47.pth",
        "target": MODELS / "rife" / "rife47.pth",
    },
    {
        "url": "https://huggingface.co/marduk191/rife/resolve/main/rife49.pth",
        "target": MODELS / "rife" / "rife49.pth",
    },
    {
        "url": "https://huggingface.co/huchukato/favs/resolve/main/ESRGAN/2xLexicaRRDBNet.pth",
        "target": MODELS / "upscale_models" / "2xLexicaRRDBNet.pth",
    },
    {
        "url": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth",
        "target": MODELS / "upscale_models" / "RealESRGAN_x4plus_anime_6B.pth",
    },
]


ALIASES = [
    (MODELS / "diffusion_models" / "MelBandRoformer_fp16.safetensors", MODELS / "diffusion_models" / "MelBandRoformer_fp32.safetensors"),
    (MODELS / "text_encoders" / "umt5-xxl-enc-fp8_e4m3fn.safetensors", MODELS / "text_encoders" / "umt5_xxl_fp16.safetensors"),
    (MODELS / "text_encoders" / "umt5-xxl-enc-fp8_e4m3fn.safetensors", MODELS / "text_encoders" / "umt5_xxl_fp8_e4m3fn_scaled.safetensors"),
    (MODELS / "text_encoders" / "umt5-xxl-enc-fp8_e4m3fn.safetensors", MODELS / "text_encoders" / "nsfw_wan_umt5-xxl_fp8_scaled.safetensors"),
    (MODELS / "text_encoders" / "umt5-xxl-encoder-Q5_K_M.gguf", MODELS / "text_encoders" / "umt5-xxl-encoder-Q8_0.gguf"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp16.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp16.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "diffusion_models" / "wan2.2_t2v_high_noise_14B_fp16.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors", MODELS / "diffusion_models" / "wan2.2_t2v_low_noise_14B_fp16.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "diffusion_models" / "Wan2_1-HuMo-14B_fp16.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "liveWallpaperFast_i2v14B720P.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "DasiwaWAN22I2V14BLightspeed_synthseductionHighV9.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "DasiwaWAN22I2V14BLightspeed_synthseductionLowV9.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "WAN" / "Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "WAN" / "Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "wan22EnhancedNSFWSVICamera_nsfwV2FP8H.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "wan22EnhancedNSFWSVICamera_nsfwV2FP8L.safetensors"),
    (MODELS / "diffusion_models" / "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", MODELS / "unet" / "z image" / "z_image_turbo_bf16.safetensors"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "liveWallpaperFast_i2v14B720P.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "WAN" / "wan22I2VA14BGGUF_a14bHigh.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf", MODELS / "unet" / "WAN" / "wan22I2VA14BGGUF_a14bLow.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "DasiwaWAN22I2V14BTastysinV8_q4High.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf", MODELS / "unet" / "DasiwaWAN22I2V14BTastysinV8_q4Low.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "wan22EnhancedNSFWSVICamera_nsfwV2Q8High.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf", MODELS / "unet" / "wan22EnhancedNSFWSVICamera_nsfwV2Q8Low.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "wan22EnhancedNSFWCameraPrompt_nsfwFASTMOVEV2Q8H.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf", MODELS / "unet" / "wan22EnhancedNSFWCameraPrompt_nsfwFASTMOVEV2Q8L.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf", MODELS / "unet" / "wan 2.2" / "Wan_2.2_I2V_HighNoise_10steps_Q8_0.gguf"),
    (MODELS / "unet" / "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf", MODELS / "unet" / "wan 2.2" / "Wan_2.2_I2V_LowNoise_10steps_Q8_0.gguf"),
    (MODELS / "unet" / "wan2.2_t2v_high_noise_14B_Q3_K_M.gguf", MODELS / "unet" / "wan2.2_t2v_high_noise_14B_Q4_K_M.gguf"),
    (MODELS / "unet" / "wan2.2_t2v_low_noise_14B_Q3_K_M.gguf", MODELS / "unet" / "wan2.2_t2v_low_noise_14B_Q4_K_M.gguf"),
    (MODELS / "mmaudio" / "mmaudio_large_44k_nsfw_gold_8.5k_final_fp16.safetensors", MODELS / "mmaudio" / "mmaudio_nsfw_large_44k_v2_fp16.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors", MODELS / "loras" / "Wan21_I2V_14B_lightx2v_cfg_step_distill_lora_rank64.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors", MODELS / "loras" / "SVI_Wan2.2-I2V-A14B_high_noise_lora_v2.0_pro.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors", MODELS / "loras" / "SVI_Wan2.2-I2V-A14B_low_noise_lora_v2.0_pro.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors", MODELS / "loras" / "wan22-G4GG1NGv6-11epoc-low-i2v-k3nk.safetensors"),
    (MODELS / "loras" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_4step_lora_v1030_rank_64_bf16.safetensors", MODELS / "loras" / "wan22-G4GG1NGv6-11epoc-high-i2v-k3nk.safetensors"),
    (MODELS / "loras" / "lightx2v_14B_T2V_cfg_step_distill_lora_adaptive_rank_quantile_0.15_bf16.safetensors", MODELS / "loras" / "Wan22_A14B_T2V_HIGH_Lightning_4steps_lora_250928_rank128_fp16.safetensors"),
    (MODELS / "loras" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_MoE_distill_lora_rank_64_bf16.safetensors", MODELS / "loras" / "WAN lightning lightx" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_MoE_distill_lora_rank_64_bf16.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors", MODELS / "loras" / "WAN lightning lightx" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors", MODELS / "loras" / "91 Lighning" / "Wan21_I2V_14B_lightx2v_cfg_step_distill_lora_rank64.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors", MODELS / "loras" / "90 video" / "wan french tongue kissing v1 (tungue kiss).safetensors"),
    (MODELS / "loras" / "Wan_2_2_I2V_A14B_HIGH_lightx2v_4step_lora_v1030_rank_64_bf16.safetensors", MODELS / "loras" / "NSFW-22-H-e8.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors", MODELS / "loras" / "DR34ML4Y_I2V_14B_HIGH_V2.safetensors"),
    (MODELS / "loras" / "lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors", MODELS / "loras" / "NSFW-22-L-e8.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors", MODELS / "loras" / "DR34ML4Y_I2V_14B_LOW_V2.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors", MODELS / "loras" / "wan 2.2" / "SVI_v2_PRO_Wan2.2-I2V-A14B_HIGH_lora_rank_128_fp16.safetensors"),
    (MODELS / "loras" / "SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors", MODELS / "loras" / "wan 2.2" / "SVI_v2_PRO_Wan2.2-I2V-A14B_LOW_lora_rank_128_fp16.safetensors"),
    (MODELS / "upscale_models" / "2xLexicaRRDBNet.pth", MODELS / "upscale_models" / "2x_NMKD-UpgifLiteV2_210k.pth"),
    (MODELS / "upscale_models" / "RealESRGAN_x4plus_anime_6B.pth", MODELS / "upscale_models" / "4x-AnimeSharp.pth"),
]


MISSING_INPUT_FILES = [
    "ChatGPT Image 8 lut 2026, 17_43_51.png",
    "2026-01-25-171350_semiRealIllustrious_v20_725986790132937.jpg",
    "2025-11-25-152442_illustrij_v19_642506305602372.webp",
    "2025-06-25-065329_661058913817098.png",
    "78557734.png",
    "00046-3958745856.png",
    "00318-2651222499.png",
    "2026-01-31-170115_perfectdeliberate_v70_1057198417842388.png",
    "2026-02-19-073916_illustrij_v18_144750597828275.png",
    "02_01.png",
    "01 (15).png",
    "Flux2-Klein-latent-upscale_00233_.png",
    "08_00075_.png",
    "frame-border-civitai-gold-k3nk-tag.png",
    "0717_00050_.png",
    "Flux2-Klein-latent-upscale_01189_.png",
    "Flux2-Klein_00566_.png",
    "Flux2-Klein-latent-upscale_00075_.png",
    "Flux2-Klein-latent-upscale_00785_.png",
    "photo_2026-02-26_22-37-42.jpg",
    "2025-06-12-150239_test_0.jpeg",
    "065921_00001_.png",
]

MISSING_INPUT_VIDEOS = {
    "7d236bd5.mp4": "Untitled-4.mp4",
}

MISSING_INPUT_AUDIO = [
    "female_0_kmh.mp3",
]


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=True)


def download_file(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 0:
        print(f"skip: {target}")
        return
    part = target.with_suffix(target.suffix + ".part")
    run(
        [
            "curl.exe",
            "--ssl-no-revoke",
            "-L",
            "--fail",
            "--retry",
            "3",
            "--retry-all-errors",
            "--retry-delay",
            "5",
            "-C",
            "-",
            "-o",
            str(part),
            url,
        ]
    )
    part.replace(target)


def hardlink_or_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        return
    try:
        os.link(source, target)
    except OSError:
        shutil.copy2(source, target)


def ensure_silent_audio(target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        return
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=stereo",
            "-t",
            "3",
            "-q:a",
            "9",
            str(target),
        ]
    )


def ensure_placeholders() -> None:
    png_source = INPUT_DIR / "example.png"
    jpg_source = INPUT_DIR / "Terawat.jpg"
    for name in MISSING_INPUT_FILES:
        target = INPUT_DIR / name
        if target.exists():
            continue
        source = png_source if target.suffix.lower() == ".png" else jpg_source
        hardlink_or_copy(source, target)

    for target_name, source_name in MISSING_INPUT_VIDEOS.items():
        target = INPUT_DIR / target_name
        if target.exists():
            continue
        source = INPUT_DIR / source_name
        if not source.exists():
            raise FileNotFoundError(f"video placeholder source missing: {source}")
        hardlink_or_copy(source, target)

    for name in MISSING_INPUT_AUDIO:
        ensure_silent_audio(INPUT_DIR / name)


def patch_wanvideo_model_loader_quantization(workflow_path: Path) -> None:
    data = json.loads(workflow_path.read_text(encoding="utf-8"))
    changed = False
    for node in data.get("nodes", []):
        if node.get("type") != "WanVideoModelLoader":
            continue
        values = node.get("widgets_values")
        if not isinstance(values, list) or len(values) < 3:
            continue
        model_name = values[0] if isinstance(values[0], str) else ""
        if "wan2.2_" in model_name.lower() or "humo" in model_name.lower():
            if values[2] != "fp8_e4m3fn_scaled":
                values[2] = "fp8_e4m3fn_scaled"
                changed = True
    if changed:
        workflow_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"patched: {workflow_path}")


def download_flownet() -> None:
    target_dir = MODELS / "rife"
    target_file = target_dir / "flownet.pkl"
    if target_file.exists():
        return
    run(
        [
            sys.executable,
            str(COMFY_ROOT / "custom_nodes" / "ComfyUI-VFI" / "rife" / "download_rife.py"),
            str(target_dir),
        ]
    )


def main() -> int:
    for entry in DOWNLOADS:
        download_file(entry["url"], entry["target"])

    download_flownet()

    for source, target in ALIASES:
        if not source.exists():
            raise FileNotFoundError(f"alias source missing: {source}")
        hardlink_or_copy(source, target)

    ensure_placeholders()

    patch_wanvideo_model_loader_quantization(
        COMFY_ROOT / "workflows" / "1" / "WAN2.2 I2V Only - K3NK v2.5.4.json"
    )
    patch_wanvideo_model_loader_quantization(
        COMFY_ROOT / "workflows" / "1" / "WAN2.2 T2V-I2V-T2I-S2V K3NK v2.5.4 SVI.json"
    )

    print("setup complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
