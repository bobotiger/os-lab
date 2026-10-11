#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static int collect_child(pid_t child, int *status)
{
    pid_t result;
    do {
        result = waitpid(child, status, 0);
    } while (result < 0 && errno == EINTR);
    return result == child ? 0 : -1;
}

static int read_state(pid_t child, char *state)
{
    char path[64];
    char line[512];
    snprintf(path, sizeof(path), "/proc/%ld/status", (long)child);
    FILE *input = fopen(path, "r");
    if (input == NULL) return errno == ENOENT ? 0 : -1;
    while (fgets(line, sizeof(line), input) != NULL) {
        if (sscanf(line, "State: %c", state) == 1) {
            fclose(input);
            return 1;
        }
    }
    fclose(input);
    return -1;
}

int main(int argc, char **argv)
{
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./exec-reap-work replace|missing\n"
             "Run from the directory containing both compiled programs.\n"
             "  replace  execute ./exec-reap-target (exit code 7)\n"
             "  missing  execute ./exec-reap-no-such-target (must not exist)\n"
             "A failed exec returns to the old program; that child exits 127.\n"
             "The parent observes the exited child without reaping it,\n"
             "reads its /proc state, then collects it with waitpid.\n"
             "A second waitpid checks that no exit status remains.");
        return EXIT_SUCCESS;
    }
    if (argc != 2 || (strcmp(argv[1], "replace") != 0 && strcmp(argv[1], "missing") != 0)) {
        fputs("Usage: ./exec-reap-work replace|missing\n", stderr);
        return EXIT_FAILURE;
    }
    const char *target = strcmp(argv[1], "replace") == 0
        ? "./exec-reap-target" : "./exec-reap-no-such-target";
    if (strcmp(argv[1], "missing") == 0 && access(target, F_OK) == 0) {
        fputs("Remove or rename ./exec-reap-no-such-target before this experiment.\n", stderr);
        return EXIT_FAILURE;
    }

    pid_t child = fork();
    if (child < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }
    if (child == 0) {
        int value = 100;
        if (printf("before exec: pid=%ld value=%d\n", (long)getpid(), value) < 0 || fflush(stdout) == EOF) {
            return EXIT_FAILURE;
        }
        execl(target, target, (char *)NULL);
        int exec_error = errno;
        printf("exec failed: %s\n", exec_error == ENOENT ? "ENOENT" : strerror(exec_error));
        printf("after failed exec: pid=%ld value=%d\nchild: exit=127\n", (long)getpid(), value);
        return 127;
    }

    siginfo_t information;
    int observed;
    do {
        observed = waitid(P_PID, (id_t)child, &information, WEXITED | WNOWAIT);
    } while (observed < 0 && errno == EINTR);
    int status;
    if (observed < 0) {
        perror("waitid");
        collect_child(child, &status);
        return EXIT_FAILURE;
    }
    char state;
    int present = read_state(child, &state);
    if (present != 1 || state != 'Z') {
        fputs("Could not observe the exited child's Z state.\n", stderr);
        collect_child(child, &status);
        return EXIT_FAILURE;
    }
    printf("before waitpid: pid=%ld state=%c\n", (long)child, state);
    if (collect_child(child, &status) < 0) {
        perror("waitpid");
        return EXIT_FAILURE;
    }
    if (!WIFEXITED(status)) {
        fputs("Child did not exit normally.\n", stderr);
        return EXIT_FAILURE;
    }
    printf("waitpid: pid=%ld exit=%d\n", (long)child, WEXITSTATUS(status));
    present = read_state(child, &state);
    if (present < 0) {
        fputs("Could not check /proc after waitpid.\n", stderr);
        return EXIT_FAILURE;
    }
    if (present == 0) {
        printf("after waitpid: pid=%ld /proc entry=absent\n", (long)child);
    } else {
        printf("after waitpid: pid=%ld /proc entry=present state=%c\n", (long)child, state);
    }
    pid_t repeated = waitpid(child, &status, WNOHANG);
    if (repeated != -1 || errno != ECHILD) {
        fputs("Unexpected result from the second waitpid.\n", stderr);
        return EXIT_FAILURE;
    }
    puts("second waitpid: ECHILD");
    return fflush(stdout) == EOF ? EXIT_FAILURE : EXIT_SUCCESS;
}