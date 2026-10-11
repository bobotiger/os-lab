#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

typedef struct {
    char state;
    unsigned long long ticks;
} Snapshot;

static volatile sig_atomic_t interrupted = 0;

static void interrupt_handler(int signal_number)
{
    (void)signal_number;
    interrupted = 1;
}

static void compute(void)
{
    volatile uint64_t value = 1;
    for (;;) {
        value = value * UINT64_C(6364136223846793005) + UINT64_C(1442695040888963407);
    }
}

static double monotonic_seconds(void)
{
    struct timespec value;
    if (clock_gettime(CLOCK_MONOTONIC, &value) != 0) {
        perror("clock_gettime");
        exit(EXIT_FAILURE);
    }
    return (double)value.tv_sec + (double)value.tv_nsec / 1000000000.0;
}

static int snapshot(pid_t pid, Snapshot *result)
{
    char path[64];
    char record[4096];
    snprintf(path, sizeof(path), "/proc/%ld/stat", (long)pid);
    FILE *file = fopen(path, "r");
    if (file == NULL) return -1;
    char *read_result = fgets(record, sizeof(record), file);
    fclose(file);
    if (read_result == NULL) return -1;
    char *end_name = strrchr(record, ')');
    if (end_name == NULL) return -1;
    char *context;
    char *token = strtok_r(end_name + 1, " ", &context);
    result->ticks = 0;
    for (unsigned int field = 3; field <= 15; ++field) {
        if (token == NULL) return -1;
        if (field == 3) result->state = token[0];
        if (field == 14 || field == 15) {
            char *end;
            errno = 0;
            unsigned long long ticks = strtoull(token, &end, 10);
            if (errno != 0 || *end != '\0') return -1;
            result->ticks += ticks;
        }
        token = strtok_r(NULL, " ", &context);
    }
    return 0;
}

static void observe(pid_t first, pid_t second, long ticks_per_second)
{
    Snapshot before[2];
    Snapshot after[2];
    pid_t pids[2] = {first, second};
    double start = monotonic_seconds();
    for (unsigned int index = 0; index < 2; ++index) {
        if (snapshot(pids[index], &before[index]) != 0) {
            fputs("Cannot read child process state.\n", stderr);
            interrupted = 1;
            return;
        }
    }
    struct timespec remaining = {1, 0};
    while (nanosleep(&remaining, &remaining) != 0) {
        if (errno != EINTR || interrupted) return;
    }
    for (unsigned int index = 0; index < 2; ++index) {
        if (snapshot(pids[index], &after[index]) != 0) {
            fputs("Cannot read child process state.\n", stderr);
            interrupted = 1;
            return;
        }
    }
    printf("OBSERVE elapsed=%.3f s\n", monotonic_seconds() - start);
    puts("NAME  PID       BEFORE AFTER CPU_DELTA(s)");
    for (unsigned int index = 0; index < 2; ++index) {
        printf("%c     %-9ld %c      %c     %.3f\n", index == 0 ? 'A' : 'B',
               (long)pids[index], before[index].state, after[index].state,
               (double)(after[index].ticks - before[index].ticks) / (double)ticks_per_second);
    }
}

static void cleanup(pid_t first, pid_t second, int writer)
{
    close(writer);
    pid_t pids[2] = {first, second};
    for (unsigned int index = 0; index < 2; ++index) {
        if (pids[index] > 0) {
            kill(pids[index], SIGTERM);
            kill(pids[index], SIGCONT);
            while (waitpid(pids[index], NULL, 0) < 0 && errno == EINTR) {}
        }
    }
}

