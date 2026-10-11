#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <unistd.h>

int main(void)
{
    int value = 300;
    if (printf("target: pid=%ld value=%d\ntarget: exit=7\n",
               (long)getpid(), value) < 0 || fflush(stdout) == EOF) {
        return 1;
    }
    return 7;
}