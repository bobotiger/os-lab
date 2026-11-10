document.getElementById('exercise-navigation').innerHTML = wikiHeader('exercises', []);

(() => {
  const main = document.querySelector('.exercise-page');
  const topics = document.querySelector('.exercise-topics');
  const groups = [...main.querySelectorAll('.exercise-section')].map(section => ({
    section,
    title: section.querySelector('h2').textContent,
    questions: [...section.querySelectorAll('.exercise')]
  }));
  const questions = groups.flatMap(group => group.questions);
  const entries = new Map(questions.map(question => {
    const heading = question.querySelector('h3');
    const number = heading.querySelector('.exercise-number').textContent;
    return [question.id, { question, number, title: heading.textContent.slice(number.length).trim() }];
  }));
  const remembered = new Map();
  let active;

  const workspace = document.createElement('div');
  workspace.className = 'exercise-workspace';
  workspace.innerHTML = `
    <aside class="exercise-directory" aria-labelledby="question-directory-title">
      <div class="directory-heading"><h2 id="question-directory-title">本章题目</h2><span class="directory-count"></span></div>
      <nav class="exercise-question-list" aria-label="本章题目"></nav>
    </aside>
    <div class="exercise-reader">
      <div class="exercise-picker"><label for="question-picker">选择题目</label><select id="question-picker"></select></div>
      <div class="exercise-reader-bar"><p class="exercise-position" role="status"></p><nav class="exercise-pager" aria-label="题目翻页"><button type="button" data-step="-1">← 上一题</button><button type="button" data-step="1">下一题 →</button></nav></div>
      <div class="exercise-content"></div>
      <nav class="exercise-pager exercise-pager-bottom" aria-label="题目底部翻页"><button type="button" data-step="-1">← 上一题</button><button type="button" data-step="1">下一题 →</button></nav>
    </div>`;
  topics.after(workspace);
  const content = workspace.querySelector('.exercise-content');
  groups.forEach(group => content.append(group.section));
  const list = workspace.querySelector('.exercise-question-list');
  const picker = workspace.querySelector('#question-picker');
  const position = workspace.querySelector('.exercise-position');
  const topicLinks = [...topics.querySelectorAll('a')];
  topicLinks.forEach((link, index) => {
    const count = document.createElement('span');
    count.className = 'topic-count';
    count.textContent = groups[index].questions.length;
    link.append(count);
  });
  document.body.classList.add('exercise-browser');

  function show(id, focus = false) {
    const entry = entries.get(id) || entries.get(questions[0].id);
    const group = groups.find(item => item.questions.includes(entry.question));
    const index = group.questions.indexOf(entry.question);
    const groupChanged = !active || active.group !== group;
    active = { ...entry, group, index };
    remembered.set(group.section.id, entry.question.id);
    groups.forEach(item => { item.section.hidden = item !== group; });
    questions.forEach(question => { question.hidden = question !== entry.question; });
    topicLinks.forEach((link, i) => {
      if (groups[i] === group) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (groupChanged) {
      list.replaceChildren();
      picker.replaceChildren();
      group.questions.forEach(question => {
        const item = entries.get(question.id);
        const link = document.createElement('a');
        link.href = `#${question.id}`;
        const number = document.createElement('span');
        number.className = 'directory-number';
        number.textContent = item.number;
        const title = document.createElement('span');
        title.textContent = item.title;
        link.append(number, title);
        list.append(link);
        picker.add(new Option(`${item.number}　${item.title}`, question.id));
      });
    }
    list.querySelectorAll('a').forEach(link => {
      if (link.hash === `#${entry.question.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    picker.value = entry.question.id;
    workspace.querySelector('.directory-count').textContent = `${group.questions.length} 题`;
    position.textContent = `${group.title} · ${index + 1} / ${group.questions.length}`;
    workspace.querySelectorAll('[data-step]').forEach(button => {
      button.disabled = Number(button.dataset.step) < 0 ? index === 0 : index === group.questions.length - 1;
    });
    document.title = `${entry.title} · 操作系统习题 · OSLab`;
    if (focus) {
      const heading = entry.question.querySelector('h3');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      const top = workspace.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' });
    }
  }

  function resolveHash() {
    const id = location.hash.slice(1);
    if (entries.has(id)) return id;
    const group = groups.find(item => item.section.id === id);
    return group ? remembered.get(id) || group.questions[0].id : questions[0].id;
  }
  function navigate(id) {
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    show(id, true);
  }
  topics.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const group = groups.find(item => `#${item.section.id}` === link.hash);
    navigate(remembered.get(group.section.id) || group.questions[0].id);
  });
  list.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(link.hash.slice(1));
  });
  picker.addEventListener('change', () => navigate(picker.value));
  workspace.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => {
      const question = active.group.questions[active.index + Number(button.dataset.step)];
      if (question) navigate(question.id);
    });
  });
  window.addEventListener('hashchange', () => show(resolveHash()));
  window.addEventListener('popstate', () => show(resolveHash()));
  show(resolveHash());

  let printState;
  window.addEventListener('beforeprint', () => {
    const panel = active.question.querySelector('.answer');
    if (!printState) printState = { panel, open: panel.open };
    panel.open = true;
  });
  window.addEventListener('afterprint', () => {
    if (printState) printState.panel.open = printState.open;
    printState = undefined;
  });
})();
