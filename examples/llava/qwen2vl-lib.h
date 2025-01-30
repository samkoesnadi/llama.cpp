#ifndef QWEN2VL_H
#define QWEN2VL_H

#include "qwen2vl-lib.h"

void Qwen2VL_init(
    const char* model,
    const char* mmproj,
    const char* system_prompt,
    unsigned int ctx_size = 4096,
    float temp = 0.8,
    int top_k = 40,
    float top_p = 0.9,
    int n_predict = -1,
    int verbosity_level = -100
);

void Qwen2VL_chat(char* prompt);

void Qwen2VL_get_response(char* response);

void Qwen2VL_del();

#endif
