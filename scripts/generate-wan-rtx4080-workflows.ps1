$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$targetDir = Join-Path $repoRoot "ComfyUI/workflows/10"
$fileName = "WAN 2.1 FLF2V - RTX4080 - ALL-IN-ONE.json"
$filePath = Join-Path $targetDir $fileName

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

function New-InputPort {
    param(
        [string]$Name,
        $Type,
        [object]$Link = $null,
        [object]$Shape = $null
    )

    $port = [ordered]@{
        name = $Name
        type = $Type
        link = $Link
    }

    if ($null -ne $Shape) {
        $port.shape = $Shape
    }

    return $port
}

function New-WidgetInputPort {
    param(
        [string]$Name,
        $Type,
        [object]$Link = $null,
        [object]$Shape = $null
    )

    $port = [ordered]@{
        name = $Name
        type = $Type
        widget = [ordered]@{
            name = $Name
        }
        link = $Link
    }

    if ($null -ne $Shape) {
        $port.shape = $Shape
    }

    return $port
}

function New-OutputPort {
    param(
        [string]$Name,
        $Type,
        [object]$Links = $null,
        [object]$Shape = $null
    )

    $port = [ordered]@{
        name = $Name
        type = $Type
        links = $Links
    }

    if ($null -ne $Shape) {
        $port.shape = $Shape
    }

    return $port
}

function New-Node {
    param(
        [int]$Id,
        [string]$Type,
        [int[]]$Pos,
        [int[]]$Size,
        [object[]]$Inputs,
        [object[]]$Outputs,
        [object]$WidgetsValues,
        [string]$Title = "",
        [hashtable]$Properties = @{},
        [hashtable]$Flags = @{},
        [int]$Mode = 0,
        [string]$Color = "",
        [string]$BgColor = "",
        [object]$Shape = $null
    )

    if (-not $Properties.ContainsKey("Node name for S&R")) {
        $Properties["Node name for S&R"] = $Type
    }

    if ($null -eq $WidgetsValues) {
        $WidgetsValues = @()
    }

    $node = [ordered]@{
        id = $Id
        type = $Type
        pos = $Pos
        size = $Size
        flags = $Flags
        order = 0
        mode = $Mode
        inputs = $Inputs
        outputs = $Outputs
        properties = $Properties
        widgets_values = $WidgetsValues
    }

    if ($Title) {
        $node.title = $Title
    }
    if ($Color) {
        $node.color = $Color
    }
    if ($BgColor) {
        $node.bgcolor = $BgColor
    }
    if ($null -ne $Shape) {
        $node.shape = $Shape
    }

    return $node
}

function Add-Node {
    param(
        [System.Collections.ArrayList]$Nodes,
        [hashtable]$NodeMap,
        [hashtable]$Node
    )

    [void]$Nodes.Add($Node)
    $NodeMap[$Node.id] = $Node
}

function Add-Link {
    param(
        [System.Collections.ArrayList]$Links,
        [hashtable]$NodeMap,
        [ref]$LinkId,
        [int]$FromNode,
        [int]$FromSlot,
        [int]$ToNode,
        [int]$ToSlot,
        [string]$Type
    )

    $id = $LinkId.Value
    $LinkId.Value++

    [void]$Links.Add(@($id, $FromNode, $FromSlot, $ToNode, $ToSlot, $Type))

    $from = $NodeMap[$FromNode]
    if ($null -eq $from.outputs[$FromSlot].links) {
        $from.outputs[$FromSlot].links = [System.Collections.ArrayList]@()
    }
    [void]$from.outputs[$FromSlot].links.Add($id)

    $to = $NodeMap[$ToNode]
    $to.inputs[$ToSlot].link = $id
}

function Set-Orders {
    param([System.Collections.ArrayList]$Nodes)

    for ($i = 0; $i -lt $Nodes.Count; $i++) {
        $Nodes[$i].order = $i
    }
}

