#ifndef QWEN2VL_H
#define QWEN2VL_H

#include "qwen2vl-lib.h"

void Qwen2VL_init(
    const char* model,
    const char* mmproj,
    const char* system_prompt,
    unsigned int ctx_size,
    float temp,
    int top_k,
    float top_p,
    int n_predict,
    int verbosity_level
);

void Qwen2VL_chat(char* prompt);

void Qwen2VL_get_response(char* response);

void Qwen2VL_del();

#endif
