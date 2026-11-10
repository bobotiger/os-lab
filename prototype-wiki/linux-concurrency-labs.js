(() => {
  'use strict';
  document.getElementById('navigation').innerHTML = wikiHeader('linuxConcurrencyLabs', [
    {href: '#lab-index', title: '实验目录'}, {href: '#prepare', title: '运行准备'},
    {href: '#compare', title: '对照方法'}, {href: '#report', title: '报告要求'}
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