function New-MasterWorkflow {
    $nodes = [System.Collections.ArrayList]@()
    $nodeMap = @{}
    $links = [System.Collections.ArrayList]@()
    $linkId = 1

    Add-Node $nodes $nodeMap (New-Node -Id 1 -Type "Note" -Pos @(-1640, -1540) -Size @(560, 320) `
        -Inputs @() -Outputs @() `
        -WidgetsValues @("ONE FILE / TWO INDEXES`n`nScene Mode Index:`n- 0 = START-END`n- 1 = LOOP`n`nQuality Mode Index:`n- 0 = TEST 640x360 / 25f / 6 steps`n- 1 = UPSCALE 768x432 / 41f / 8 steps + 2x upscale`n`nThis version uses native WanImageToVideo_F2.`nNo PainterFLF2V. No end-frame normalization trick.`nIn LOOP mode End Frame is ignored and Start Frame is reused as the end.") `
        -Title "RTX 4080 MASTER" -Color "#432" -BgColor "#653" -Shape 2)

    Add-Node $nodes $nodeMap (New-Node -Id 2 -Type "INTConstant" -Pos @(-1640, -1160) -Size @(240, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) `
        -WidgetsValues @(0) -Title "Scene Mode Index" -Color "#263238" -BgColor "#37474f")

    Add-Node $nodes $nodeMap (New-Node -Id 3 -Type "INTConstant" -Pos @(-1360, -1160) -Size @(240, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) `
        -WidgetsValues @(0) -Title "Quality Mode Index" -Color "#263238" -BgColor "#37474f")

    Add-Node $nodes $nodeMap (New-Node -Id 4 -Type "UNETLoader" -Pos @(-1640, -980) -Size @(360, 82) `
        -Inputs @() -Outputs @((New-OutputPort "MODEL" "MODEL")) `
        -WidgetsValues @("wan2.1_flf2v_720p_14B_fp16.safetensors", "fp8_e4m3fn_fast") `
        -Color "#323" -BgColor "#535")

    Add-Node $nodes $nodeMap (New-Node -Id 5 -Type "ModelSamplingSD3" -Pos @(-1240, -980) -Size @(240, 58) `
        -Inputs @((New-InputPort "model" "MODEL")) -Outputs @((New-OutputPort "MODEL" "MODEL")) `
        -WidgetsValues @(8.0))

    Add-Node $nodes $nodeMap (New-Node -Id 6 -Type "CLIPLoader" -Pos @(-1640, -820) -Size @(360, 100) `
        -Inputs @() -Outputs @((New-OutputPort "CLIP" "CLIP")) `
        -WidgetsValues @("umt5_xxl_fp16.safetensors", "wan", "cpu") `
        -Color "#323" -BgColor "#535")

    Add-Node $nodes $nodeMap (New-Node -Id 7 -Type "CLIPTextEncode" -Pos @(-1220, -760) -Size @(400, 200) `
        -Inputs @((New-InputPort "clip" "CLIP")) -Outputs @((New-OutputPort "CONDITIONING" "CONDITIONING")) `
        -WidgetsValues @("smooth natural motion, consistent subject, consistent face, clean transition, stable lighting, cinematic movement") `
        -Title "Positive" -Color "#232" -BgColor "#353")

    Add-Node $nodes $nodeMap (New-Node -Id 8 -Type "CLIPTextEncode" -Pos @(-1220, -520) -Size @(400, 200) `
        -Inputs @((New-InputPort "clip" "CLIP")) -Outputs @((New-OutputPort "CONDITIONING" "CONDITIONING")) `
        -WidgetsValues @("blurry, low quality, flicker, ghosting, jitter, warped anatomy, duplicate subject, extra limbs, text, watermark") `
        -Title "Negative" -Color "#322" -BgColor "#533")

    Add-Node $nodes $nodeMap (New-Node -Id 9 -Type "CLIPVisionLoader" -Pos @(-1640, -660) -Size @(360, 58) `
        -Inputs @() -Outputs @((New-OutputPort "CLIP_VISION" "CLIP_VISION")) `
        -WidgetsValues @("clip_vision_h.safetensors") `
        -Color "#323" -BgColor "#535")

    Add-Node $nodes $nodeMap (New-Node -Id 10 -Type "VAELoader" -Pos @(-1640, -560) -Size @(360, 58) `
        -Inputs @() -Outputs @((New-OutputPort "VAE" "VAE")) `
        -WidgetsValues @("wan_2.1_vae.safetensors") `
        -Color "#323" -BgColor "#535")

    Add-Node $nodes $nodeMap (New-Node -Id 11 -Type "LoadImage" -Pos @(-1640, -200) -Size @(320, 326) `
        -Inputs @() -Outputs @((New-OutputPort "IMAGE" "IMAGE"), (New-OutputPort "MASK" "MASK")) `
        -WidgetsValues @("example.png", "image", "") `
        -Title "Start Frame" -Color "#2a363b" -BgColor "#3f5159")

    Add-Node $nodes $nodeMap (New-Node -Id 12 -Type "LoadImage" -Pos @(-1640, 240) -Size @(320, 326) `
        -Inputs @() -Outputs @((New-OutputPort "IMAGE" "IMAGE"), (New-OutputPort "MASK" "MASK")) `
        -WidgetsValues @("00318-2651222499.png", "image", "") `
        -Title "End Frame" -Color "#2a363b" -BgColor "#3f5159")

    Add-Node $nodes $nodeMap (New-Node -Id 13 -Type "ImageNoiseAugmentation" -Pos @(-1260, -180) -Size @(240, 106) `
        -Inputs @((New-InputPort "image" "IMAGE")) -Outputs @((New-OutputPort "IMAGE" "IMAGE")) `
        -WidgetsValues @(0.0, 1234, "fixed"))

    Add-Node $nodes $nodeMap (New-Node -Id 14 -Type "CLIPVisionEncode" -Pos @(-940, -180) -Size @(260, 80) `
        -Inputs @((New-InputPort "clip_vision" "CLIP_VISION"), (New-InputPort "image" "IMAGE")) `
        -Outputs @((New-OutputPort "CLIP_VISION_OUTPUT" "CLIP_VISION_OUTPUT")) `
        -WidgetsValues @("none"))

    Add-Node $nodes $nodeMap (New-Node -Id 15 -Type "ImageNoiseAugmentation" -Pos @(-1260, 260) -Size @(240, 106) `
        -Inputs @((New-InputPort "image" "IMAGE")) -Outputs @((New-OutputPort "IMAGE" "IMAGE")) `
        -WidgetsValues @(0.0, 1234, "fixed"))

    Add-Node $nodes $nodeMap (New-Node -Id 16 -Type "INTConstant" -Pos @(-1640, 700) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(768) -Title "Width Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 17 -Type "INTConstant" -Pos @(-1640, 780) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(640) -Title "Width Test")

    Add-Node $nodes $nodeMap (New-Node -Id 18 -Type "easy anythingIndexSwitch" -Pos @(-1380, 700) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 19 -Type "INTConstant" -Pos @(-1640, 880) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(432) -Title "Height Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 20 -Type "INTConstant" -Pos @(-1640, 960) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(360) -Title "Height Test")

    Add-Node $nodes $nodeMap (New-Node -Id 21 -Type "easy anythingIndexSwitch" -Pos @(-1380, 880) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 22 -Type "INTConstant" -Pos @(-1640, 1060) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(41) -Title "Length Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 23 -Type "INTConstant" -Pos @(-1640, 1140) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(25) -Title "Length Test")

    Add-Node $nodes $nodeMap (New-Node -Id 24 -Type "easy anythingIndexSwitch" -Pos @(-1380, 1060) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 25 -Type "FloatConstant" -Pos @(-1640, 1240) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "FLOAT")) -WidgetsValues @(1.20) -Title "Motion Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 26 -Type "FloatConstant" -Pos @(-1640, 1320) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "FLOAT")) -WidgetsValues @(1.15) -Title "Motion Test")

    Add-Node $nodes $nodeMap (New-Node -Id 27 -Type "easy anythingIndexSwitch" -Pos @(-1380, 1240) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 28 -Type "INTConstant" -Pos @(-1640, 1420) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(8) -Title "Steps Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 29 -Type "INTConstant" -Pos @(-1640, 1500) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "INT")) -WidgetsValues @(6) -Title "Steps Test")

    Add-Node $nodes $nodeMap (New-Node -Id 30 -Type "easy anythingIndexSwitch" -Pos @(-1380, 1420) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 31 -Type "FloatConstant" -Pos @(-1640, 1600) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "FLOAT")) -WidgetsValues @(5.00) -Title "CFG Upscale")

    Add-Node $nodes $nodeMap (New-Node -Id 32 -Type "FloatConstant" -Pos @(-1640, 1680) -Size @(210, 58) `
        -Inputs @() -Outputs @((New-OutputPort "value" "FLOAT")) -WidgetsValues @(4.50) -Title "CFG Test")

    Add-Node $nodes $nodeMap (New-Node -Id 33 -Type "easy anythingIndexSwitch" -Pos @(-1380, 1600) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "value0" "*"),
            (New-InputPort "value1" "*")
        ) `
        -Outputs @((New-OutputPort "value" "*")) `
        -WidgetsValues @(0))

    Add-Node $nodes $nodeMap (New-Node -Id 34 -Type "easy imageIndexSwitch" -Pos @(-620, 60) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "image0" "IMAGE"),
            (New-InputPort "image1" "IMAGE")
        ) `
        -Outputs @((New-OutputPort "image" "IMAGE")) `
        -WidgetsValues @(0) -Title "End Image Source")

    Add-Node $nodes $nodeMap (New-Node -Id 35 -Type "WanImageToVideo_F2" -Pos @(-300, -260) -Size @(360, 280) `
        -Inputs @(
            (New-InputPort "positive" "CONDITIONING"),
            (New-InputPort "negative" "CONDITIONING"),
            (New-InputPort "vae" "VAE"),
            (New-WidgetInputPort "width" "INT"),
            (New-WidgetInputPort "height" "INT"),
            (New-WidgetInputPort "length" "INT"),
            (New-InputPort "start_image" "IMAGE"),
            (New-InputPort "end_image" "IMAGE" $null 7),
            (New-InputPort "clip_vision_output" "CLIP_VISION_OUTPUT" $null 7)
        ) `
        -Outputs @(
            (New-OutputPort "positive" "CONDITIONING"),
            (New-OutputPort "negative" "CONDITIONING"),
            (New-OutputPort "latent" "LATENT")
        ) `
        -WidgetsValues @(768, 432, 41))

    Add-Node $nodes $nodeMap (New-Node -Id 36 -Type "CFGGuider" -Pos @(120, -220) -Size @(300, 120) `
        -Inputs @(
            (New-InputPort "model" "MODEL"),
            (New-InputPort "positive" "CONDITIONING"),
            (New-InputPort "negative" "CONDITIONING"),
            (New-WidgetInputPort "cfg" "FLOAT")
        ) `
        -Outputs @((New-OutputPort "GUIDER" "GUIDER")) `
        -WidgetsValues @(5.0))

    Add-Node $nodes $nodeMap (New-Node -Id 37 -Type "KSamplerSelect" -Pos @(120, -60) -Size @(280, 58) `
        -Inputs @() -Outputs @((New-OutputPort "SAMPLER" "SAMPLER")) `
        -WidgetsValues @("uni_pc"))

    Add-Node $nodes $nodeMap (New-Node -Id 38 -Type "BasicScheduler" -Pos @(120, 40) -Size @(320, 140) `
        -Inputs @(
            (New-InputPort "model" "MODEL"),
            (New-WidgetInputPort "scheduler" "COMBO"),
            (New-WidgetInputPort "steps" "INT"),
            (New-WidgetInputPort "denoise" "FLOAT")
        ) `
        -Outputs @((New-OutputPort "SIGMAS" "SIGMAS")) `
        -WidgetsValues @("sgm_uniform", 16, 1.0))

    Add-Node $nodes $nodeMap (New-Node -Id 39 -Type "RandomNoise" -Pos @(120, 220) -Size @(320, 82) `
        -Inputs @() -Outputs @((New-OutputPort "NOISE" "NOISE")) `
        -WidgetsValues @(1061653907119176, "fixed"))

    Add-Node $nodes $nodeMap (New-Node -Id 40 -Type "SamplerCustomAdvanced" -Pos @(500, -200) -Size @(300, 474) `
        -Inputs @(
            (New-InputPort "noise" "NOISE"),
            (New-InputPort "guider" "GUIDER"),
            (New-InputPort "sampler" "SAMPLER"),
            (New-InputPort "sigmas" "SIGMAS"),
            (New-InputPort "latent_image" "LATENT")
        ) `
        -Outputs @(
            (New-OutputPort "output" "LATENT"),
            (New-OutputPort "denoised_output" "LATENT")
        ) `
        -WidgetsValues @())

    Add-Node $nodes $nodeMap (New-Node -Id 41 -Type "VAEDecode" -Pos @(880, -160) -Size @(160, 46) `
        -Inputs @((New-InputPort "samples" "LATENT"), (New-InputPort "vae" "VAE")) `
        -Outputs @((New-OutputPort "IMAGE" "IMAGE")))

    Add-Node $nodes $nodeMap (New-Node -Id 42 -Type "WanSkipEndFrameImages_F2" -Pos @(1120, -200) -Size @(260, 58) `
        -Inputs @((New-InputPort "images" "IMAGE")) -Outputs @((New-OutputPort "IMAGE" "IMAGE")) `
        -WidgetsValues @(0) -Title "Keep End Frame")

    Add-Node $nodes $nodeMap (New-Node -Id 43 -Type "WanSkipEndFrameImages_F2" -Pos @(1120, -110) -Size @(260, 58) `
        -Inputs @((New-InputPort "images" "IMAGE")) -Outputs @((New-OutputPort "IMAGE" "IMAGE")) `
        -WidgetsValues @(1) -Title "Skip Final Duplicate")

    Add-Node $nodes $nodeMap (New-Node -Id 44 -Type "easy imageIndexSwitch" -Pos @(1440, -160) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "image0" "IMAGE"),
            (New-InputPort "image1" "IMAGE")
        ) `
        -Outputs @((New-OutputPort "image" "IMAGE")) `
        -WidgetsValues @(0) -Title "Mode Output")

    Add-Node $nodes $nodeMap (New-Node -Id 45 -Type "UpscaleModelLoader" -Pos @(1120, 20) -Size @(300, 58) `
        -Inputs @() -Outputs @((New-OutputPort "UPSCALE_MODEL" "UPSCALE_MODEL")) `
        -WidgetsValues @("2xLexicaRRDBNet.pth"))

    Add-Node $nodes $nodeMap (New-Node -Id 46 -Type "ImageUpscaleWithModelBatched" -Pos @(1440, 0) -Size @(320, 86) `
        -Inputs @(
            (New-InputPort "upscale_model" "UPSCALE_MODEL"),
            (New-InputPort "images" "IMAGE")
        ) `
        -Outputs @((New-OutputPort "IMAGE" "IMAGE")) `
        -WidgetsValues @(6, 1.0, "lanczos", "float16"))

    Add-Node $nodes $nodeMap (New-Node -Id 47 -Type "easy imageIndexSwitch" -Pos @(1800, -70) -Size @(280, 120) `
        -Inputs @(
            (New-WidgetInputPort "index" "INT"),
            (New-InputPort "image0" "IMAGE"),
            (New-InputPort "image1" "IMAGE")
        ) `
        -Outputs @((New-OutputPort "image" "IMAGE")) `
        -WidgetsValues @(0) -Title "Render Output")

    Add-Node $nodes $nodeMap (New-Node -Id 48 -Type "VHS_VideoCombine" -Pos @(2140, -220) -Size @(430, 540) `
        -Inputs @(
            (New-InputPort "images" "IMAGE"),
            (New-InputPort "audio" "AUDIO" $null 7),
            (New-InputPort "meta_batch" "VHS_BatchManager" $null 7),
            (New-InputPort "vae" "VAE" $null 7)
        ) `
        -Outputs @((New-OutputPort "Filenames" "VHS_FILENAMES")) `
        -WidgetsValues ([ordered]@{
            frame_rate = 16
            loop_count = 0
            filename_prefix = "WAN/RTX4080/all_in_one_"
            format = "video/h264-mp4"
            pix_fmt = "yuv420p"
            crf = 19
            save_metadata = $false
            trim_to_audio = $false
            pingpong = $false
            save_output = $true
            videopreview = [ordered]@{
                hidden = $false
                paused = $false
                params = $null
            }
        }) `
        -Title "RESULT")

    Add-Link $links $nodeMap ([ref]$linkId) 4 0 5 0 "MODEL"
    Add-Link $links $nodeMap ([ref]$linkId) 5 0 36 0 "MODEL"
    Add-Link $links $nodeMap ([ref]$linkId) 5 0 38 0 "MODEL"
    Add-Link $links $nodeMap ([ref]$linkId) 6 0 7 0 "CLIP"
    Add-Link $links $nodeMap ([ref]$linkId) 6 0 8 0 "CLIP"
    Add-Link $links $nodeMap ([ref]$linkId) 9 0 14 0 "CLIP_VISION"
    Add-Link $links $nodeMap ([ref]$linkId) 10 0 35 2 "VAE"
    Add-Link $links $nodeMap ([ref]$linkId) 10 0 41 1 "VAE"
    Add-Link $links $nodeMap ([ref]$linkId) 11 0 13 0 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 12 0 15 0 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 13 0 14 1 "IMAGE"

    Add-Link $links $nodeMap ([ref]$linkId) 3 0 18 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 17 0 18 1 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 16 0 18 2 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 21 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 20 0 21 1 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 19 0 21 2 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 24 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 23 0 24 1 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 22 0 24 2 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 27 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 26 0 27 1 "FLOAT"
    Add-Link $links $nodeMap ([ref]$linkId) 25 0 27 2 "FLOAT"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 30 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 29 0 30 1 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 28 0 30 2 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 33 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 32 0 33 1 "FLOAT"
    Add-Link $links $nodeMap ([ref]$linkId) 31 0 33 2 "FLOAT"

    Add-Link $links $nodeMap ([ref]$linkId) 2 0 34 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 12 0 34 1 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 11 0 34 2 "IMAGE"

    Add-Link $links $nodeMap ([ref]$linkId) 7 0 35 0 "CONDITIONING"
    Add-Link $links $nodeMap ([ref]$linkId) 8 0 35 1 "CONDITIONING"
    Add-Link $links $nodeMap ([ref]$linkId) 18 0 35 3 "*"
    Add-Link $links $nodeMap ([ref]$linkId) 21 0 35 4 "*"
    Add-Link $links $nodeMap ([ref]$linkId) 24 0 35 5 "*"
    Add-Link $links $nodeMap ([ref]$linkId) 11 0 35 6 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 34 0 35 7 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 14 0 35 8 "CLIP_VISION_OUTPUT"

    Add-Link $links $nodeMap ([ref]$linkId) 35 0 36 1 "CONDITIONING"
    Add-Link $links $nodeMap ([ref]$linkId) 35 1 36 2 "CONDITIONING"
    Add-Link $links $nodeMap ([ref]$linkId) 33 0 36 3 "*"
    Add-Link $links $nodeMap ([ref]$linkId) 35 2 40 4 "LATENT"
    Add-Link $links $nodeMap ([ref]$linkId) 36 0 40 1 "GUIDER"
    Add-Link $links $nodeMap ([ref]$linkId) 37 0 40 2 "SAMPLER"
    Add-Link $links $nodeMap ([ref]$linkId) 30 0 38 2 "*"
    Add-Link $links $nodeMap ([ref]$linkId) 39 0 40 0 "NOISE"
    Add-Link $links $nodeMap ([ref]$linkId) 38 0 40 3 "SIGMAS"
    Add-Link $links $nodeMap ([ref]$linkId) 40 0 41 0 "LATENT"

    Add-Link $links $nodeMap ([ref]$linkId) 45 0 46 0 "UPSCALE_MODEL"
    Add-Link $links $nodeMap ([ref]$linkId) 41 0 46 1 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 3 0 47 0 "INT"
    Add-Link $links $nodeMap ([ref]$linkId) 41 0 47 1 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 46 0 47 2 "IMAGE"
    Add-Link $links $nodeMap ([ref]$linkId) 47 0 48 0 "IMAGE"

    Set-Orders -Nodes $nodes

    return [ordered]@{
        id = [guid]::NewGuid().Guid
        revision = 0
        last_node_id = (($nodes | ForEach-Object { $_.id } | Measure-Object -Maximum).Maximum)
        last_link_id = $linkId - 1
        nodes = $nodes
        links = $links
        groups = @()
        config = @{}
        extra = [ordered]@{
            frontendVersion = "1.36.13"
            ds = [ordered]@{
                scale = 0.72
                offset = @(-180, 930)
            }
            VHS_latentpreview = $true
            VHS_latentpreviewrate = 0
            VHS_MetadataImage = $true
            VHS_KeepIntermediate = $false
        }
        version = 0.4
    }
}

$cleanupFiles = @(
    "WAN 2.1 FLF2V - RTX4080 - START-END - TEST.json",
    "WAN 2.1 FLF2V - RTX4080 - START-END - UPSCALE.json",
    "WAN 2.1 FLF2V - RTX4080 - LOOP - TEST.json",
    "WAN 2.1 FLF2V - RTX4080 - LOOP - UPSCALE.json",
    $fileName
)

foreach ($name in $cleanupFiles) {
    $path = Join-Path $targetDir $name
    if (Test-Path $path) {
        Remove-Item -Force $path
    }
}

$workflow = New-MasterWorkflow
$json = $workflow | ConvertTo-Json -Depth 25
[System.IO.File]::WriteAllText($filePath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $filePath"
