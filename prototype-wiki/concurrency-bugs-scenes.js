/* The movie uses selected real states; timing is for observation, not CPU time. */
(() => {
  'use strict';
  function build(kind, variant, order) {
    const atomic = kind === 'atomicity', safe = variant === 'safe', first = order === 'first';
    const frames = atomic ? OSLabConcurrencyBugs.atomicity(variant, first ? 'interleaved' : 'serial') : OSLabConcurrencyBugs.ordering(variant, first ? 'consumerFirst' : 'producerFirst');
    const find = (actor, op) => frames.findIndex(s => s.actor === actor && s.op === op);
    const last = frames.length - 1;
    const scene = (id, frame, duration, title, note, focus = '', motion = '') => ({id, frame, duration, title, note, focus, motion});
    let scenes;
    if (atomic) {
      scenes = [scene('start', 0, 1100, '只有一项任务，A 和 B 都准备取走', safe ? '检查和取走连续持锁，另一个线程必须在外等待。' : '每次检查、取走都加锁，但两次操作之间会释放锁。', 'queue')];
      scenes.push(scene('check-a', find('A','check'), 1600, safe ? 'A 检查时有任务，继续持锁取走' : 'A 检查到队列有任务，但尚未取走', safe ? '锁仍由 A 持有，B 暂时不能检查队列。' : '检查后会释放锁，B 随后也可以检查队列。', 'A'));
      if (!safe && first) scenes.push(scene('check-b', find('B','check'), 1900, 'B 也检查到队列有任务，保存检查结果', 'A、B 检查到的是队列中的同一项任务；此时两个线程都还没有取走任务。', 'B'));
      scenes.push(scene('take-a', find('A','take'), 2400, !safe && first ? 'A 已取走任务，B 的旧判断失效' : '唯一的任务已交给 A', safe ? 'A 完成取走之前一直持锁，B 尚未检查队列。' : first ? '队列已经空了，B 保存的“有任务”却没有随之改变。' : 'B 还没有检查；A 先完成了取走。', 'transfer', 'take'));
      scenes.push(scene('result', last, 0, !safe && first ? 'B 取任务失败：唯一的任务已被 A 取走' : 'B 检查到空队列，跳过取走', safe ? '把检查和取走放在同一个临界区内，判断不会被中途插入的修改破坏。' : first ? 'B 释放锁后，A 获得锁并取走了任务。B 随后重新获得锁，却仍按先前的检查结果尝试取任务。' : '这次 B 检查得晚，所以没有出错；交替执行仍会暴露分别加锁的漏洞。', !safe && first ? 'error' : 'B'));
    } else {
      scenes = [scene('start', 0, 1100, 'B 负责准备配置，A 需要读取配置', safe ? 'A 会先检查完成条件：没准备好就释放锁并等待。' : 'A、B 使用同一把锁，但没有约定谁先完成。', 'queue')];
      if (first && !safe) {
        scenes.push(scene('lock-a', find('A','lock'), 2000, 'A 拿到了锁，配置却还没准备好', '锁只排斥同时访问，不能替 B 完成初始化。', 'A'));
        scenes.push(scene('result', last, 0, 'A 提前使用：读到的仍是未初始化的配置', '需要先确认初始化完成。持有锁本身不能保证数据已经可用。', 'error'));
      } else {
        if (first) scenes.push(scene('wait-a', find('A','wait'), 2100, '配置还没准备好，A 让出锁等待', 'A 暂停使用配置，释放锁，让 B 进入并完成初始化。', 'A'));
        scenes.push(scene('init-b', find('B','init'), 2300, 'B 已把配置写好：42', '配置写入完成后，ready 变为 true，记录“已经准备好”。', 'transfer', 'write'));
        if (first) scenes.push(scene('notify-a', find('B','unlock'), 1800, 'B 发出通知并释放锁，A 可以重新争取锁', '通知没有把锁交给 A；A 此时还没有重新检查，也没有使用配置。', 'A'));
        scenes.push(scene('result', last, 0, safe ? 'A 确认配置已就绪，再读取 42' : 'B 先初始化，这次 A 读到了 42', safe ? first ? 'A 在 wait 返回时重新持有锁，检查 ready = true 后再使用配置。' : '完成条件已经成立，A 无须等待；先前有没有收到通知都不影响这次检查。' : '这次成功是因为 B 先准备好了配置。换成 A 先使用，仅有互斥锁就不够。', 'A', 'read'));
      }
    }
    if (scenes.some(s => s.frame < 0)) throw new Error('Missing concurrency animation state');
    let time = 0;
    scenes.forEach(s => { s.start = time; time += s.duration; });
    return {kind, variant, order, frames, scenes, duration: time + 900};
  }
  globalThis.OSLabConcurrencyBugScenes = Object.freeze({build});
})();
