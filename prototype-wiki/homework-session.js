globalThis.OSLabHomeworkSession = (() => {
  const VERSION = 1;
  const fault = code => Object.assign(new Error(code), {code});
  const copy = value => structuredClone(value);
  const identity = value => {
    if (!value || typeof value.name !== 'string' || typeof value.studentId !== 'string') throw fault('identity');
    const result = {name: value.name.trim(), studentId: value.studentId.trim()};
    if (!result.name || !result.studentId || result.name.length > 80 || result.studentId.length > 80) throw fault('identity');
    return result;
  };
  const scopeKey = scope => [scope.project, 'homework', scope.chapterId, scope.assignmentId].map(encodeURIComponent).join(':');
  const validate = (record, scope) => {
    if (!record || record.version !== VERSION || record.chapterId !== scope.chapterId || record.assignmentId !== scope.assignmentId || record.project !== scope.project) throw fault('incompatible');
    identity(record.identity);
    if (typeof record.experimentId !== 'string' || !record.experimentId || typeof record.definitionVersion !== 'string' || !Number.isInteger(record.revision) || record.revision < 0 || !Array.isArray(record.tasks) || !record.tasks.length || record.tasks.length > 100 || !record.responses || typeof record.responses !== 'object') throw fault('corrupt');
    if (Array.isArray(record.responses) || typeof record.chapterTitle !== 'string' || typeof record.assignmentTitle !== 'string' || typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string' || !record.generation || typeof record.generation.version !== 'string' || typeof record.generation.rule !== 'string' || !['number', 'string'].includes(typeof record.generation.seed) || !record.program || typeof record.program.name !== 'string') throw fault('corrupt');
    if (new Set(record.tasks.map(task => task?.id)).size !== record.tasks.length) throw fault('corrupt');
    for (const task of record.tasks) {
      if (!task || typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.question !== 'string' || !Array.isArray(task.runs) || !Array.isArray(task.fields)) throw fault('corrupt');
      if (!task.runs.every(run => typeof run.label === 'string' && typeof run.command === 'string')) throw fault('corrupt');
      if (!task.fields.every(field => typeof field.id === 'string' && typeof field.label === 'string')) throw fault('corrupt');
      if (!task.id || new Set(task.fields.map(field => field.id)).size !== task.fields.length) throw fault('corrupt');
      if (record.responses[task.id] && (typeof record.responses[task.id] !== 'object' || Array.isArray(record.responses[task.id]))) throw fault('corrupt');
      for (const value of Object.values(record.responses[task.id] || {})) if (typeof value !== 'string' || value.length > 20000) throw fault('corrupt');
    }
    return record;
  };
  const createRecord = (scope, definition, student, seed, experimentId, createdAt) => validate({
    version: VERSION, ...scope, identity: identity(student), experimentId,
    createdAt, updatedAt: createdAt, definitionVersion: definition.version,
    chapterTitle: definition.chapterTitle, assignmentTitle: definition.assignmentTitle,
    generation: {seed, version: definition.generationVersion, rule: definition.generationRule},
    program: copy(definition.program), tasks: copy(definition.generate(seed)),
    responses: {}, revision: 0, writerId: null,
  }, scope);
  const report = (record, reportId, exportedAt, taskIds = record.tasks.map(task => task.id)) => {
    if (!Array.isArray(taskIds) || !taskIds.length || new Set(taskIds).size !== taskIds.length || taskIds.some(id => !record.tasks.some(task => task.id === id))) throw fault('selection');
    const experiment = copy(record);
    const selected = new Set(taskIds);
    const taskNumbers = record.tasks.flatMap((task, index) => selected.has(task.id) ? [index + 1] : []);
    experiment.tasks = experiment.tasks.filter(task => selected.has(task.id));
    experiment.responses = Object.fromEntries(Object.entries(experiment.responses).filter(([id]) => selected.has(id)));
    return {reportVersion: VERSION, reportId, exportedAt, selection: {taskIds: experiment.tasks.map(task => task.id), taskNumbers, totalTasks: record.tasks.length}, experiment};
  };
  const filename = (record, reportId, extension) => {
    const part = value => {
      let result = '';
      for (const character of value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')) {
        if (new TextEncoder().encode(result + character).length > 90) break;
        result += character;
      }
      return result.replace(/[. ]+$/g, '') || '_';
    };
    return `${part(record.identity.name)}_${part(record.identity.studentId)}_${part(reportId)}.${extension}`;
  };
  const createStore = (storage, scope, runExclusive, writerId) => {
    const key = scopeKey(scope);
    const archiveValue = value => {
      try { storage.setItem(`${key}:recovery`, JSON.stringify({expiresAt: Date.now() + 86400000, value})); } catch { throw fault('storage'); }
    };
    const load = () => {
      try {
        const recovery = storage.getItem(`${key}:recovery`);
        if (recovery) {
          try {
            const value = JSON.parse(recovery);
            if (!Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) storage.removeItem(`${key}:recovery`);
          } catch { storage.removeItem(`${key}:recovery`); }
        }
        const raw = storage.getItem(key);
        if (raw === null) return {state: 'empty', raw: null};
        if (raw.length > 3000000) return {state: 'corrupt', raw};
        let record;
        try { record = JSON.parse(raw); } catch { return {state: 'corrupt', raw}; }
        try { validate(record, scope); } catch (error) { return {state: error.code === 'incompatible' ? 'incompatible' : 'corrupt', raw}; }
        return {state: 'valid', raw, record};
      } catch { return {state: 'storage', raw: null}; }
    };
    const transaction = async callback => {
      if (!runExclusive) throw fault('locks');
      return runExclusive(key, () => {
        const previous = load();
        if (previous.state === 'storage') throw fault('storage');
        return callback(previous);
      });
    };
    const persist = record => {
      validate(record, scope);
      try { storage.setItem(key, JSON.stringify(record)); } catch { throw fault('storage'); }
      return copy(record);
    };
    const owned = (previous, record) => {
      if (previous.state !== 'valid' || previous.record.experimentId !== record.experimentId || previous.record.revision !== record.revision || previous.record.writerId !== writerId) throw fault('conflict');
      if (JSON.stringify(previous.record.identity) !== JSON.stringify(record.identity) || previous.record.definitionVersion !== record.definitionVersion || JSON.stringify(previous.record.tasks) !== JSON.stringify(record.tasks) || JSON.stringify(previous.record.generation) !== JSON.stringify(record.generation) || JSON.stringify(previous.record.program) !== JSON.stringify(record.program)) throw fault('conflict');
    };
    return {
      key, load,
      create: (record, expectedRaw = null) => transaction(previous => {
        if (previous.raw !== expectedRaw) throw fault('conflict');
        if (previous.raw !== null) {
          if (previous.state === 'valid' && previous.record.definitionVersion === record.definitionVersion) throw fault('conflict');
          archiveValue(previous.raw);
        }
        return persist({...copy(record), writerId, revision: 1});
      }),
      claim: record => transaction(previous => {
        if (previous.state !== 'valid' || previous.record.experimentId !== record.experimentId || previous.record.revision !== record.revision) throw fault('conflict');
        return persist({...previous.record, writerId, revision: previous.record.revision + 1});
      }),
      save: record => transaction(previous => {
        owned(previous, record);
        return persist({...copy(record), writerId, revision: record.revision + 1});
      }),
      archive: (record, snapshot) => transaction(previous => {
        owned(previous, record);
        archiveValue(snapshot);
      }),
      clear: record => transaction(previous => {
        owned(previous, record);
        try { storage.removeItem(key); } catch { throw fault('storage'); }
      }),
      discard: expectedRaw => transaction(previous => {
        if (previous.raw !== expectedRaw) throw fault('conflict');
        try { storage.removeItem(key); } catch { throw fault('storage'); }
      }),
    };
  };
  return {VERSION, identity, scopeKey, validate, createRecord, report, filename, createStore};
})();