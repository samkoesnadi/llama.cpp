add_library(llava OBJECT
            llava.cpp
            llava.h
            clip.cpp
            clip.h
            qwen2vl-lib.cpp
            qwen2vl-lib.h
            )

target_link_libraries(llava PRIVATE ggml common llama ${CMAKE_THREAD_LIBS_INIT})

target_include_directories(llava PUBLIC .)
target_include_directories(llava PUBLIC ../..)
target_include_directories(llava PUBLIC ../../common)

target_compile_features(llava PRIVATE cxx_std_17)

# Support Android 15 16k page size.
target_link_options(llava PRIVATE "-Wl,-z,max-page-size=16384")

add_library(llava_static STATIC $<TARGET_OBJECTS:llava>)
if (BUILD_SHARED_LIBS)
    set_target_properties(llava PROPERTIES POSITION_INDEPENDENT_CODE ON)
    target_compile_definitions(llava PRIVATE LLAMA_SHARED LLAMA_BUILD)
    add_library(llava_shared SHARED $<TARGET_OBJECTS:llava>)
    target_link_libraries(llava_shared PRIVATE ggml common llama ${CMAKE_THREAD_LIBS_INIT})
    install(TARGETS llava_shared LIBRARY)
endif()

if (NOT MSVC)
    target_compile_options(llava PRIVATE -Wno-cast-qual) # stb_image.h
endif()

if(TARGET BUILD_INFO)
    add_dependencies(llava BUILD_INFO)
endif()

set(TARGET llama-llava-cli)
add_executable(${TARGET} llava-cli.cpp)
set_target_properties(${TARGET} PROPERTIES OUTPUT_NAME llama-llava-cli)
install(TARGETS ${TARGET} RUNTIME)
target_link_libraries(${TARGET} PRIVATE common llava ${CMAKE_THREAD_LIBS_INIT})
target_compile_features(${TARGET} PRIVATE cxx_std_17)

set(TARGET llama-minicpmv-cli)
add_executable(${TARGET} minicpmv-cli.cpp)
set_target_properties(${TARGET} PROPERTIES OUTPUT_NAME llama-minicpmv-cli)
install(TARGETS ${TARGET} RUNTIME)
target_link_libraries(${TARGET} PRIVATE common llava ${CMAKE_THREAD_LIBS_INIT})
target_compile_features(${TARGET} PRIVATE cxx_std_17)

set(TARGET llama-qwen2vl-cli)
add_executable(${TARGET} qwen2vl-cli.cpp)
set_target_properties(${TARGET} PROPERTIES OUTPUT_NAME llama-qwen2vl-cli)
install(TARGETS ${TARGET} RUNTIME)
target_link_libraries(${TARGET} PRIVATE common llava ${CMAKE_THREAD_LIBS_INIT})
target_compile_features(${TARGET} PRIVATE cxx_std_17)

# set(TARGET llama-qwen2vl-lib-test)
# add_executable(${TARGET} qwen2vl-lib-test.c)
# set_target_properties(${TARGET} PROPERTIES OUTPUT_NAME llama-qwen2vl-lib-test)
# install(TARGETS ${TARGET} RUNTIME)
# target_link_libraries(${TARGET} PRIVATE common llava ${CMAKE_THREAD_LIBS_INIT})
# target_compile_features(${TARGET} PRIVATE cxx_std_17)

set(TARGET llama-llava-clip-quantize-cli)
add_executable(${TARGET} clip-quantize-cli.cpp)
set_target_properties(${TARGET} PROPERTIES OUTPUT_NAME llama-llava-clip-quantize-cli)
install(TARGETS ${TARGET} RUNTIME)
target_link_libraries(${TARGET} PRIVATE common llava ${CMAKE_THREAD_LIBS_INIT})
target_compile_features(${TARGET} PRIVATE cxx_std_17)
