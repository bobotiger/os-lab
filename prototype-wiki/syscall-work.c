#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    if (argc == 2 && strcmp(argv[1], "--help") == 0) {
        puts("Usage: ./syscall-work FILE\n"
             "Open FILE read-only and request up to 8 bytes.\n"
             "Write the first read result to standard output.\n"
             "Read again, close the file, then try read and write on the closed fd.\n"
             "Use a 3-byte file containing OS followed by a newline for this task.\n"
             "Expected closed-fd failures do not make this program fail.");
        return EXIT_SUCCESS;
    }
    if (argc != 2) {
        fputs("Usage: ./syscall-work FILE\n", stderr);
        return EXIT_FAILURE;
    }
    int descriptor = open(argv[1], O_RDONLY);
    if (descriptor < 0) {
        perror("open");
        return EXIT_FAILURE;
    }
    char buffer[8];
    ssize_t received = read(descriptor, buffer, sizeof(buffer));
    if (received < 0) {
        perror("read");
        close(descriptor);
        return EXIT_FAILURE;
    }
    if (write(STDOUT_FILENO, buffer, (size_t)received) != received) {
        fputs("Could not write the read result.\n", stderr);
        close(descriptor);
        return EXIT_FAILURE;
    }
    if (read(descriptor, buffer, sizeof(buffer)) < 0) {
        perror("second read");
        close(descriptor);
        return EXIT_FAILURE;
    }
    if (close(descriptor) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    errno = 0;
    if (read(descriptor, buffer, sizeof(buffer)) != -1 || errno != EBADF) {
        fputs("Expected EBADF when reading the closed descriptor.\n", stderr);
        return EXIT_FAILURE;
    }
    errno = 0;
    if (write(descriptor, "X", 1) != -1 || errno != EBADF) {
        fputs("Expected EBADF when writing the closed descriptor.\n", stderr);
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}