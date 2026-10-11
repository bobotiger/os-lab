# 系统调用与内核控制

## 要判断什么

用户程序通过系统调用请求内核读写数据、创建进程或装入程序。观察每条记录的调用者、参数、返回值与错误，判断请求实际完成了什么。进入内核执行系统调用，不等于调度器选择了另一个进程。

## 准备程序和工具

需要 Ubuntu、GCC 和已有的 strace。先用 `strace -V` 检查工具。在 WSL Ubuntu-22.04 中使用 strace 5.16 核对这些命令；跟踪自己启动的程序不需要管理员权限。若系统安全策略禁止跟踪，会显示权限错误，不能据此认定参考程序的系统调用失败。

将 [读写参考程序](syscall-work.c)、任务四的 [参考程序](exec-reap-work.c) 与 [目标程序](exec-reap-target.c) 放在同一目录。已完成任务四可直接使用原有两个可执行程序。

```bash
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic -Werror syscall-work.c -o syscall-work
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic -Werror exec-reap-work.c -o exec-reap-work
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic -Werror exec-reap-target.c -o exec-reap-target
printf 'OS\n' > syscall-input.txt
```

样本是 O、S 和换行，共 3 字节。样本文件和以下跟踪文件会覆盖同名旧文件，请在自己的实验目录中运行。

## 1. 跟踪读写请求

```bash
strace -f -y -e trace=openat,read,write,close -o io.trace ./syscall-work syscall-input.txt
cat io.trace
```

终端中程序输出 `OS` 和换行，系统调用记录保存在 `io.trace`。`-y` 在有效文件描述符旁显示对应路径。文件描述符（fd）是进程访问已打开文件或通道的编号，1 是标准输出。

在记录中找到打开 syscall-input.txt 的 `openat` 行，记住它返回的编号，再追踪这个编号的读写与关闭，不要把程序装入期间读取共享库的记录当成样本读取。

下面摘录样本的实际读写记录，省去装入共享库等其他行。PID、路径、描述符编号与地址随运行环境变化。

```text
34974 openat(AT_FDCWD</tmp/oslab-syscalls-tuoROL>, "syscall-input.txt", O_RDONLY) = 3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>
34974 read(3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>, "OS\n", 8) = 3
34974 write(1</dev/pts/6>, "OS\n", 3)   = 3
34974 read(3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>, "", 8) = 0
34974 close(3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>) = 0
34974 read(3, 0x7ffe713dba70, 8)        = -1 EBADF (Bad file descriptor)
34974 write(3, "X", 1)                  = -1 EBADF (Bad file descriptor)
```

每行开头是调用者 PID；AT_FDCWD 表示相对当前工作目录打开文件，尖括号中是关联路径，/dev/pts/6 是本次终端。缓冲区是程序提供的一段内存，用于接收读入的数据。read 在成功后显示已读内容，失败时可能显示内存地址；write 的引号显示请求写入的内容。

比较五种结果：

- 对样本请求读取 8 字节，返回 3，只取得实际存在的 3 字节；请求大小不保证返回同样大小。
- 向标准输出写入这 3 字节，返回 3，表示这次接受了 3 字节。
- 再读样本返回 0，表示此时到达文件末尾，不是错误。
- 关闭样本描述符后，再用该编号读取，返回 `-1 EBADF`，表示无效文件描述符。
- 再用已关闭的编号写入，也返回 `-1 EBADF`；没有因此写入 X。

记录 `read(fd, "OS\n", 8) = 3` 中，8 是请求的最大字节数，3 是实际取得的字节数；引号中的内容是 strace 显示的已读数据。失败时可能显示缓冲区地址，不代表那里已经读到了数据。

## 2. 跟踪进程创建和程序替换

```bash
strace -f -e trace=%process,write -o replace.trace ./exec-reap-work replace
cat replace.trace
strace -f -e trace=%process,write -o missing.trace ./exec-reap-work missing
cat missing.trace
```

`-f` 跟踪子进程；`%process` 筛选进程相关系统调用，避免遗漏平台使用的创建接口。在本次 x86-64 Ubuntu 中，fork 的实际创建请求显示为 `clone`；其他运行环境可能显示 `clone3` 或 `fork`，应看调用者与返回的子进程 PID，而不是要求固定名称。

比较同一次运行中的三个位置：

