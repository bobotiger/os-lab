globalThis.OSLabHomeworkUI = (() => {
  const {escape} = OSLabHomeworkReport;
  const mount = ({root, definition, scope, taskSelector}) => {
    const panel = root.querySelector('#homework-session');
    const main = root.querySelector('main');
    const taskSection = root.querySelector(taskSelector).closest('.hw-section');
    const programView = document.createElement('section');
    programView.id = 'hw-program-view';
    programView.dataset.hwPageView = 'program';
    const taskView = document.createElement('section');
    taskView.id = 'hw-task-view';
    taskView.dataset.hwPageView = 'tasks';
    const intro = main.querySelector('.intro');
    const programIntro = document.createElement('div');
    programIntro.className = 'hw-program-intro';
    for (const node of [...intro.children]) {
      if (node.matches('.api-hw-outline')) node.remove();
      else if (!node.matches('.eyebrow,h1,.lead')) programIntro.append(node);
    }
    programView.append(programIntro);
    for (const node of [...main.children]) if (node !== intro && node !== panel && node !== taskSection) programView.append(node);
    taskView.append(panel, taskSection);
    const navigation = document.createElement('div');
    navigation.className = 'hw-page-tabs';
    navigation.setAttribute('role', 'tablist');
    navigation.setAttribute('aria-label', '作业内容');
    navigation.innerHTML = '<button type="button" role="tab" id="hw-view-tasks" aria-controls="hw-task-view" data-hw-page-tab="tasks">实验任务</button><button type="button" role="tab" id="hw-view-program" aria-controls="hw-program-view" data-hw-page-tab="program">程序说明</button>';
    main.append(navigation, taskView, programView);
    taskView.setAttribute('role', 'tabpanel');
    taskView.setAttribute('aria-labelledby', 'hw-view-tasks');
    programView.setAttribute('role', 'tabpanel');
    programView.setAttribute('aria-labelledby', 'hw-view-program');
    const showPage = (view, focus = false) => {
      for (const tab of navigation.querySelectorAll('button')) {
        const selected = tab.dataset.hwPageTab === view;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
      }
      taskView.hidden = view !== 'tasks';
      programView.hidden = view !== 'program';
    };
    const showTarget = target => {
      if (programView.contains(target)) showPage('program');
      else if (taskView.contains(target)) showPage('tasks');
      for (let node = target; node && node !== main; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
    };
    navigation.addEventListener('click', event => {
      const tab = event.target.closest('[data-hw-page-tab]');
      if (tab) showPage(tab.dataset.hwPageTab);
    });
    navigation.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = navigation.querySelector('[aria-selected=true]').dataset.hwPageTab;
      showPage(event.key === 'Home' ? 'tasks' : event.key === 'End' ? 'program' : current === 'tasks' ? 'program' : 'tasks', true);
    });
    root.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      const target = link && document.getElementById(link.getAttribute('href').slice(1));
      if (target) showTarget(target);
    });
    const followHash = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) showTarget(target);
    };
    addEventListener('hashchange', followHash);
    showPage('tasks');
    followHash();
    const randomId = () => {
      if (crypto.randomUUID) return crypto.randomUUID();
      return [...crypto.getRandomValues(new Uint8Array(24))].map(value => value.toString(16).padStart(2, '0')).join('');
    };
    const writerId = randomId();
    let storage;
    try { storage = localStorage; } catch { storage = {getItem() { throw new Error('storage'); }}; }
    const lock = navigator.locks ? (key, action) => navigator.locks.request(key, action) : null;
    const store = OSLabHomeworkSession.createStore(storage, scope, lock, writerId);
    let record = null;
    let draft = {};
    let active = false;
    let blocked = false;
    let volatile = false;
    let dirty = false;
    let timer = null;
    let saving = Promise.resolve();
    let selectedTasks = [];
    let exporting = false;
    const status = (text, error = false) => {
      const node = panel.querySelector('#hw-save-status');
      node.textContent = text;
      node.classList.toggle('hw-save-error', error);
      node.hidden = !error;
    };
    const errors = {
      identity: '姓名和学号不能为空，长度各不超过 80 个字符。',
      storage: '暂时无法自动保存，填写仍在本页。请先下载 PDF，再离开页面。',
      locks: '此浏览器无法自动保存，填写仍在本页。请先下载 PDF，再离开页面。',
      selection: '请至少选择一道要导出的题目。',
      pdf: 'PDF 暂时无法生成，填写没有清除。请重试。',
      conflict: '另一标签页正在使用这份记录。请回到该标签页继续，本页填写没有清除。',
      incompatible: '这里保存的是旧版作业。请先下载旧记录；确认清除后，才能开始新版。',
      corrupt: '已保存的记录无法读取。请先下载原始记录，再确认是否清除。',
    };
    const download = (content, type, name) => {
      const url = URL.createObjectURL(new Blob([content], {type}));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
    const changedElsewhere = () => {
      blocked = true;
      root.querySelectorAll('.hw-experiment-fields input,.hw-experiment-fields textarea').forEach(node => { node.disabled = true; });
      const report = panel.querySelector('[data-hw-action="report"]');
      if (report) report.disabled = true;
      status(errors.conflict, true);
    };
    const error = failure => {
      if (failure.code === 'conflict') changedElsewhere();
      else status(errors[failure.code] || '操作未完成，填写没有清除。请重试。', true);
    };
    const save = () => {
      clearTimeout(timer);
      saving = saving.catch(() => {}).then(async () => {
        if (!active || !record || blocked || volatile) return;
        const candidate = {...record, responses: structuredClone(draft), updatedAt: new Date().toISOString()};
        try {
          record = await store.save(candidate);
          dirty = JSON.stringify(draft) !== JSON.stringify(candidate.responses);
          status(dirty ? '正在保存后续修改…' : '已保存到当前浏览器。');
        } catch (failure) { error(failure); }
      });
      return saving;
    };
    const updateTaskCount = (node, task) => {
      const count = (definition.describeFields ? definition.describeFields(task) : task.fields).filter(field => draft[task.id]?.[field.id]?.trim()).length;
      node.querySelector('.hw-task-count').textContent = count ? `已填 ${count} 项` : '未填写';
    };
    const updateInvestigation = () => {
      const comparison = root.querySelector('[data-hw-investigation-comparison]');
      if (!comparison) return;
      const answers = draft['process-01'] || {};
      const number = (field, percent = false) => {
        const text = (answers[field] || '').trim();
        if (!text || !/^\d+(?:\.\d+)?\s*%?$/.test(text) || (!percent && text.includes('%'))) return null;
        const value = Number(text.replace('%', '').trim());
        return Number.isFinite(value) && (percent ? value <= 100 : value > 0) ? value : null;
      };
      const totals = [number('run-0-total'), number('run-1-total')];
      const rates = [number('run-0-cpu-rate', true), number('run-1-cpu-rate', true)];
      const format = value => Number(value.toFixed(4)).toLocaleString('zh-CN', {maximumFractionDigits: 4});
      const totalDelta = totals.every(value => value !== null) ? totals[0] - totals[1] : null;
      const rateDelta = rates.every(value => value !== null) ? rates[1] - rates[0] : null;
      comparison.querySelector('[data-hw-time-difference]').textContent = totalDelta === null ? '两组总时间尚未完整记录' : totalDelta === 0 ? '两组总时间相同' : `${totalDelta > 0 ? 'I/O 进程先输入' : '计算进程先输入'}的总时间少 ${format(Math.abs(totalDelta))} 个时间单位`;
      comparison.querySelector('[data-hw-rate-difference]').textContent = rateDelta === null ? '两组 CPU 利用率尚未完整记录' : rateDelta === 0 ? '两组 CPU 利用率相同' : `${rateDelta > 0 ? 'I/O 进程先输入' : '计算进程先输入'}的 CPU 利用率高 ${format(Math.abs(rateDelta))} 个百分点`;
      const maximum = Math.max(...totals.filter(value => value !== null), 1);
      comparison.querySelectorAll('[data-hw-duration]').forEach((row, index) => {
        const value = totals[index];
        row.querySelector('output').textContent = value === null ? '未记录' : `${format(value)} 时间单位`;
        row.querySelector('.hw-duration-fill').style.width = totalDelta === null ? '0%' : `${value / maximum * 100}%`;
      });
    };
    const selectTaskTab = (button, focus = false) => {
      const node = button.closest(taskSelector);
      node.querySelectorAll('[data-hw-task-tab]').forEach(tab => {
        const selected = tab === button;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      node.querySelectorAll('[data-hw-task-panel]').forEach(panel => { panel.hidden = panel.dataset.hwTaskPanel !== button.dataset.hwTaskTab; });
      if (focus) button.focus();
    };
    const renderTasks = () => {
      const nodes = [...root.querySelectorAll(taskSelector)];
      for (const [index, node] of nodes.entries()) {
        const task = record?.tasks[index];
        const target = node.querySelector('.hw-experiment-slot');
        const intro = node.querySelector('.hw-task-intro');
        const previousPrompt = target.querySelector('.hw-reasoning-prompt');
        if (previousPrompt) intro.querySelector('.hw-task-requirements').append(...previousPrompt.childNodes);
        node.querySelector('.hw-task-content').prepend(intro);
        if (!active || !task) { target.replaceChildren(); node.querySelector('.hw-task-count').textContent = ''; continue; }
        const fields = definition.describeFields ? definition.describeFields(task) : task.fields.map(field => definition.describeField ? definition.describeField(task, field) : field);
        const sections = task.runs.map(run => run.label);
        const compactRuns = task.runs.length > 2;
        const investigation = task.layout === 'integrated' && root.querySelector('.process-workspace');
        const reasoningFields = fields.filter(field => !sections.includes(field.section));
        const renderField = field => {
          const fieldId = `hw-${task.id}-${field.id}`;
          const displayLabel = root.querySelector('.process-workspace') && /^run-\d+-output$/.test(field.id) ? '运行输出' : field.label;
          if (field.reuse) return `<div class="hw-long-field hw-reused-output"><h4>${escape(field.label)}</h4><pre class="api-hw-terminal" aria-label="${escape(field.label)}" data-hw-source-task="${escape(field.reuse.taskId)}" data-hw-source-field="${escape(field.reuse.fieldId)}" data-hw-source-empty="尚未记录此对照输出">${escape(draft[field.reuse.taskId]?.[field.reuse.fieldId] || '尚未记录此对照输出')}</pre></div>`;
          const attributes = `id="${escape(fieldId)}" aria-labelledby="${escape(fieldId)}-label"${field.help ? ` aria-describedby="${escape(fieldId)}-help"` : ''}${field.placeholder ? ` placeholder="${escape(field.placeholder)}"` : ''} maxlength="20000" data-hw-task="${escape(task.id)}" data-hw-field="${escape(field.id)}"`;
          return `<label class="${field.multiline ? 'hw-long-field' : ''}"><span class="hw-field-title" id="${escape(fieldId)}-label">${escape(displayLabel)}</span>${field.help ? `<span class="hw-field-help" id="${escape(fieldId)}-help">${escape(field.help)}</span>` : ''}${field.multiline ? `<textarea rows="${field.rows || Math.max(3, (field.placeholder?.split('\n').length || 0) * 2)}" ${attributes}>${escape(draft[task.id]?.[field.id] || '')}</textarea>` : `<input type="text" ${field.kind === 'comparison' && !field.id.endsWith('-event-runner') && !task.id.startsWith('api-generator-') ? 'inputmode="decimal" ' : ''}${attributes} value="${escape(draft[task.id]?.[field.id] || '')}">`}</label>`;
        };
        if (task.layout === 'integrated') {
          const sharedSourceFields = reasoningFields.filter(field => field.kind === 'source');
          target.innerHTML = `<section class="hw-work-panel hw-experiment-fields">${sharedSourceFields.length ? `<div class="hw-field-grid hw-shared-source">${sharedSourceFields.map(renderField).join('')}</div>` : ''}${task.compileCommand ? `<div class="hw-compile-step"><h4>编译程序</h4><div class="hw-command"><span>编译命令</span><button type="button" class="icon-button" title="复制编译命令" aria-label="复制编译命令" data-hw-copy="${index}:compile">⧉</button><pre><code>${escape(task.compileCommand)}</code></pre></div></div>` : ''}${compactRuns ? `<label class="hw-run-selector">实验条件<select data-hw-input-selector>${task.runs.map((run, runIndex) => `<option value="${runIndex}">${escape(run.label)}</option>`).join('')}</select></label>` : ''}${task.runs.map((run, runIndex) => {
            const field = fields.find(field => field.id === `run-${runIndex}-output`);
            const sourceFields = fields.filter(field => field.section === run.label && field.kind === 'source');
            if (run.reuse && root.querySelector('.process-workspace')) return `<div class="hw-run hw-reference-run"><h4>${escape(run.label)}</h4><p class="hw-reference-label">引用实验 1 · I/O 进程先输入</p><div class="hw-command"><button type="button" class="icon-button" title="复制来源命令" aria-label="复制实验 1 的来源命令" data-hw-copy="${index}:${runIndex}">⧉</button><pre><code>${escape(run.executionCommand || run.predictionCommand)}</code></pre></div><details class="hw-reference-meta"><summary>来源运行条件与程序版本</summary><p>进程输入：<code>${escape(run.input)}</code></p><p>${escape(record.program.version)}</p></details><pre class="api-hw-terminal" aria-label="实验 1 的对照输出" data-hw-source-task="${escape(run.reuse.taskId)}" data-hw-source-field="${escape(run.reuse.fieldId)}">${escape(draft[run.reuse.taskId]?.[run.reuse.fieldId] || '尚未记录实验 1 的对照输出')}</pre></div>`;
            if (run.reuse) return `<div class="hw-run"><h4>${escape(run.label)}</h4><p>进程输入：<code>${escape(run.input)}</code>；与实验 1 的“I/O 进程先输入”使用同一条命令。</p><pre class="api-hw-terminal" aria-label="实验 1 的对照输出" data-hw-source-task="${escape(run.reuse.taskId)}" data-hw-source-field="${escape(run.reuse.fieldId)}">${escape(draft[run.reuse.taskId]?.[run.reuse.fieldId] || '尚未记录实验 1 的对照输出')}</pre></div>`;
            return `<div class="hw-run"${compactRuns ? ` data-hw-input-group="${runIndex}"${runIndex ? ' hidden' : ''}` : ''}><h4>${escape(run.label)}</h4>${sourceFields.some(field => field.placement !== 'afterCommand') ? `<div class="hw-field-grid">${sourceFields.filter(field => field.placement !== 'afterCommand').map(renderField).join('')}</div>` : ''}<div class="hw-command"><span>执行命令</span><button type="button" class="icon-button" title="复制命令" aria-label="复制${escape(run.label)}的执行命令" data-hw-copy="${index}:${runIndex}">⧉</button><pre><code>${escape(run.executionCommand || run.predictionCommand)}</code></pre></div><div class="hw-field-grid">${sourceFields.filter(field => field.placement === 'afterCommand').map(renderField).join('')}${renderField(field)}</div></div>`;
          }).join('')}<div class="hw-field-grid">${reasoningFields.filter(field => field.kind !== 'source').map(renderField).join('')}</div></section>`;
          const comparisonFields = fields.filter(field => field.kind === 'comparison');
          if (comparisonFields.length) {
            const comparison = document.createElement('div');
            comparison.className = 'hw-result-comparison';
            const metrics = comparisonFields.filter(field=>field.section===task.runs[0].label);
            const label = (run,runIndex) => task.id==='process-04' ? `条件 ${String.fromCharCode(65+runIndex)}` : task.id==='process-02' ? runIndex===0?'阻塞后切换':'等待期间不切换' : task.id==='process-03' ? runIndex===0?'完成后立即选择':'完成后等待选择' : run.label;
            const transposed = task.id==='process-03';
            const head = transposed ? `<th scope="col">事件 / 指标</th>${task.runs.map((run,runIndex)=>`<th scope="col">${escape(label(run,runIndex))}</th>`).join('')}` : `<th scope="col">${task.id.startsWith('api-generator-')?'运行':task.id==='process-01'?'输入顺序':'规则条件'}</th>${metrics.map(field=>`<th scope="col">${escape(field.label)}</th>`).join('')}`;
            const rows = transposed ? metrics.map((metric,metricIndex)=>`<tr><th scope="row">${escape(metric.label)}</th>${task.runs.map(run=>{const field=comparisonFields.filter(field=>field.section===run.label)[metricIndex];return `<td>${renderField({...field,label:`${label(run,task.runs.indexOf(run))} · ${field.label}`})}</td>`;}).join('')}</tr>`).join('') : task.runs.map((run,runIndex)=>`<tr><th scope="row">${escape(label(run,runIndex))}</th>${comparisonFields.filter(field=>field.section===run.label).map(field=>`<td>${renderField({...field,label:`${label(run,runIndex)} · ${field.label}`})}</td>`).join('')}</tr>`).join('');
            comparison.innerHTML = `<table><caption>${task.id==='api-generator-2'?'两次运行的等待返回':task.id==='api-generator-4'?'同一程序的关系与等待对照':task.id==='process-02'?'首次运行时刻对照':task.id==='process-03'?'第一次完成到第二次请求':task.id==='process-04'?'同一事件的四策略对照':'结果对照'}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
            target.querySelector('.hw-work-panel>.hw-field-grid:last-child').prepend(comparison);
          }
          if (root.querySelector('.process-workspace')) {
            const prompt = document.createElement('div');
            prompt.className = 'hw-task-requirements hw-reasoning-prompt';
            prompt.append(...[...intro.querySelector('.hw-task-requirements').children].slice(2));
            prompt.hidden = comparisonFields.length > 0 || task.id.startsWith('api-generator-');
            target.querySelector('.hw-work-panel>.hw-field-grid:last-child').prepend(prompt);
          }
          if (investigation) {
            target.querySelector('.hw-work-panel').classList.add('hw-investigation');
            target.querySelectorAll('.hw-run').forEach((runNode, runIndex) => {
              if (task.id === 'process-04') {
                const command = task.runs[runIndex].command;
                runNode.querySelector('h4').textContent = `条件 ${String.fromCharCode(65 + runIndex)} · ${command.includes('-S SWITCH_ON_IO') ? '发起 I/O 后切换' : '等待期间不切换'} · ${command.includes('-I IO_RUN_IMMEDIATE') ? '完成后立即选择' : '完成后等待选择'}`;
              }
              const input = document.createElement('dl');
              input.className = 'hw-run-workload';
              const repeatProgram = task.runs[runIndex].command === './run';
              const descriptions = task.id.startsWith('api-generator-') ? [`<div><dt>${repeatProgram?'同一程序':'生成器输入'}</dt><dd>${repeatProgram?'直接执行已有 ./run，程序结构不变。':`<code>${escape(task.runs[runIndex].input)}</code>`}</dd></div>`] : task.runs[runIndex].input.split(',').map((part, processIndex) => {
                const [amount, probability] = part.split(':');
                const description = probability === '100' ? `${amount} 条计算指令` : probability === '0' ? `${amount} 次 I/O 请求` : `${amount} 个操作，计算概率 ${probability}%`;
                return `<div><dt>进程 ${processIndex}</dt><dd>${escape(description)}</dd></div>`;
              });
              input.innerHTML = descriptions.join('');
              runNode.querySelector('.hw-command').after(input);
              const records = runNode.querySelector('.hw-field-grid') || runNode.querySelector('[data-hw-source-task]');
              const disclosure = document.createElement('details');
              disclosure.className = 'hw-output-record';
              disclosure.open = true;
              disclosure.innerHTML = `<summary>${task.runs[runIndex].reuse?'引用输出':'运行输出'}</summary>`;
              records.before(disclosure);
              disclosure.append(records);
              records.querySelectorAll('.hw-field-title').forEach(label => label.classList.add('hw-visually-hidden'));
            });
            const results = target.querySelector('.hw-work-panel>.hw-field-grid:last-child');
            results.classList.add('hw-investigation-findings');
            if (task.id === 'process-01') {
              const comparison = document.createElement('section');
              comparison.className = 'hw-investigation-comparison';
              comparison.dataset.hwInvestigationComparison = '';
              comparison.setAttribute('aria-label', '两次运行的总时间与利用率差异');
              comparison.innerHTML = `<div class="hw-investigation-section-title"><span>01</span><h4>运行差异</h4><small>依据填写的结果</small></div><div class="hw-difference-summary" role="status" aria-live="polite"><p data-hw-time-difference></p><p data-hw-rate-difference></p></div><div class="hw-duration-comparison">${task.runs.map(run => `<div data-hw-duration><span>${escape(run.label)}</span><div class="hw-duration-track"><span class="hw-duration-fill"></span></div><output></output></div>`).join('')}</div>`;
              results.prepend(comparison);
              const evidence = results.querySelector('label:has([data-hw-field="overlap-evidence"])');
              const cause = results.querySelector('label:has([data-hw-field="analysis"])');
              evidence.classList.add('hw-investigation-evidence');
              cause.classList.add('hw-investigation-cause');
              evidence.querySelector('.hw-field-title').textContent = '02 · 相关时间行';
              cause.querySelector('.hw-field-title').textContent = '03 · 对差异的解释';
              updateInvestigation();
            } else {
              const cause = results.querySelector('label:has([data-hw-field="analysis"])');
              cause.classList.add('hw-investigation-cause');
              if (task.id.startsWith('api-generator-')) {
                cause.querySelector('.hw-field-title').textContent = '比较与判断';
                cause.querySelector('textarea').rows = 4;
                cause.classList.add('hw-api-judgement');
              } else {
              cause.querySelector('.hw-field-title').textContent = '03 · 原因解释';
              cause.querySelector('textarea').rows = 3;
              const evidence = results.querySelector('label:has([data-hw-field="event-evidence"])');
              evidence.classList.add('hw-investigation-evidence');
              evidence.querySelector('.hw-field-title').textContent = '02 · 事件记录';
              const prompt = results.querySelector('.hw-reasoning-prompt');
              prompt.querySelector('h4').textContent = task.id.startsWith('api-generator-')?'事件与等待关系':task.id === 'process-02' ? '阻塞期间的 CPU 选择' : task.id === 'process-03' ? '同一次请求的三个时刻' : '同一个事件后的四种选择';
              if (task.id === 'process-03') {
                const phases = document.createElement('div');
                phases.className = 'hw-event-phases';
                phases.setAttribute('aria-label', '第一次 I/O 完成到第二次请求的事件关系');
                phases.innerHTML = '<div><span>01 / 完成事件</span><strong>I/O 服务完成</strong><code>时间列 *</code></div><div><span>02 / 完成处理</span><strong>进程获得 CPU</strong><code>RUN:io_done</code></div><div><span>03 / 后续请求</span><strong>第二次请求发起</strong><code>第二次 RUN:io</code></div>';
                prompt.before(phases);
              }
              if (task.id === 'process-04') {
                const selector = target.querySelector('.hw-run-selector');
                const switchModes = ['SWITCH_ON_END','SWITCH_ON_IO'];
                const completionModes = ['IO_RUN_LATER','IO_RUN_IMMEDIATE'];
                const matrix = document.createElement('fieldset');
                matrix.className = 'hw-strategy-matrix';
                matrix.innerHTML = `<legend>阻塞与完成规则的组合</legend><table><thead><tr><th scope="col">阻塞后</th>${completionModes.map(mode=>`<th scope="col">${mode==='IO_RUN_LATER'?'完成后等待选择':'完成后立即选择'}</th>`).join('')}</tr></thead><tbody>${switchModes.map(mode=>`<tr><th scope="row">${mode==='SWITCH_ON_END'?'等待期间不切换':'发起 I/O 后切换'}</th>${completionModes.map(completion=>{
                  const runIndex=task.runs.findIndex(run=>run.command.includes(`-S ${mode} `)&&run.command.includes(`-I ${completion}`));
                  return `<td><label title="${escape(`${mode} / ${completion}`)}"><input type="radio" aria-label="${escape(`条件 ${String.fromCharCode(65+runIndex)}：${mode} / ${completion}`)}" name="${escape(task.id)}-condition" value="${runIndex}" data-hw-input-selector ${runIndex===0?'checked':''}><span>条件 ${String.fromCharCode(65+runIndex)}</span></label></td>`;
                }).join('')}</tr>`).join('')}</tbody></table>`;
                selector.replaceWith(matrix);
                target.querySelector('.hw-work-panel').classList.add('hw-investigation-matrix');
              }
              }
            }
          }
          updateTaskCount(node, task);
          continue;
        }
        const tabs = [['intro', '题目与命令'], ['results', '运行记录'], ['reasoning', '运行结果与分析']];
        target.innerHTML = `<div class="hw-task-tabs" role="tablist" aria-label="${escape(task.title)}">${tabs.map(([id, label], tabIndex) => `<button type="button" role="tab" id="${task.id}-tab-${id}" aria-controls="${task.id}-panel-${id}" aria-selected="${tabIndex === 0}" tabindex="${tabIndex === 0 ? 0 : -1}" data-hw-task-tab="${id}">${label}</button>`).join('')}</div>
          <section class="hw-work-panel" role="tabpanel" id="${task.id}-panel-intro" aria-labelledby="${task.id}-tab-intro" data-hw-task-panel="intro"><div class="hw-actual-input"><h4>本次实验输入</h4><p>${escape(task.conditions)}</p>${compactRuns ? `<label class="hw-run-selector">实验条件<select data-hw-input-selector>${task.runs.map((run, runIndex) => `<option value="${runIndex}">${escape(run.label)}</option>`).join('')}</select></label>` : ''}${task.runs.map((run, runIndex) => `<div class="hw-run"${compactRuns ? ` data-hw-input-group="${runIndex}"${runIndex ? ' hidden' : ''}` : ''}>${task.runs.length > 1 && !compactRuns ? `<h5>${escape(run.label)}</h5>` : ''}<p>进程输入：<code>${escape(run.input)}</code>${run.pythonSeed === null || compactRuns ? '' : ` · Python 种子 ${escape(run.pythonSeed)}`}</p><div class="hw-command"><span>执行命令</span><button type="button" class="icon-button" title="复制命令" aria-label="复制${escape(run.label)}的执行命令" data-hw-copy="${index}:${runIndex}">⧉</button><pre><code>${escape(run.predictionCommand)}</code></pre></div></div>`).join('')}<p>${escape(task.evidenceHint)}</p></div></section>
          <section class="hw-work-panel hw-experiment-fields" role="tabpanel" id="${task.id}-panel-results" aria-labelledby="${task.id}-tab-results" data-hw-task-panel="results" hidden>${sections.length > 1 ? `<label class="hw-run-selector">记录条件<select data-hw-run-selector>${sections.map((section, runIndex) => `<option value="${runIndex}">${escape(section)}</option>`).join('')}</select></label>` : ''}${sections.map((section, runIndex) => `<fieldset data-hw-record-group="${runIndex}" ${runIndex ? 'hidden' : ''}><legend>${escape(sections.length > 1 ? `运行结果 · ${section}` : '运行结果')}</legend><div class="hw-field-grid">${fields.filter(field => field.section === section).map(renderField).join('')}</div></fieldset>`).join('')}</section>
          <section class="hw-work-panel hw-experiment-fields" role="tabpanel" id="${task.id}-panel-reasoning" aria-labelledby="${task.id}-tab-reasoning" data-hw-task-panel="reasoning" hidden><div class="hw-field-grid">${reasoningFields.map(field => field.optional ? `<details class="hw-optional-field" ${draft[task.id]?.[field.id]?.trim() ? 'open' : ''}><summary>${escape(field.label)}</summary>${renderField(field)}</details>` : renderField(field)).join('')}</div></section>`;
        target.querySelector('[data-hw-task-panel="intro"]').prepend(intro);
        updateTaskCount(node, task);
      }
    };
    const renderPanel = () => {
      const existing = store.load();
      if (existing.state === 'valid' && existing.record.definitionVersion !== definition.version) existing.state = 'incompatible';
      const valid = existing.state === 'valid';
      panel.innerHTML = active ? `<div class="hw-student-bar"><dl class="hw-student-meta"><div><dt>姓名</dt><dd>${escape(record.identity.name)}</dd></div><div><dt>学号</dt><dd>${escape(record.identity.studentId)}</dd></div></dl><button type="button" data-hw-action="report" ${blocked || !selectedTasks.length ? 'disabled' : ''}>下载 PDF</button></div>
        <details class="hw-report-choice"><summary>报告内容 <span data-hw-selected-count>已选 ${selectedTasks.length} 项</span></summary><fieldset class="hw-export-selection"><legend class="hw-visually-hidden">选择报告中的实验</legend><label class="hw-export-choice"><input type="checkbox" data-hw-select-all><span>全部实验</span></label><div class="hw-export-grid">${record.tasks.map((task, index) => `<label class="hw-export-choice"><input type="checkbox" data-hw-export-task="${escape(task.id)}" ${selectedTasks.includes(task.id) ? 'checked' : ''}><span>${String(index + 1).padStart(2, '0')} · ${escape(task.title)}</span></label>`).join('')}</div></fieldset></details><p id="hw-save-status" role="status" aria-live="polite" hidden></p>`
        : valid ? `<div class="hw-student-bar"><dl class="hw-student-meta"><div><dt>姓名</dt><dd>${escape(existing.record.identity.name)}</dd></div><div><dt>学号</dt><dd>${escape(existing.record.identity.studentId)}</dd></div></dl><button type="button" data-hw-action="continue">继续实验</button></div><p id="hw-save-status" role="status" aria-live="polite" hidden></p>`
        : `<form id="hw-start-form"><div class="hw-identity"><label>姓名<input name="name" type="text" maxlength="80" required autocomplete="off"></label><label>学号<input name="studentId" type="text" maxlength="80" required autocomplete="off"></label></div><button type="submit">开始实验</button></form><p id="hw-save-status" role="status" aria-live="polite" hidden></p>`;
      if (active) updateSelection();
      const conditions = root.querySelector('[data-hw-common-conditions]');
      if (conditions) {
        conditions.hidden = !active;
        conditions.querySelector('dl').innerHTML = active && definition.describeExperiment ? definition.describeExperiment(record.tasks).map(([label, description]) => `<div><dt>${escape(label)}</dt><dd>${escape(description)}</dd></div>`).join('') : '';
      }
      if (!active && existing.state === 'storage') status(errors.storage, true);
    };
    const activate = value => {
      record = value;
      draft = structuredClone(value.responses);
      active = true;
      blocked = false;
      selectedTasks = value.tasks.filter(task => !task.optional).map(task => task.id);
      renderPanel();
      renderTasks();
      status(volatile ? errors.storage : '实验输入已固定。填写内容自动保存。', volatile);
    };
    const resume = async () => {
      const existing = store.load();
      if (existing.state !== 'valid') { renderPanel(); return; }
      if (existing.record.definitionVersion !== definition.version) {
        panel.querySelector('#hw-save-status').textContent = errors.incompatible;
        return;
      }
      try { activate(await store.claim(existing.record)); }
      catch (failure) {
        if (failure.code === 'storage' || failure.code === 'locks') { volatile = true; activate(existing.record); error(failure); }
        else error(failure);
      }
    };
    const updateSelection = () => {
      const all = panel.querySelector('[data-hw-select-all]');
      if (!all || !record) return;
      all.checked = selectedTasks.length === record.tasks.length;
      all.indeterminate = selectedTasks.length > 0 && !all.checked;
      panel.querySelector('[data-hw-selected-count]').textContent = `已选 ${selectedTasks.length} 项`;
      panel.querySelector('[data-hw-action=report]').disabled = blocked || exporting || !selectedTasks.length;
    };
    const exported = async () => {
      const taskIds = [...selectedTasks];
      if (!taskIds.length) throw Object.assign(new Error('selection'), {code: 'selection'});
      if (!confirm(`下载所选的 ${taskIds.length} 项实验为 PDF 后，本次实验将结束。未选内容也会从当前记录移除。浏览器开始下载后，请确认文件已保存。继续下载？`)) return;
      exporting = true;
      updateSelection();
      panel.querySelectorAll('input').forEach(node => { node.disabled = true; });
      root.querySelectorAll('.hw-experiment-fields input,.hw-experiment-fields textarea').forEach(node => { node.disabled = true; });
      try {
      await save();
      if (!record || blocked) return;
      const value = {...record, responses: structuredClone(draft), updatedAt: new Date().toISOString()};
      for (const task of value.tasks) for (const field of task.fields) {
        if (!field.reuse) continue;
        const source = draft[field.reuse.taskId]?.[field.reuse.fieldId];
        if (source?.trim()) value.responses[task.id] = {...value.responses[task.id], [field.id]: source};
      }
      if (definition.describeFields || definition.describeField) value.tasks = record.tasks.map(task => ({...task, question: definition.describeQuestion ? definition.describeQuestion(task) : task.question, fields: definition.describeFields ? definition.describeFields(task) : task.fields.map(field => definition.describeField(task, field))}));
      const report = OSLabHomeworkSession.report(value, randomId(), new Date().toISOString(), taskIds);
      const content = await OSLabHomeworkPDF.render(report);
      if (!active || !record || record.experimentId !== value.experimentId) return;
      if (!volatile) await store.archive(record, {...record, responses: structuredClone(draft)});
      download(content, 'application/pdf', OSLabHomeworkSession.filename(value, report.reportId, 'pdf'));
      if (!volatile) await store.clear(record);
      active = false; record = null; draft = {}; dirty = false; volatile = false; selectedTasks = [];
      renderPanel(); renderTasks();
      } finally {
        exporting = false;
        if (active) {
          panel.querySelectorAll('input').forEach(node => { node.disabled = blocked; });
          root.querySelectorAll('.hw-experiment-fields input,.hw-experiment-fields textarea').forEach(node => { node.disabled = blocked; });
          updateSelection();
        }
      }
    };
    panel.addEventListener('submit', async event => {
      if (event.target.id !== 'hw-start-form') return;
      event.preventDefault();
      const button = event.target.querySelector('button');
      button.disabled = true;
      try {
        const student = {name: event.target.elements.name.value, studentId: event.target.elements.studentId.value};
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        const candidate = OSLabHomeworkSession.createRecord(scope, definition, student, seed, randomId(), new Date().toISOString());
        try { activate(await store.create(candidate, store.load().raw)); }
        catch (failure) {
          if (failure.code === 'storage' || failure.code === 'locks') { volatile = true; activate(candidate); error(failure); }
          else throw failure;
        }
      } catch (failure) { error(failure); button.disabled = false; }
    });
    root.addEventListener('input', event => {
      const node = event.target;
      if (node.hasAttribute('data-hw-run-selector') || node.hasAttribute('data-hw-input-selector')) {
        const task = node.closest(taskSelector);
        task.querySelectorAll('[data-hw-run-selector],[data-hw-input-selector]').forEach(selector => {
          if (selector.type === 'radio') selector.checked = selector.value === node.value;
          else selector.value = node.value;
        });
        task.querySelectorAll('[data-hw-record-group],[data-hw-input-group]').forEach(group => { group.hidden = (group.dataset.hwRecordGroup ?? group.dataset.hwInputGroup) !== node.value; });
        return;
      }
      if (node.hasAttribute('data-hw-select-all')) {
        panel.querySelectorAll('[data-hw-export-task]').forEach(choice => { choice.checked = node.checked; });
        selectedTasks = node.checked ? record.tasks.map(task => task.id) : [];
        updateSelection();
        return;
      }
      if (node.dataset.hwExportTask) {
        selectedTasks = [...panel.querySelectorAll('[data-hw-export-task]:checked')].map(choice => choice.dataset.hwExportTask);
        updateSelection();
        return;
      }
      if (!node.dataset.hwField || !active || blocked) return;
      if (!Object.hasOwn(draft, node.dataset.hwTask)) draft[node.dataset.hwTask] = {};
      draft[node.dataset.hwTask][node.dataset.hwField] = node.value;
      root.querySelectorAll('[data-hw-source-task]').forEach(output => {
        output.textContent = draft[output.dataset.hwSourceTask]?.[output.dataset.hwSourceField] || output.dataset.hwSourceEmpty || '尚未记录实验 1 的对照输出';
      });
      updateInvestigation();
      updateTaskCount(node.closest(taskSelector), record.tasks.find(task => task.id === node.dataset.hwTask));
      dirty = true;
      status(volatile ? errors.storage : '填写内容已更新，正在保存…', volatile);
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    });
    root.addEventListener('click', async event => {
      const tab = event.target.closest('[data-hw-task-tab]');
      if (tab) { selectTaskTab(tab); return; }
      const copy = event.target.closest('[data-hw-copy]');
      if (!copy || !record) return;
      const [taskIndex, runIndex] = copy.dataset.hwCopy.split(':');
      const task = record.tasks[Number(taskIndex)];
      const run = runIndex === 'compile' ? null : task.runs[Number(runIndex)];
      const command = run ? run.executionCommand || run.predictionCommand : task.compileCommand;
      try { await navigator.clipboard.writeText(command); status('命令已复制。'); }
      catch { status('复制失败，请直接选取命令文本复制。', true); }
    });
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-hw-task-tab]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      event.preventDefault();
      selectTaskTab(tabs[next], true);
    });
    panel.addEventListener('click', async event => {
      const button = event.target.closest('[data-hw-action]');
      if (!button) return;
      button.disabled = true;
      try {
        const action = button.dataset.hwAction;
        if (action === 'continue') await resume();
        if (action === 'report') await exported();
      } catch (failure) { error(failure); }
      finally {
        if (button.isConnected) button.disabled = false;
        updateSelection();
      }
    });
    addEventListener('storage', event => {
      if (event.key !== store.key && event.key !== null) return;
      if (!active) { renderPanel(); return; }
      const latest = store.load();
      if (latest.state !== 'valid' || latest.record.writerId !== writerId || latest.record.experimentId !== record.experimentId) changedElsewhere();
    });
    addEventListener('beforeunload', event => { if (active && (dirty || volatile || blocked)) { event.preventDefault(); event.returnValue = ''; } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && active && dirty) save(); });
    renderPanel();
  };
  return {mount};
})();