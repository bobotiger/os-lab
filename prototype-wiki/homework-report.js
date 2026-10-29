globalThis.OSLabHomeworkReport = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  const filled = value => typeof value === 'string' && value.trim() ? value : '未填写';
  const html = report => {
    const record = report.experiment;
    const metadata = [
      ['姓名', record.identity.name], ['学号', record.identity.studentId], ['章节', record.chapterTitle],
      ['作业', record.assignmentTitle], ['实验编号', record.experimentId], ['报告编号', report.reportId],
      ['导出时间', report.exportedAt], ['作业版本', record.definitionVersion], ['记录版本', record.version],
      ['导出题目', report.selection ? report.selection.taskNumbers.map(number => String(number).padStart(2, '0')).join('、') : '全部题目'],
      ['网页输入种子', record.generation.seed], ['生成规则版本', record.generation.version],
      ['输入生成规则', record.generation.rule], ['实验程序', record.program.name],
      ['程序版本', record.program.version],
      ...(record.program.sha256 ? [['公开程序 SHA-256', record.program.sha256]] : []),
      ...(record.program.verifiedLocalSha256 ? [['核对程序 SHA-256', record.program.verifiedLocalSha256]] : []),
      ['运行环境', record.program.runtime],
      ['程序获取地址', record.program.download],
    ];
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(record.assignmentTitle)} · ${escape(report.reportId)}</title><style>body{max-width:960px;margin:32px auto;padding:0 24px;color:#202d29;font-family:"Microsoft YaHei","Noto Sans CJK SC",sans-serif;line-height:1.7}h1{font-size:26px}h2{font-size:21px;margin-top:36px}h3{font-size:16px}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #bcc8c3;padding:9px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{width:24%}pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:14px}section{border-top:2px solid #437f68}footer{border-top:1px solid #bcc8c3;margin-top:32px;font-size:12px}@media print{body{max-width:none;margin:0;padding:0}thead{display:table-header-group}tr{break-inside:avoid}h2,h3{break-after:avoid}pre{white-space:pre-wrap}}@page{size:A4;margin:18mm}</style></head><body><h1>${escape(record.assignmentTitle)}实验报告</h1><p>报告格式：HTML。此文件未设置 PDF 水印或 PDF 编辑、复制权限。</p><table><tbody>${metadata.map(([label, value]) => `<tr><th>${escape(label)}</th><td><pre>${escape(value)}</pre></td></tr>`).join('')}</tbody></table>${record.tasks.map((task, index) => `<section><h2>${String(report.selection?.taskNumbers[index] ?? index + 1).padStart(2, '0')} · ${escape(task.title)}</h2><h3>核心问题</h3><p>${escape(task.question)}</p><p>${escape(task.conditions)}</p>${task.runs.map(run => `<h3>${escape(run.label)}</h3><p>实际输入：${escape(run.input)}${run.pythonSeed === null ? '' : `；Python 种子：${escape(run.pythonSeed)}`}</p><pre>${escape(run.predictionCommand)}</pre>`).join('')}<table><thead><tr><th>记录项</th><th>学生填写内容</th></tr></thead><tbody>${task.fields.map(field => `<tr><th>${escape(field.section)} · ${escape(field.label)}</th><td><pre>${escape(filled(record.responses[task.id]?.[field.id]))}</pre></td></tr>`).join('')}</tbody></table></section>`).join('')}<footer>实验编号：${escape(record.experimentId)} · 报告编号：${escape(report.reportId)}</footer></body></html>`;
  };
  return {escape, filled, html};
})();