#define _GNU_SOURCE
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/syscall.h>
#include <unistd.h>

/* Linux/POSIX: real threads, with a controlled interleaving in split mode.
 * All overlapping accesses to count use the same mutex; there is no C data race.
 */
static pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_barrier_t rendezvous;
static int count = 0;
static int split = 0;

struct observation { char name; long pid, tid; int read, wrote; };

static void check(int error, const char *operation) {
    if (error) {
        fprintf(stderr, "%s: %s\n", operation, strerror(error));
        exit(EXIT_FAILURE);
    }
}

static void meet(void) {
    int error = pthread_barrier_wait(&rendezvous);
    if (error != PTHREAD_BARRIER_SERIAL_THREAD) check(error, "pthread_barrier_wait");
}

static void *increment(void *argument) {
    struct observation *o = argument;
    o->pid = (long)getpid();
    o->tid = syscall(SYS_gettid);
    meet(); /* Both real threads exist before either starts the update. */

    check(pthread_mutex_lock(&mutex), "pthread_mutex_lock");
    o->read = count;
    if (split) {
        check(pthread_mutex_unlock(&mutex), "pthread_mutex_unlock");
        meet(); /* Both threads have read the old value before either writes. */
        check(pthread_mutex_lock(&mutex), "pthread_mutex_lock");
    }
    o->wrote = o->read + 1;
    count = o->wrote;
    check(pthread_mutex_unlock(&mutex), "pthread_mutex_unlock");
    return NULL;
}

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./thread_counter whole|split\nwhole: lock the complete update\nsplit: lock read and write separately; synchronize after both reads");
        return EXIT_SUCCESS;
    }
    if (argc != 2 || (strcmp(argv[1], "whole") && strcmp(argv[1], "split"))) {
        fputs("Usage: ./thread_counter whole|split\n", stderr);
        return 2;
    }
    split = strcmp(argv[1], "split") == 0;
    pthread_t workers[2];
    struct observation records[2] = {{.name = 'A'}, {.name = 'B'}};
    check(pthread_barrier_init(&rendezvous, NULL, 2), "pthread_barrier_init");
    for (int i = 0; i < 2; ++i)
        check(pthread_create(&workers[i], NULL, increment, &records[i]), "pthread_create");
    for (int i = 0; i < 2; ++i)
        check(pthread_join(workers[i], NULL), "pthread_join");

    printf("mode=%s\n", argv[1]);
    /* Fixed display order, not a claim about the order in which threads ran. */
    for (int i = 0; i < 2; ++i) {
        struct observation *o = &records[i];
        printf("%c pid=%ld tid=%ld read=%d wrote=%d\n", o->name, o->pid, o->tid, o->read, o->wrote);
    }
    printf("joined=2; count=%d; expected=2\n", count);
    check(pthread_barrier_destroy(&rendezvous), "pthread_barrier_destroy");
    check(pthread_mutex_destroy(&mutex), "pthread_mutex_destroy");
    return EXIT_SUCCESS;
}