1. 父进程的创建调用返回子进程 PID，后面的子进程记录使用该 PID。
2. 成功运行中，子进程 `execve("./exec-reap-target", ...) = 0` 后，仍由同一个 PID 输出 target；这里的 0 是 strace 对成功替换的显示，不表示原程序继续执行 exec 后面的语句。
3. 失败运行中，子进程 `execve("./exec-reap-no-such-target", ...) = -1 ENOENT`，随后由同一个 PID 输出 after failed exec。目标路径不存在，原程序可以处理错误后继续执行。

最开始装入 exec-reap-work 的 execve 是 strace 启动被跟踪程序的记录，不是要比较的子进程替换。记录中可能有 unfinished / resumed：它们是一次调用尚未记录返回、随后补上返回的两段显示，不是两次调用，也不能当成调度时间线。

目标程序退出码 7 与 execve 成功记录中的 0 含义不同：前者是程序退出状态，后者表示装入成功。

成功路径的关键行摘录：

```text
34978 clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x7e6a58a6aa10) = 34979
34979 write(1, "before exec: pid=34979 value=100"..., 33) = 33
34979 execve("./exec-reap-target", ["./exec-reap-target"], 0x7ffeb3c91b20 /* 22 vars */) = 0
34979 write(1, "target: pid=34979 value=300\ntarg"..., 43) = 43
```

失败路径的关键行摘录：

```text
34983 clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x71756d640a10) = 34984
34984 write(1, "before exec: pid=34984 value=100"..., 33) = 33
34984 execve("./exec-reap-no-such-target", ["./exec-reap-no-such-target"], 0x7ffd94583e80 /* 22 vars */) = -1 ENOENT (No such file or directory)
34984 write(1, "exec failed: ENOENT\n", 20) = 20
34984 write(1, "after failed exec: pid=34984 val"..., 55) = 55
```

execve 的参数包含目标路径、参数列表和环境变量地址；22 vars 是这次传入的环境变量数量。字符串后面的省略号表示显示被截短，不是只写入了可见部分。

## 3. 内核态与进程切换

内核态允许内核执行受保护的操作；用户态限制普通程序直接操作系统资源。系统调用进入内核处理调用进程的请求，完成后通常返回这个进程继续执行。exec 成功后则返回新程序的入口，原程序不会继续。

调度器选择另一个进程执行，才是进程切换。系统调用可能因等待数据而阻塞，也可能在处理期间遇到重新调度，但不能把每一行系统调用都数成一次进程切换。相同 PID 能说明这些请求属于同一进程，不能证明中途从未调度过其他进程。

## 4. 改变文件大小

保持程序每次最多读取 8 字节不变，另建一个含 OS123456 和换行的文件，共 9 字节，先判断两次 read 的返回值再核对。

```bash
printf 'OS123456\n' > syscall-long.txt
strace -f -y -e trace=openat,read,write,close -o long.trace ./syscall-work syscall-long.txt
cat long.trace
```

第一次返回 8，取得 OS123456；第二次返回 1，取得换行。程序只输出第一次读取的内容，所以终端没有换行。文件位置随实际读取向后移动，第二次 read 不一定到末尾；关闭后的两次 EBADF 不变。该对照已在相同 Ubuntu 环境中实际运行核对。

## 程序说明

读写参考程序的格式为 `./syscall-work FILE`。FILE 是当前目录或指定路径下可读取的文件；本任务使用 3 字节样本 syscall-input.txt。程序读取最多 8 字节，把第一次读到的数据写到标准输出，再读取一次，关闭文件，最后检查已关闭描述符的读写错误，自动结束。

如果改用大于 8 字节的文件，第一次只显示读到的第一段，第二次读取可能仍返回数据，不能套用样本的 EOF 结果。找不到文件或读写异常时程序返回失败；预期的两次 EBADF 被正确观察到时，程序返回 0。

```bash
./syscall-work --help
```

strace 常用选项：

| 选项 | 用途 |
| --- | --- |
| `-f` | 跟踪本次启动的进程及其子进程。 |
| `-y` | 为有效文件描述符显示关联路径。 |
| `-e trace=...` | 只显示指定系统调用；`%process` 是进程相关调用组。 |
| `-o FILE` | 将跟踪记录保存到 FILE，不与程序的标准输出混在一起。 |

任务四程序的 replace / missing 参数与原用法相同；这次使用跟踪记录分析接口，不改变程序行为。strace 会干预被跟踪程序的执行，因此不要把这些运行的耗时拿去与任务一测量比较。