#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static double seconds(clockid_t clock_id)
{
    struct timespec value;
    if (clock_gettime(clock_id, &value) != 0) {
        perror("clock_gettime");
        exit(EXIT_FAILURE);
    }
    return (double)value.tv_sec + (double)value.tv_nsec / 1000000000.0;
}

int main(int argc, char **argv)
{
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./cpu-sharing-work NAME [ITERATIONS_PER_BATCH]\n"
             "Run 24 equal computation batches; default: 40000000 iterations per batch.\n"
             "Output JSON lines: name, batch (0..24), monotonic timestamp,\n"
             "elapsed wall seconds, checksum.\n"
             "Use the same iteration count for every comparison.");
        return EXIT_SUCCESS;
    }
    if (argc < 2 || argc > 3) {
        fputs("Usage: ./cpu-sharing-work NAME [ITERATIONS_PER_BATCH]\n", stderr);
        return EXIT_FAILURE;
    }
    if (strspn(argv[1], "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-") != strlen(argv[1]) || argv[1][0] == '\0') {
        fputs("NAME must contain only ASCII letters, digits, underscores or hyphens.\n", stderr);
        return EXIT_FAILURE;
    }
    uint64_t iterations = 40000000;
    if (argc == 3) {
        char *end;
        errno = 0;
        unsigned long long parsed = strtoull(argv[2], &end, 10);
        if (errno != 0 || *end != '\0' || argv[2][0] == '\0' || argv[2][0] == '-' || parsed < 1 || parsed > 1000000000ULL) {
            fputs("ITERATIONS_PER_BATCH must be an integer from 1 to 1000000000.\n", stderr);
            return EXIT_FAILURE;
        }
        iterations = (uint64_t)parsed;
    }
    uint64_t checksum = 1;
    double start = seconds(CLOCK_MONOTONIC);
    for (unsigned int batch = 0; batch <= 24; ++batch) {
        if (batch != 0) {
            for (uint64_t iteration = 0; iteration < iterations; ++iteration) {
                checksum = checksum * UINT64_C(6364136223846793005) + UINT64_C(1442695040888963407);
            }
        }
        double timestamp = seconds(CLOCK_MONOTONIC);
         printf("{\"name\":\"%s\",\"batch\":%u,\"timestamp\":%.6f,\"wall\":%.6f,\"checksum\":\"%" PRIu64 "\"}\n",
             argv[1], batch, timestamp, timestamp - start, checksum);
        fflush(stdout);
    }
    return EXIT_SUCCESS;
}