(() => {
  const stages = [
    {title:'步骤 1：A 计算，B 等待数据', reason:'管道中没有数据，B 的读取操作正在等待。', states:['R','S'], cpu:[1.050,0], actions:['持续执行计算。','等待读取管道中的数据，尚未开始计算。'], pipe:'尚未发送数据。'},
    {title:'步骤 2：A、B 都在计算', reason:'发送的一个字节使 B 完成读取，随后开始计算。', states:['R','R'], cpu:[.530,.530], actions:['继续计算，与 B 轮流使用同一个 CPU。','收到数据后开始计算，与 A 轮流使用同一个 CPU。'], pipe:'一个字节已被 B 读取。'},
    {title:'步骤 3：A 被暂停，B 继续计算', reason:'SIGSTOP 只暂停 A，不改变 B 的执行条件。', states:['T','R'], cpu:[0,1.050], actions:['已被暂停，尚未收到继续信号。','继续执行计算，没有被暂停。'], pipe:'通知已读取；这一步没有发送新数据。'},
    {title:'步骤 4：A 恢复计算，B 继续计算', reason:'SIGCONT 解除 A 的暂停，A 延续原进程的计算。', states:['R','R'], cpu:[.530,.520], actions:['暂停已解除，重新与 B 轮流使用 CPU。','继续计算，与恢复后的 A 轮流使用 CPU。'], pipe:'通知已读取；这一步没有发送新数据。'},
  ];
  document.querySelectorAll('.meter').forEach(meter => {
    const axis = document.createElement('div');
    axis.className = 'meter-axis';
    axis.setAttribute('aria-hidden','true');
    axis.innerHTML = '<span>0 秒</span><span>0.55 秒</span><span>1.10 秒</span>';
    meter.after(axis);
  });
  const tabs = [...document.querySelectorAll('[data-stage]')];
  const select = index => {
    const stage = stages[index];
    tabs.forEach((tab, position) => {
      tab.setAttribute('aria-selected', String(position === index));
      tab.tabIndex = position === index ? 0 : -1;
    });
    document.getElementById('state-panel').setAttribute('aria-labelledby', tabs[index].id);
    document.getElementById('stage-title').textContent = stage.title;
    document.getElementById('stage-reason').textContent = stage.reason;
    ['a','b'].forEach((name, position) => {
      document.getElementById(`state-${name}`).textContent = stage.states[position];
      document.getElementById(`action-${name}`).textContent = stage.actions[position];
      document.getElementById(`cpu-${name}`).textContent = `${stage.cpu[position].toFixed(3)} 秒`;
      document.getElementById(`bar-${name}`).style.width = `${stage.cpu[position] / 1.1 * 100}%`;
    });
    document.getElementById('pipe-state').textContent = stage.pipe;
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
  document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => {
    const pre = button.parentElement.querySelector('pre');
    document.querySelectorAll('.command-feedback').forEach(item => item.remove());
    const feedback = document.createElement('p');
    feedback.className = 'command-feedback';
    feedback.setAttribute('role','status');
    button.parentElement.after(feedback);
    try {
      await navigator.clipboard.writeText(pre.textContent);
      feedback.textContent = '已复制到剪贴板，尚未在 Ubuntu 中运行。';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      feedback.textContent = '无法访问剪贴板，已选中这段命令，可手动复制。';
    }
  }));
  select(0);
})();