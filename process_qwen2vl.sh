#!/bin/bash

set -e

SOURCE_PATH=$1
TARGET_PATH="Qwen2-VL-2B-Instruct-Q4_K_M.gguf"
TARGET_PATH_VISION="mmproj-Qwen2-VL-2B-Instruct-q4_1.gguf"

UNQUANTIZE_LLM_TARGET_PATH=$(mktemp).gguf

python examples/llava/qwen2_vl_surgery.py $SOURCE_PATH
python convert_hf_to_gguf.py $SOURCE_PATH --outfile $UNQUANTIZE_LLM_TARGET_PATH --outtype f32

export LD_LIBRARY_PATH=./install/lib
./install/bin/llama-imatrix -m $UNQUANTIZE_LLM_TARGET_PATH -f ../../../../assets/calibration_datav3.txt
./install/bin/llama-quantize $UNQUANTIZE_LLM_TARGET_PATH $TARGET_PATH Q4_K_M

./install/bin/llama-llava-clip-quantize-cli $(basename $SOURCE_PATH)-vision.gguf $TARGET_PATH_VISION 3
