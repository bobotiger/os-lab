#!/usr/bin/env python3
"""OSLab deterministic concurrency exercises; no real threads are created.

Run with Python 3.8+; no third-party packages required. Each printed operation
is one abstract step. Output is independent of the host OS scheduler and GIL.
"""
import argparse


def updates(order):
    count = 0
    registers = {"A": None, "B": None}
    pcs = {"A": 0, "B": 0}
    if len(order) != 6 or order.count("A") != 3 or order.count("B") != 3:
        raise ValueError("order must contain exactly three A and three B")
    print("initial count=0; expected=2")
    for who in order:
        pc = pcs[who]
        if pc == 0:
            registers[who] = count
            action = "read"
        elif pc == 1:
            registers[who] += 1
            action = "add"
        else:
            count = registers[who]
            action = "write"
        pcs[who] += 1
        print(f"{who} {action:<5} local={registers[who]} shared={count}")
    print(f"final count={count}; expected=2")


def locks(policy, schedule):
    owners = {"L1": None, "L2": None}
    pcs = {"A": 0, "B": 0}
    waiting = {"A": None, "B": None}
    completed = 0
    for turn in range(50):
        if pcs["A"] == pcs["B"] == 5:
            break
        who = ("A" if pcs["A"] < 5 else "B") if schedule == "serial" else "AB"[turn % 2]
        if pcs[who] == 5 or (waiting[who] and owners[waiting[who]]):
            continue
        first, second = ("L2", "L1") if who == "B" and policy == "opposite" else ("L1", "L2")
        op, key = [("lock", first), ("lock", second), ("work", None), ("unlock", second), ("unlock", first)][pcs[who]]
        if op == "lock" and owners[key]:
            waiting[who] = key
            print(f"{who} waits for {key} held by {owners[key]}")
        else:
            if op == "lock":
                owners[key] = who
                waiting[who] = None
            elif op == "unlock":
                owners[key] = None
            else:
                completed += 1
            pcs[who] += 1
            print(f"{who} {op}" + (f" {key}" if key else ""))
        if all(waiting[t] and owners[waiting[t]] for t in ("A", "B")):
            print(f"deadlock=yes; completed={completed}/2")
            return
    print(f"deadlock=no; completed={completed}/2")


def events(mode, delay):
    print(f"A arrives=0; B arrives=1; I/O delay={delay}")
    end = delay + (3 if mode == "blocking" else 2)
    done = {}
    for t in range(end):
        if t == 0:
            action = "A submits I/O"
        elif (mode == "async" and t == 1) or (mode == "blocking" and t == delay + 2):
            action = "B completes"
            done["B"] = t + 1
        elif t == delay + 1:
            action = "A resumes and completes"
            done["A"] = t + 1
        else:
            action = "loop blocked" if mode == "blocking" else "loop idle; I/O pending"
        print(f"[{t},{t+1}) {action}")
    print(f"completed A={done['A']}; B={done['B']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="exercise", required=True)
    update = sub.add_parser("updates", help="two three-step counter updates")
    update.add_argument("--order", default="ABABAB", help="exactly three A and three B")
    lock = sub.add_parser("locks", help="two threads acquiring two locks")
    lock.add_argument("--policy", choices=["opposite", "ordered"], default="opposite")
    lock.add_argument("--schedule", choices=["interleaved", "serial"], default="interleaved")
    event = sub.add_parser("events", help="one event loop and two requests")
    event.add_argument("--mode", choices=["blocking", "async"], default="blocking")
    event.add_argument("--delay", type=int, choices=[4, 8], default=4)
    args = parser.parse_args()
    if args.exercise == "updates":
        try:
            updates(args.order)
        except ValueError as error:
            parser.error(str(error))
    elif args.exercise == "locks":
        locks(args.policy, args.schedule)
    else:
        events(args.mode, args.delay)


if __name__ == "__main__":
    main()
