#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./fork-private-work keep|change\n"
             "Both processes start with a private variable whose value is 100.\n"
             "  keep    the child leaves its value unchanged\n"
             "  change  only the child changes its value to 200\n"
             "Output: child value, then parent value.\n"
             "The parent waits for the child to finish before printing.");
        return EXIT_SUCCESS;
    }
    if (argc != 2 || (strcmp(argv[1], "keep") != 0 && strcmp(argv[1], "change") != 0)) {
        fputs("Usage: ./fork-private-work keep|change\n", stderr);
        return EXIT_FAILURE;
    }

    int value = 100;
    pid_t child = fork();
    if (child < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }
    if (child == 0) {
        if (strcmp(argv[1], "change") == 0) value = 200;
        if (printf("child value=%d\n", value) < 0 || fflush(stdout) == EOF) {
            return EXIT_FAILURE;
        }
        return EXIT_SUCCESS;
    }

    int status;
    pid_t waited;
    do {
        waited = waitpid(child, &status, 0);
    } while (waited < 0 && errno == EINTR);
    if (waited < 0) {
        perror("waitpid");
        return EXIT_FAILURE;
    }
    if (!WIFEXITED(status) || WEXITSTATUS(status) != EXIT_SUCCESS) {
        fputs("Child did not finish successfully.\n", stderr);
        return EXIT_FAILURE;
    }
    if (printf("parent value=%d\n", value) < 0 || fflush(stdout) == EOF) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}