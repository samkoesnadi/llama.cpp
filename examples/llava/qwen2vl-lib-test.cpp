#include "qwen2vl-lib.h"

#include <stdio.h>
#include <stdlib.h>


int main(int argc, char ** argv) {
    unsigned MAX_TOKEN = 1024;

    char *prompt;

    Qwen2VL_init(
        "/home/sami/Documents/projects/technology-robot/third-party/llama.cpp/tmp/Qwen2-VL-2B-Instruct-Q4_K_L.gguf",
        "/home/sami/Documents/projects/technology-robot/third-party/llama.cpp/tmp/mmproj-Qwen2-VL-2B-Instruct-f16.gguf",
        "You are a helpful assistant.",
        4096,
        0.8,
        40,
        0.9,
        1024,
        -100
    );

    prompt = (char*) calloc(MAX_TOKEN, sizeof(char));
    Qwen2VL_chat_init(prompt);
    free(prompt);

    char* next_token = (char*) calloc(MAX_TOKEN, sizeof(char));
    int ret = 0;
    while (ret == 0) {
        ret = Qwen2VL_predict_next_token(next_token);
    }
    free(next_token);

    Qwen2VL_chat_final();

    Qwen2VL_del();

    return 0;
}
