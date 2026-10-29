globalThis.OSLabHomeworkPDF = (() => {
  const assetBase = typeof document === 'undefined' ? null : new URL('vendor/homework-pdf/', document.currentScript.src);
  let loading;
  const loadScript = filename => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(filename, assetBase).href;
    script.onload = resolve;
    script.onerror = () => { script.remove(); reject(new Error('pdf')); };
    document.head.append(script);
  });
  const ready = () => {
    if (!loading) loading = (async () => {
      await loadScript('pdfmake.min.js');
      await loadScript('noto-sc.js');
    })().catch(failure => { loading = null; throw failure; });
    return loading;
  };
  const wrap = value => {
    const lines = [];
    let line = '';
    let units = 0;
    for (const character of String(value)) {
      const size = character.codePointAt(0) > 255 ? 2 : 1;
      if (units + size > 48) { lines.push(line); line = ''; units = 0; }
      line += character;
      units += size;
    }
    if (line) lines.push(line);
    return lines;
  };
  const background = (identity, size) => {
    const lines = [...wrap(`姓名：${identity.name}`), ...wrap(`学号：${identity.studentId}`)];
    const rowHeight = Math.max(88, lines.length * 12 + 28);
    const tiles = [];
    for (let row = -3; row * rowHeight < size.height + 350; row++) {
      for (let column = -2; column * 240 < size.width + 350; column++) {
        const left = column * 240 + (Math.abs(row) % 2) * 120;
        const top = row * rowHeight;
        tiles.push(`<text x="${left}" y="${top}">${lines.map((line, index) => `<tspan x="${left}" dy="${index ? 12 : 0}">${OSLabHomeworkReport.escape(line)}</tspan>`).join('')}</text>`);
      }
    }
    return {svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}"><g font-family="NotoSC" font-size="9" fill="#75857e" opacity="0.07" transform="rotate(-25 ${size.width / 2} ${size.height / 2})">${tiles.join('')}</g></svg>`, width: size.width, height: size.height};
  };
  const documentDefinition = report => {
    const record = report.experiment;
      const tableLayout = {
        hLineWidth: index => index === 1 ? 0.8 : 0.35, vLineWidth: () => 0,
        hLineColor: () => '#ced8d5',
        paddingLeft: () => 8, paddingRight: () => 8,
        paddingTop: () => 5, paddingBottom: () => 5,
      };
      const table = (widths, body) => ({table: {widths, headerRows: 1, keepWithHeaderRows: 1, body}, layout: tableLayout, fontSize: 9, lineHeight: 1.15, margin: [0, 3, 0, 10]});
      const header = text => ({text, color: '#18675b', fillColor: '#f0f4f2', fontSize: 8});
      const answer = field => ({text: OSLabHomeworkReport.filled(record.responses[field.taskId]?.[field.id]), color: record.responses[field.taskId]?.[field.id]?.trim() ? '#202d29' : '#8a958e'});
    const compactRecord = field => {
      const text = record.responses[field.taskId]?.[field.id] || '';
      return Boolean(text.trim()) && text.split('\n').length <= 22 && text.length <= 1600 && text.split('\n').every(line => line.length <= 100);
    };
    const narrowLines = field => (record.responses[field.taskId]?.[field.id] || '').split('\n').reduce((lines, line) => lines + Math.max(1, Math.ceil([...line].reduce((units, character) => units + (character.codePointAt(0) > 255 ? 2 : 1), 0) / 46)), 0);
    const recordBlock = (field, run, paired = false) => ({stack: [
      {text: field.id.endsWith('-output') ? `${run.code} / ${run.label}` : `条件 ${run.code} · ${field.label}`, style: 'recordLabel'},
      {table: {widths: ['*'], body: [[{...answer(field), fontSize: paired ? 8 : 8.5, lineHeight: 1.1, preserveLeadingSpaces: true, fillColor: '#f5f7f6', margin: [8, 7, 8, 7]}]]}, layout: 'noBorders', margin: [0, 4, 0, 10]},
    ], unbreakable: compactRecord(field), headlineLevel: 1});
    const date = new Date(report.exportedAt);
    const exported = Number.isNaN(date.getTime()) ? report.exportedAt : new Intl.DateTimeFormat('zh-CN', {dateStyle: 'medium', timeStyle: 'short'}).format(date);
    const ledger = [];
    const content = [
      {columns: [{text: 'OSLab / OPERATING SYSTEMS', fontSize: 9, color: '#243a37', width: '*'}, {text: record.assignmentTitle, fontSize: 9, color: '#657572', alignment: 'right', width: '*'}], margin: [0, 0, 0, 18]},
      {text: `${record.chapterTitle}实验报告`, style: 'title'},
      {canvas: [{type: 'line', x1: 0, y1: 0, x2: 52, y2: 0, lineWidth: 3, lineColor: '#af5138'}], margin: [0, 0, 0, 16]},
      {columns: [{stack: [{text: '姓名 / 学号', style: 'metaLabel'}, {text: `${record.identity.name} · ${record.identity.studentId}`, fontSize: 11}], width: '*'}, {stack: [{text: '导出题目', style: 'metaLabel'}, {text: report.selection.taskNumbers.map(number => String(number).padStart(2, '0')).join(' / '), fontSize: 11}], width: 100}, {stack: [{text: '导出时间', style: 'metaLabel'}, {text: exported, fontSize: 9}], width: 150}], columnGap: 16, margin: [0, 0, 0, 20]},
      {canvas: [{type: 'line', x1: 0, y1: 0, x2: 503, y2: 0, lineWidth: 0.7, lineColor: '#243a37'}], margin: [0, 0, 0, 12]},
    ];
    for (const [index, task] of record.tasks.entries()) {
      const fields = task.fields.map(field => ({...field, taskId: task.id}));
      const rawRecords = [];
      const number = String(report.selection.taskNumbers[index]).padStart(2, '0');
      const taskLedger = [{text: `${number} · ${task.title}`, style: 'heading', headlineLevel: 1}, {text: task.question, fontSize: 10, lineHeight: 1.2, margin: [0, 0, 0, 6]}, {text: task.conditions, fontSize: 8.5, color: '#657572', margin: [0, 0, 0, 8]}];
      const groups = new Map();
      for (const [runIndex, run] of task.runs.entries()) {
        const key = run.pythonSeed ?? 'default';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({...run, code: String.fromCharCode(65 + runIndex)});
      }
      const hasAnalysis = fields.some(field => field.kind !== 'source' && !field.id.endsWith('-output') && record.responses[task.id]?.[field.id]?.trim());
      if (hasAnalysis) content.push({text: `${number} · ${task.title}`, style: 'heading', headlineLevel: 1});
      if (hasAnalysis) content.push({text: task.question, style: 'question'}, {text: task.conditions, fontSize: 9, color: '#657572', lineHeight: 1.2, margin: [0, 0, 0, 12]});
      const sharedSource = fields.filter(field => field.kind === 'source' && !task.runs.some(run => run.label === field.section));
      for (const field of sharedSource) taskLedger.push({text: field.label, style: 'recordLabel', headlineLevel: 1}, {...answer(field), margin: [0, 3, 0, 12]});
      if (task.compileCommand) taskLedger.push({text: '编译命令', style: 'subheading', headlineLevel: 1}, {text: task.compileCommand, fontSize: 8, margin: [0, 0, 0, 8]});
      for (const [groupIndex, [seed, runs]] of [...groups].entries()) {
        if (groupIndex) content.push({text: `${String(report.selection.taskNumbers[index]).padStart(2, '0')} · ${task.title}（续）`, style: 'heading', headlineLevel: 1});
        taskLedger.push({text: seed === 'default' ? '实验条件与命令' : `实验条件与命令 · Python 种子 ${seed}`, style: 'subheading', headlineLevel: 1});
        taskLedger.push(table([24, '*'], [[header('条件'), header('输入与执行命令')], ...runs.map(run => [{text: run.code, color: '#18675b'}, {stack: [{text: [{text: run.label, color: '#344b46'}, {text: ` · ${task.inputLabel || '进程输入'}：${run.input}`, color: '#657572'}], fontSize: 8.5, margin: [0, 0, 0, 3]}, {text: run.executionCommand || run.predictionCommand, fontSize: 8, color: '#202d29'}]}]) ]));
        const groupFields = fields.filter(field => runs.some(run => run.label === field.section));
        const scalarFields = groupFields.filter(field => !field.multiline);
        const labels = [...new Set(scalarFields.map(field => field.label))];
        if (labels.length) {
          const results = hasAnalysis ? content : taskLedger;
          results.push({text: '运行结果', style: 'subheading', headlineLevel: 1});
          const measured = runs.map(run => {
            const field = scalarFields.find(field => field.section === run.label && field.id.endsWith('-total'));
            const text = field && record.responses[task.id]?.[field.id]?.trim();
            const value = text && /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
            return {run, text, value: Number.isFinite(value) && value > 0 ? value : null};
          });
          const featured = measured.length === 2 && measured.every(item => item.value !== null);
          if (featured) {
            const maximum = Math.max(...measured.map(item => item.value));
            results.push({columns: measured.map((item, measureIndex) => ({width: '*', stack: [{text: `${item.run.code} / ${item.run.label}`, fontSize: 9, color: '#657572', margin: [0, 0, 0, 5]}, {text: item.text, fontSize: 32, color: measureIndex ? '#af5138' : '#18675b', margin: [0, 0, 0, 3]}, {text: '总时间 · 模拟时间单位', fontSize: 8, color: '#657572', margin: [0, 0, 0, 8]}, {canvas: [{type: 'rect', x: 0, y: 0, w: 205, h: 5, color: '#e5eae7'}, {type: 'rect', x: 0, y: 0, w: item.value / maximum * 205, h: 5, color: measureIndex ? '#af5138' : '#18675b'}]}]})), columnGap: 28, unbreakable: true, margin: [0, 2, 0, 14]});
          }
          const remainingLabels = featured ? labels.filter(label => !scalarFields.some(field => field.label === label && field.id.endsWith('-total'))) : labels;
          if (remainingLabels.length) results.push(table(['*', ...runs.map(() => runs.length === 1 ? 145 : 58)], [[header('记录项'), ...runs.map(run => header(`条件 ${run.code}`))], ...remainingLabels.map(label => [{text: label, color: '#496157'}, ...runs.map(run => {
            const field = scalarFields.find(candidate => candidate.label === label && candidate.section === run.label);
            return field ? answer(field) : '-';
          })])]));
        }
        const longFields = groupFields.filter(field => field.multiline);
        if (longFields.length) {
          const captionText = longFields.some(field => field.kind === 'source') ? '源码与运行输出' : task.layout === 'integrated' ? '原始输出' : '事件与时间记录';
          const caption = {text: `${captionText} · 实验 ${String(report.selection.taskNumbers[index]).padStart(2, '0')}`, style: 'subheading', headlineLevel: 1};
          const paired = runs.length === 2 && longFields.length === 2 && longFields.every(field => field.kind !== 'source' && field.id.endsWith('-output') && compactRecord(field) && narrowLines(field) <= 40);
          if (paired) rawRecords.push({stack: [caption, {columns: longFields.map(field => ({...recordBlock(field, runs.find(run => run.label === field.section), true), width: '*'})), columnGap: 14}], unbreakable: true});
          else {
            const blocks = [];
            for (const field of longFields) {
              const run = runs.find(candidate => candidate.label === field.section);
              const title = `条件 ${run.code} · ${field.label}`;
              if (record.responses[task.id]?.[field.id]?.trim()) blocks.push(recordBlock(field, run));
              else blocks.push({text: [{text: `${title}：`, color: '#496157'}, {text: '未填写', color: '#8a958e'}], fontSize: 9, lineHeight: 1.1, margin: [0, 0, 0, 4]});
            }
            const filled = longFields.filter(field => record.responses[task.id]?.[field.id]?.trim());
            if (longFields.length <= 2 && filled.length <= 1 && filled.every(compactRecord)) rawRecords.push({stack: [caption, ...blocks], unbreakable: true});
            else rawRecords.push(caption, ...blocks);
          }
        }
      }
      const reasoning = fields.filter(field => !task.runs.some(run => run.label === field.section) && !sharedSource.includes(field));
      if (reasoning.length) {
        const analysis = hasAnalysis ? content : taskLedger;
        const caption = task.answerTitle || (task.layout === 'integrated' ? '比较与解释' : '运行结果与分析');
        const singleBlank = reasoning.length === 1 && !record.responses[task.id]?.[reasoning[0].id]?.trim() && reasoning[0].label === caption;
        if (!singleBlank) analysis.push({text: caption, style: 'subheading', headlineLevel: 1});
        for (const field of reasoning) {
          if (record.responses[task.id]?.[field.id]?.trim()) analysis.push({text: field.label, style: 'recordLabel', headlineLevel: 1}, {...answer(field), fontSize: 9.5, lineHeight: 1.2, margin: [0, 3, 0, 9]});
          else analysis.push({text: [{text: `${field.label}：`, color: '#496157'}, {text: '未填写', color: '#8a958e'}], fontSize: 9, lineHeight: 1.1, margin: [0, 0, 0, 3]});
        }
      }
      const shortLedger = task.runs.length <= 2 && !fields.some(field => field.kind === 'source') && task.question.length <= 200 && task.conditions.length <= 300 && task.runs.every(run => (run.executionCommand || run.predictionCommand).length <= 300) && fields.filter(field => field.multiline && task.runs.some(run => run.label === field.section)).every(field => !record.responses[task.id]?.[field.id]?.trim() || (compactRecord(field) && narrowLines(field) <= 32));
      ledger.push({stack: [...taskLedger, ...rawRecords], unbreakable: shortLedger});
    }
    content.push({text: '运行记录与复核', style: 'title', pageBreak: 'before', margin: [0, 0, 0, 10]}, {text: '实验条件、执行命令与完整原始记录', fontSize: 10, color: '#657572', margin: [0, 0, 0, 16]}, ...ledger);
    return {
      info: {title: `${record.assignmentTitle}实验报告`, author: record.identity.name, subject: `实验 ${record.experimentId}；报告 ${report.reportId}`, creator: 'OSLab'},
      pageSize: 'A4', pageMargins: [46, 40, 46, Math.max(48, Math.ceil((record.identity.name.length + record.identity.studentId.length + 3) / 52) * 12 + 24)], defaultStyle: {font: 'NotoSC', fontSize: 10, color: '#202d29', lineHeight: 1.25},
      pageBreakBefore: (node, container) => node.headlineLevel === 1 && container.getFollowingNodesOnPage().length === 0,
      styles: {title: {fontSize: 32, color: '#172d2b', margin: [0, 0, 0, 12]}, heading: {fontSize: 16, color: '#172d2b', margin: [0, 16, 0, 9]}, pendingHeading: {fontSize: 10, color: '#657572', margin: [0, 9, 0, 4]}, question: {fontSize: 13, color: '#172d2b', lineHeight: 1.25, margin: [0, 0, 0, 8]}, subheading: {fontSize: 10, color: '#18675b', margin: [0, 12, 0, 7]}, recordLabel: {fontSize: 10, color: '#344b46', margin: [0, 8, 0, 0]}, metaLabel: {fontSize: 8, color: '#657572', margin: [0, 0, 0, 5]}},
      background: (pageNumber, size) => background(record.identity, size),
      footer: (pageNumber, pageCount) => ({margin: [46, 14, 46, 0], columns: [{text: `${record.identity.name} · ${record.identity.studentId}`, fontSize: 8}, {text: `${pageNumber} / ${pageCount}`, fontSize: 8, width: 60, alignment: 'right'}]}),
      version: '1.7ext3', language: 'zh-CN', tagged: true, ownerPassword: crypto.randomUUID(),
      permissions: {printing: 'highResolution', modifying: false, copying: false, annotating: false, fillingForms: false, contentAccessibility: true, documentAssembly: false},
      content,
    };
  };
  const render = async report => {
    try { await ready(); return await pdfMake.createPdf(documentDefinition(report)).getBuffer(); }
    catch (failure) { throw Object.assign(new Error('pdf'), {code: 'pdf', cause: failure}); }
  };
  return {documentDefinition, render};
})();