(() => {
  const stages = [
    {title:'创建前：只有父进程，value 为 100', reason:'父进程已把 value 设为 100，尚未调用 fork() 创建子进程。', childValue:'--', parentStatus:'value 已设为 100。', childStatus:'尚未创建。'},
    {title:'创建后：父子进程的 value 都为 100', reason:'子进程开始时取得父进程创建它时的变量值。此时两者都没有修改 value。', childValue:'100', parentStatus:'value 仍为 100。', childStatus:'value 的初值为 100，尚未修改。'},
    {title:'修改后：子进程的 value 为 200，父进程的仍为 100', reason:'子进程把自己的 value 改为 200。父进程没有修改自己的变量，它的值仍是 100。', childValue:'200', parentStatus:'没有修改，value 仍为 100。', childStatus:'已把自己的 value 从 100 改为 200。'},
  ];
  const select = index => {
    const stage = stages[index];
    document.getElementById('stage-title').textContent = stage.title;
    document.getElementById('stage-reason').textContent = stage.reason;
    document.getElementById('parent-status').textContent = stage.parentStatus;
    document.getElementById('child-status').textContent = stage.childStatus;
    document.getElementById('child-value').textContent = stage.childValue;
    document.getElementById('child-process').classList.toggle('absent', index === 0);
    document.getElementById('child-process').classList.toggle('changed', index === 2);
  };
  document.querySelectorAll('input[name="stage"]').forEach(input => {
    input.addEventListener('change', () => select(Number(input.value)));
  });
  document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => {
    const pre = button.parentElement.querySelector('pre');
    document.querySelectorAll('.command-feedback').forEach(item => item.remove());
    const feedback = document.createElement('p');
    feedback.className = 'command-feedback';
    feedback.setAttribute('role', 'status');
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
  select(Number(document.querySelector('input[name="stage"]:checked').value));
})();