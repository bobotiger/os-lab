# 程序替换与进程回收

## 这次要弄清楚什么

`fork()` 创建子进程；`exec` 系列接口让调用它的进程装入另一个程序。程序换了，是否就意味着进程编号也换了？子进程退出后，父进程还需要做什么？

两次运行只改变目标程序的路径。第一次使用编译好的目标程序，第二次使用不存在的路径。父进程都先观察子进程已经退出时的状态，再调用 `waitpid()` 收集退出状态并回收记录。

## 准备程序

将 [参考程序](exec-reap-work.c) 和 [目标程序](exec-reap-target.c) 放到 Ubuntu 的同一个实验目录，在该目录的 Bash 终端中编译：

```bash
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic -Werror exec-reap-work.c -o exec-reap-work
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic -Werror exec-reap-target.c -o exec-reap-target
```

需要已有的 GCC。后面的命令仍在这个目录中运行；目标路径相对于当前目录，不需要 `taskset`、管理员权限或额外输入。

## 1. 成功替换程序

```bash
./exec-reap-work replace
```

参考输出中的 PID 只是示例，每次运行以自己的输出为准：

```text
before exec: pid=25621 value=100
target: pid=25621 value=300
target: exit=7
before waitpid: pid=25621 state=Z
waitpid: pid=25621 exit=7
after waitpid: pid=25621 /proc entry=absent
second waitpid: ECHILD
```

先比较 `before exec` 与 `target` 的 PID：两者相同。再看程序中的变量值：原程序是 100，目标程序从自己的初值 300 开始执行。成功替换后，原程序不会继续执行 `exec` 后的语句，因此不会输出 `after failed exec`。

`exec` 替换当前进程的程序映像，即它执行的代码和程序内存内容；它不是再次创建进程。这里的进程仍是 `fork()` 创建的那个子进程。

## 2. 目标路径不存在

```bash
./exec-reap-work missing
```

当前目录中不能存在名为 `exec-reap-no-such-target` 的文件或目录，否则参考程序会拒绝本次运行。

```text
before exec: pid=25661 value=100
exec failed: ENOENT
after failed exec: pid=25661 value=100
child: exit=127
before waitpid: pid=25661 state=Z
waitpid: pid=25661 exit=127
after waitpid: pid=25661 /proc entry=absent
second waitpid: ECHILD
```

`ENOENT` 表示目标路径不存在。这次没有 `target` 输出，而是原程序继续输出 `after failed exec`，PID 和 value 都没有改变。找不到目标程序时，`exec` 返回错误，原程序仍然可以继续执行；随后退出码 127 是参考程序主动选择的，不是 `exec` 自动终止进程。

## 3. 区分退出与回收

两次输出中都比较下面三个位置：

- `before waitpid`：子进程已经退出，但仍能读到状态 `Z`。`Z` 是僵尸状态，表示程序不再执行，内核仍保存退出状态等记录，等待父进程收集。
- `waitpid`：父进程等待指定子进程，返回的 PID 是该子进程；输出中的 `exit` 是从退出状态中取得的退出码。
- `after waitpid` 与 `second waitpid`：回收后紧接着检查该 PID 的 `/proc` 目录，本次已不存在；再次等待同一个子进程得到 `ECHILD`，表示没有可等待的对应子进程。

本实验调用 `waitpid()` 时，子进程已经退出，因此可以直接收集退出状态。如果子进程还没有退出，就调用本实验使用的等待接口，父进程会暂停执行，直到指定子进程退出。

子进程退出时会释放程序内存等资源，不是把整个程序一直留在内存里。回收处理的是保留的退出记录。仅仅多等一段时间，并不会代替父进程调用等待接口。

PID 可以被后续新进程重新使用，因此 `/proc` 目录不存在是本次紧接回收的观察，不是这个数字从此永远不存在。第二次等待的 `ECHILD` 针对父进程与子进程的关系。

目标程序故意返回 7，因此退出码非零不代表 `exec` 失败。是否成功替换，应结合 `target` 输出、相同 PID 和是否继续执行原程序判断。目标程序的变量值是 300，父进程取得的退出码是 7；等待接口传回的是退出状态，不是子进程的普通变量。

## 程序说明

运行格式为 `./exec-reap-work MODE`，把 MODE 换成下面的模式参数：

| 参数 | 用途 |
| --- | --- |
| `replace` | 装入当前目录中的 `exec-reap-target`；目标程序输出自己的 PID 与变量初值，退出码为 7。 |
| `missing` | 尝试装入不存在的 `exec-reap-no-such-target`；原程序在失败后继续输出，并以 127 退出。 |
| `--help` | 显示用法，不创建子进程。 |

```bash
./exec-reap-work --help
```

输出顺序固定为子进程的程序记录、回收前状态、等待结果、回收后检查。PID 每次可能不同。程序自动完成，不接受交互命令；参考程序成功完成观察时自身返回 0，即使实验中的子进程退出码是 7 或 127。缺少、未知或多余参数会显示用法并返回失败。

`replace` 若找不到编译好的目标程序，也会输出替换失败；应先检查是否编译了两份源码，以及终端是否仍在同一个目录中。