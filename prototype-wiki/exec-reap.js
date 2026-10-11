(function () {
  const modes = {
    replace: {pid:'25621', program:'exec-reap-target', value:'300', exit:'7', title:'成功替换：PID 不变，开始执行目标程序', reason:'子进程装入目标程序，使用它的代码和内存。原程序不再继续执行 exec 后的语句。', evidence:'target: pid=25621 value=300'},
    missing: {pid:'25661', program:'exec-reap-work', value:'100', exit:'127', title:'替换失败：PID 不变，原程序继续执行', reason:'目标路径不存在，exec 返回 ENOENT。子进程仍执行原程序，value 仍为 100。', evidence:'exec failed: ENOENT\nafter failed exec: pid=25661 value=100'},
  };
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  function render() {
    const mode = modes[document.getElementById('demo-mode').value];
    const index = Number(document.querySelector('input[name="stage"]:checked').value);
    const stages = [
      {title:'调用 exec 前：子进程执行原程序', reason:'fork 已创建子进程，它在原程序中读取 value，值为 100。此时还没有装入目标程序。', program:'exec-reap-work', value:'100', status:'正在执行原程序。', record:'尚未退出。', evidence:`before exec: pid=${mode.pid} value=100`},
      {title:mode.title, reason:mode.reason, program:mode.program, value:mode.value, status:mode.program === 'exec-reap-target' ? '正在执行目标程序。' : '继续执行原程序。', record:'尚未退出。', evidence:mode.evidence},
      {title:'退出后：程序已结束，退出记录尚未回收', reason:`子进程已退出，状态为 Z。内核保存退出码 ${mode.exit} 等记录，父进程尚未通过 waitpid 收集它。`, program:'已结束', value:'已释放', status:'Z：已退出，等待回收。', record:`退出码 ${mode.exit}，尚未回收。`, evidence:`before waitpid: pid=${mode.pid} state=Z`},
      {title:'回收后：父进程取得退出码，退出记录已移除', reason:`waitpid 返回子进程 PID ${mode.pid}，父进程取得退出码 ${mode.exit}。再次等待同一子进程得到 ECHILD，不能重复取得它的退出状态。`, program:'已结束', value:'已释放', status:'退出记录已回收。', record:'已移除。', evidence:`waitpid: pid=${mode.pid} exit=${mode.exit}\nafter waitpid: pid=${mode.pid} /proc entry=absent\nsecond waitpid: ECHILD`},
    ];
    const stage = stages[index];
    text('attempt-label', mode.program === 'exec-reap-target' ? '成功替换后' : '替换失败后');
    text('stage-title', stage.title);
    text('stage-reason', stage.reason);
    text('pid-label', index === 3 ? '已回收的 PID' : '子进程 PID');
    text('child-pid', mode.pid);
    text('child-program', stage.program);
    text('child-value', stage.value);
    text('child-status', stage.status);
    text('child-record', stage.record);
    text('parent-status', index === 3 ? 'waitpid 已返回，退出状态已取得。' : '尚未调用 waitpid，未收集退出状态。');
    text('waited-pid', index === 3 ? mode.pid : '尚未返回');
    text('exit-code', index === 3 ? mode.exit : '尚未取得');
    text('stage-evidence', stage.evidence);
    document.getElementById('child-process').classList.toggle('reaped', index === 3);
  }
  document.getElementById('demo-mode').addEventListener('change', render);
  document.querySelectorAll('input[name="stage"]').forEach(input => input.addEventListener('change', render));
  document.querySelectorAll('.copy').forEach(button => {
    button.addEventListener('click', async () => {
      const command = button.parentElement.querySelector('pre');
      let feedback = button.parentElement.nextElementSibling;
      if (!feedback?.classList.contains('command-feedback')) {
        feedback = document.createElement('p');
        feedback.className = 'command-feedback';
        feedback.setAttribute('role', 'status');
        button.parentElement.after(feedback);
      }
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(command.textContent);
        feedback.textContent = '命令已复制。';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(command);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        feedback.textContent = '无法自动复制，命令已选中，可手动复制。';
      }
    });
  });
  render();
})();