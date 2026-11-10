(() => {
  'use strict';
  document.getElementById('navigation').innerHTML = wikiHeader('linuxConcurrencyLabs', [
    {href: '#prepare', title: '实验准备'}, {href: '#seats', title: '互斥锁'},
    {href: '#queue', title: '条件变量'}, {href: '#pool', title: '信号量'},
    {href: '#events', title: '事件驱动'}
  ]);
  document.getElementById('related').innerHTML = wikiRelated('linuxConcurrencyLabs');
  document.querySelectorAll('[data-copy-command]').forEach(button => {
    button.addEventListener('click', async () => {
      const group = button.closest('.lab-command');
      const code = group.querySelector('code');
      const status = group.querySelector('[role="status"]');
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = '已复制命令。';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = '请复制已选中的完整命令。';
      }
    });
  });
})();
