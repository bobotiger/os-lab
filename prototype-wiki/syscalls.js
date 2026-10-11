(function () {
  const calls = {
    'read-data': {request:'read(fd 3, 最多 8 字节)', processing:'fd 3 有效，样本尚有 3 字节；本次读取这 3 字节。', result:'返回 3，程序取得 OS 和换行。', title:'读取成功：取得 3 字节，不是请求上限 8 字节', reason:'文件只有 3 字节。内核返回实际取得的数据量，文件位置到达末尾。', evidence:'34974 read(3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>, "OS\\n", 8) = 3'},
    'write-data': {request:'write(fd 1, OS 和换行，共 3 字节)', processing:'fd 1 对应标准输出；本次写入接受这 3 字节。', result:'返回 3，这次接受了 3 字节。', title:'写入成功：接受请求中的 3 字节', reason:'本次输出写入的对象是 fd 1 的终端，不是 fd 3 的样本文件。', evidence:'34974 write(1</dev/pts/6>, "OS\\n", 3)   = 3'},
    'read-eof': {request:'read(fd 3, 最多 8 字节)', processing:'fd 3 有效，但文件位置已到末尾；没有更多数据。', result:'返回 0，没有取得新数据，也没有错误。', title:'到达文件末尾：返回 0，不是读取失败', reason:'第一次已读完样本的 3 字节。文件描述符仍有效，读到末尾与使用无效描述符不同。', evidence:'34974 read(3</tmp/oslab-syscalls-tuoROL/syscall-input.txt>, "", 8) = 0'},
    'read-bad': {request:'read(已关闭的 fd 3, 最多 8 字节)', processing:'fd 3 已关闭，不再引用已打开对象；拒绝读取。', result:'返回 -1，错误为 EBADF，没有读到数据。', title:'读取失败：已关闭的描述符不能访问文件', reason:'内核检查到文件描述符无效，返回错误给同一调用进程。失败记录中的地址不是已读数据。', evidence:'34974 read(3, 0x7ffe713dba70, 8)        = -1 EBADF (Bad file descriptor)'},
    'write-bad': {request:'write(已关闭的 fd 3, X，共 1 字节)', processing:'fd 3 已关闭，不再引用已打开对象；拒绝写入。', result:'返回 -1，错误为 EBADF，X 没有被写入。', title:'写入失败：请求中的 X 没有被写入', reason:'文件描述符无效时，内核不接受这次写入。原程序收到错误后仍能处理结果并正常结束。', evidence:'34974 write(3, "X", 1)                  = -1 EBADF (Bad file descriptor)'},
  };
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  function render() {
    const call = calls[document.getElementById('call-mode').value];
    const index = Number(document.querySelector('input[name="stage"]:checked').value);
    const stages = [
      {title:'用户态：PID 34974 发起请求', reason:`请求为 ${call.request}。此时还没有取得本次调用结果。`},
      {title:'内核态：处理 PID 34974 的请求', reason:call.processing},
      {title:call.title, reason:call.reason},
    ];
    text('request-state', call.request);
    text('kernel-state', index >= 1 ? call.processing : '尚未进入本次请求的处理阶段。');
    text('return-state', index === 2 ? call.result : '尚未返回本次调用的结果。');
    text('stage-title', stages[index].title);
    text('stage-reason', stages[index].reason);
    text('stage-evidence', call.evidence);
    document.querySelectorAll('.flow li').forEach((item, position) => {
      if (position === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  document.getElementById('call-mode').addEventListener('change', render);
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