int main(int argc, char **argv)
{
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./process-state-work\n"
             "A continuously computes. B waits for one byte from a pipe, then computes.\n"
             "Commands (one per line):\n"
             "  observe  sample R/S/T state and CPU-time increase over about 1 second\n"
             "  send     send one byte to B (once)\n"
             "  stop     pause A with SIGSTOP\n"
             "  resume   continue A with SIGCONT\n"
             "  quit     terminate and reap both children\n"
             "EOF or Ctrl+C also cleans up both children. CPU time is read from /proc.\n"
             "R includes running and ready; S is interruptible sleep; T is stopped.");
        return EXIT_SUCCESS;
    }
    if (argc != 1) {
        fputs("Usage: ./process-state-work [--help]\n", stderr);
        return EXIT_FAILURE;
    }
    long ticks_per_second = sysconf(_SC_CLK_TCK);
    if (ticks_per_second <= 0) return EXIT_FAILURE;
    struct sigaction action = {0};
    action.sa_handler = interrupt_handler;
    sigemptyset(&action.sa_mask);
    if (signal(SIGPIPE, SIG_IGN) == SIG_ERR) {
        perror("signal");
        return EXIT_FAILURE;
    }
    if (sigaction(SIGINT, &action, NULL) != 0 || sigaction(SIGTERM, &action, NULL) != 0) {
        perror("sigaction");
        return EXIT_FAILURE;
    }
    int notification[2];
    if (pipe(notification) != 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }
    pid_t first = fork();
    if (first == 0) {
        signal(SIGINT, SIG_DFL);
        signal(SIGTERM, SIG_DFL);
        if (interrupted) _exit(EXIT_SUCCESS);
        close(notification[0]);
        close(notification[1]);
        compute();
        _exit(EXIT_SUCCESS);
    }
    if (first < 0) {
        perror("fork");
        close(notification[0]);
        close(notification[1]);
        return EXIT_FAILURE;
    }
    pid_t second = fork();
    if (second == 0) {
        signal(SIGINT, SIG_DFL);
        signal(SIGTERM, SIG_DFL);
        if (interrupted) _exit(EXIT_SUCCESS);
        close(notification[1]);
        char byte;
        ssize_t count;
        do { count = read(notification[0], &byte, 1); } while (count < 0 && errno == EINTR);
        close(notification[0]);
        if (count == 1) compute();
        _exit(count < 0 ? EXIT_FAILURE : EXIT_SUCCESS);
    }
    close(notification[0]);
    if (second < 0) {
        perror("fork");
        cleanup(first, -1, notification[1]);
        return EXIT_FAILURE;
    }
    setvbuf(stdout, NULL, _IOLBF, 0);
    printf("READY A=%ld B=%ld\n", (long)first, (long)second);
    puts("Commands: observe / send / stop / resume / quit");
    char command[80];
    int sent = 0;
    int failed = 0;
    while (!interrupted) {
        fputs("state> ", stdout);
        fflush(stdout);
        if (fgets(command, sizeof(command), stdin) == NULL) break;
        command[strcspn(command, "\r\n")] = '\0';
        if (strcmp(command, "quit") == 0) break;
        if (strcmp(command, "observe") == 0) observe(first, second, ticks_per_second);
        else if (strcmp(command, "send") == 0) {
            if (sent) puts("Notification already sent. B is no longer waiting for pipe data.");
            else if (write(notification[1], "x", 1) == 1) {
                sent = 1;
                puts("SENT one byte to B. Use observe to check B's state.");
            } else { perror("write"); failed = 1; break; }
        } else if (strcmp(command, "stop") == 0 || strcmp(command, "resume") == 0) {
            int signal_number = strcmp(command, "stop") == 0 ? SIGSTOP : SIGCONT;
            if (kill(first, signal_number) != 0) { perror("kill"); failed = 1; break; }
            printf("%s sent to A. Use observe to check A's state.\n", signal_number == SIGSTOP ? "SIGSTOP" : "SIGCONT");
        } else puts("Unknown command. Use observe / send / stop / resume / quit.");
    }
    cleanup(first, second, notification[1]);
    puts("DONE: A and B terminated and reaped.");
    return failed ? EXIT_FAILURE : EXIT_SUCCESS;
}