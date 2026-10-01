var OSLabSimulation = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // wiki-engine-entry.ts
  var wiki_engine_entry_exports = {};
  __export(wiki_engine_entry_exports, {
    DEMAND_FRAME_COUNT: () => DEMAND_FRAME_COUNT,
    FRAME_COUNT: () => FRAME_COUNT,
    PAGE_SIZE: () => PAGE_SIZE,
    advance: () => advance,
    createRun: () => createRun,
    demandPagingScene: () => demandPagingScene,
    translateAddress: () => translateAddress
  });

  // src/strategy.ts
  var queueHead = (candidates) => [...candidates].sort((left, right) => left.readyOrder - right.readyOrder)[0];
  var queueCandidates = (candidates) => candidates.map((candidate) => candidate.id).join("\u3001") || "\u7A7A";
  var strategyKinds = ["FCFS", "SJF", "RR", "SRTF"];
  function isStrategyKind(value) {
    return typeof value === "string" && strategyKinds.includes(value);
  }
  var strategyDefinitions = {
    FCFS: {
      kind: "FCFS",
      isPreemptive: false,
      label: () => "FCFS",
      description: () => "\u5148\u6765\u5148\u670D\u52A1 FCFS\uFF08\u4E0D\u53EF\u62A2\u5360\uFF09",
      parameterDescription: () => "FCFS \u4E0D\u53EF\u62A2\u5360\uFF1B\u6309\u5C31\u7EEA\u961F\u5217\u987A\u5E8F\u9009\u62E9\u3002",
      timeSlice: () => null,
      chooseCandidate: queueHead,
      describeCandidates: queueCandidates,
      explainDispatch: (candidates, selected) => candidates.length <= 1 ? `\u7B49\u5F85\u961F\u5217\u91CC\u53EA\u6709 ${selected}\uFF0C\u6240\u4EE5\u7EE7\u7EED\u9009\u5B83\u3002` : `\u5019\u9009 ${queueCandidates(candidates)}\uFF1B\u6309\u961F\u5217\u987A\u5E8F\uFF0C\u6392\u5728\u6700\u524D\u9762\u7684 ${selected} \u88AB\u9009\u4E2D\u3002`,
      explainContinuation: (_strategy, current) => `\u5F53\u524D\u7B56\u7565\u4E0D\u4F1A\u4E2D\u9014\u66F4\u6362\u6B63\u5728\u8FD0\u884C\u7684\u8FDB\u7A0B\uFF0C\u8981\u7B49 ${current} \u81EA\u5DF1\u6267\u884C\u5B8C\u3002`,
      explainPreemption: () => "",
      decisionRule: "\u6309\u961F\u9996\u9009\u62E9"
    },
    SJF: {
      kind: "SJF",
      isPreemptive: false,
      label: () => "SJF",
      description: () => "\u6700\u77ED\u4EFB\u52A1\u4F18\u5148 SJF\uFF08\u4E0D\u53EF\u62A2\u5360\uFF09",
      parameterDescription: () => "SJF \u975E\u62A2\u5360\uFF0C\u9884\u5148\u77E5\u9053\u4E0B\u4E00\u6BB5 CPU \u65F6\u957F\uFF1B\u5E76\u5217\u6309\u5C31\u7EEA\u5165\u961F\u987A\u5E8F\u3002",
      timeSlice: () => null,
      chooseCandidate: (candidates) => [...candidates].sort((left, right) => left.duration - right.duration || left.readyOrder - right.readyOrder)[0],
      describeCandidates: (candidates) => candidates.map((candidate) => `${candidate.id}(\u9700\u6C42=${candidate.duration},\u4E0B\u4E00\u6BB5 CPU=${candidate.duration},\u5C31\u7EEA\u5E8F=${candidate.readyOrder + 1})`).join("\u3001") || "\u7A7A",
      explainDispatch: (candidates, selected) => `\u5019\u9009\u4E0B\u4E00\u6BB5 CPU \u65F6\u957F\uFF1A${candidates.map((candidate) => `${candidate.id}=${candidate.duration}`).join("\uFF0C")}\uFF1B${selected} \u6700\u77ED\uFF0C\u56E0\u6B64\u88AB\u9009\u4E2D\u3002`,
      explainContinuation: (_strategy, current) => `\u5F53\u524D\u7B56\u7565\u4E0D\u4F1A\u4E2D\u9014\u66F4\u6362\u6B63\u5728\u8FD0\u884C\u7684\u8FDB\u7A0B\uFF0C\u8981\u7B49 ${current} \u81EA\u5DF1\u6267\u884C\u5B8C\u3002`,
      explainPreemption: () => "",
      decisionRule: "\u4E0B\u4E00\u6BB5 CPU \u6700\u77ED\uFF0C\u5E76\u5217\u6309\u5C31\u7EEA\u5165\u961F\u987A\u5E8F"
    },
    SRTF: {
      kind: "SRTF",
      isPreemptive: true,
      label: () => "SRTF",
      description: () => "\u62A2\u5360\u5F0F SJF\uFF08SRTF\uFF0C\u6700\u77ED\u5269\u4F59\u65F6\u95F4\u4F18\u5148\uFF09",
      parameterDescription: () => "SRTF \u53EF\u62A2\u5360\uFF1B\u6BD4\u8F83\u5F53\u524D CPU \u6BB5\u5269\u4F59\u65F6\u95F4\uFF0C\u4E25\u683C\u66F4\u77ED\u624D\u62A2\u5360\uFF1B\u5E76\u5217\u6309\u5C31\u7EEA\u987A\u5E8F\u9009\u53D6\u3002",
      timeSlice: () => null,
      chooseCandidate: (candidates) => [...candidates].sort((left, right) => left.duration - right.duration || left.readyOrder - right.readyOrder)[0],
      describeCandidates: (candidates) => candidates.map((candidate) => `${candidate.id}(\u5F53\u524D CPU \u6BB5\u5269\u4F59=${candidate.duration},\u5C31\u7EEA\u5E8F=${candidate.readyOrder + 1})`).join("\u3001") || "\u7A7A",
      explainDispatch: (candidates, selected) => `\u5019\u9009\u5F53\u524D CPU \u6BB5\u5269\u4F59\u65F6\u95F4\uFF1A${candidates.map((candidate) => `${candidate.id}=${candidate.duration}`).join("\uFF0C")}\uFF1B${selected} \u6700\u77ED\uFF0C\u5E76\u5217\u6309\u5C31\u7EEA\u5165\u961F\u987A\u5E8F\uFF0C\u56E0\u6B64\u88AB\u9009\u4E2D\u3002`,
      explainContinuation: (_strategy, current, _sliceUsed, candidates, currentRemaining) => {
        const waiting = candidates.map((candidate) => `${candidate.id}=${candidate.duration}`).join("\uFF0C") || "\u65E0";
        const shortest = [...candidates].sort((left, right) => left.duration - right.duration || left.readyOrder - right.readyOrder)[0];
        return shortest ? `\u5C31\u7EEA\u5019\u9009\u5F53\u524D CPU \u6BB5\u5269\u4F59\u65F6\u95F4\uFF1A${waiting}\uFF1B\u8FD0\u884C\u8005 ${current} \u5269\u4F59 ${currentRemaining}\u3002\u5019\u9009\u6700\u77ED\u503C\u4E0D\u4E25\u683C\u5C0F\u4E8E\u8FD0\u884C\u8005\uFF0C\u56E0\u6B64\u4E0D\u62A2\u5360\uFF08\u76F8\u7B49\u65F6\u4FDD\u7559\u5F53\u524D\u8FD0\u884C\u8005\uFF09\u3002` : `\u5C31\u7EEA\u961F\u5217\u4E3A\u7A7A\uFF1B\u8FD0\u884C\u8005 ${current} \u5F53\u524D CPU \u6BB5\u5269\u4F59 ${currentRemaining}\uFF0C\u7EE7\u7EED\u8FD0\u884C\u3002`;
      },
      explainPreemption: (candidates, current, currentRemaining, selected) => `\u5019\u9009\u5F53\u524D CPU \u6BB5\u5269\u4F59\u65F6\u95F4\uFF1A${candidates.map((candidate) => `${candidate.id}=${candidate.duration}`).join("\uFF0C")}\uFF1B\u8FD0\u884C\u8005 ${current} \u5269\u4F59 ${currentRemaining}\uFF1B${selected} \u66F4\u77ED\uFF0C\u4E25\u683C\u5C0F\u4E8E\u8FD0\u884C\u8005\uFF0C\u56E0\u6B64\u62A2\u5360\u3002`,
      decisionRule: "\u5F53\u524D CPU \u6BB5\u5269\u4F59\u65F6\u95F4\u6700\u77ED\uFF0C\u5E76\u5217\u6309\u5C31\u7EEA\u5165\u961F\u987A\u5E8F\uFF1B\u4EC5\u4E25\u683C\u77ED\u4E8E\u8FD0\u884C\u8005\u65F6\u62A2\u5360"
    },
    RR: {
      kind: "RR",
      isPreemptive: true,
      label: (strategy) => strategy.kind === "RR" ? `RR q=${strategy.quantum}` : "RR",
      description: (strategy) => strategy.kind === "RR" ? `\u65F6\u95F4\u7247\u8F6E\u8F6C RR\uFF08\u65F6\u95F4\u7247 ${strategy.quantum}\uFF0C\u53EF\u62A2\u5360\uFF09` : "\u65F6\u95F4\u7247\u8F6E\u8F6C RR\uFF08\u53EF\u62A2\u5360\uFF09",
      parameterDescription: (strategy) => strategy.kind === "RR" ? `RR \u53EF\u62A2\u5360\uFF1B\u65F6\u95F4\u7247 q=${strategy.quantum}\u3002` : "RR \u53EF\u62A2\u5360\uFF1B\u9700\u8BBE\u7F6E\u65F6\u95F4\u7247\u3002",
      timeSlice: (strategy) => strategy.kind === "RR" ? strategy.quantum : null,
      chooseCandidate: queueHead,
      describeCandidates: queueCandidates,
      explainDispatch: (candidates, selected) => candidates.length <= 1 ? `\u7B49\u5F85\u961F\u5217\u91CC\u53EA\u6709 ${selected}\uFF0C\u6240\u4EE5\u7EE7\u7EED\u9009\u5B83\u3002` : `\u5019\u9009 ${queueCandidates(candidates)}\uFF1B\u6309\u961F\u5217\u987A\u5E8F\uFF0C\u6392\u5728\u6700\u524D\u9762\u7684 ${selected} \u88AB\u9009\u4E2D\u3002`,
      explainContinuation: (strategy, current, sliceUsed) => `RR \u53EA\u6709\u7528\u5B8C\u65F6\u95F4\u7247\u624D\u4F1A\u6362\u4EBA\uFF0C${current} \u8FD9\u4E00\u8F6E\u5DF2\u7ECF\u7528\u4E86 ${sliceUsed}${strategy.kind === "RR" ? `/${strategy.quantum}` : ""}\u3002`,
      explainPreemption: () => "",
      decisionRule: "\u6309\u961F\u9996\u9009\u62E9"
    }
  };

  // src/config.ts
  var ConfigError = class extends Error {
    constructor(issues) {
      super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
      this.issues = issues;
    }
    issues;
  };
  var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
  function parseConfig(value) {
    const data = record(value);
    const issues = [];
    const issue = (path, message) => issues.push({ path, message });
    const integer = (input, min, max, path) => {
      if (typeof input !== "number" || !Number.isInteger(input) || input < min || input > max) {
        issue(path, `\u5FC5\u987B\u662F ${min}\u2013${max} \u7684\u6574\u6570`);
        return NaN;
      }
      return input;
    };
    if (data.formatVersion !== 1) issue("formatVersion", "\u4E0D\u652F\u6301\u7684\u683C\u5F0F\u7248\u672C");
    const rulesVersion = data.rulesVersion === "1" || data.rulesVersion === "2" ? data.rulesVersion : null;
    if (!rulesVersion) issue("rulesVersion", "\u4E0D\u652F\u6301\u7684\u6A21\u62DF\u89C4\u5219\u7248\u672C");
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name) issue("name", "\u5B9E\u9A8C\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    const machine = record(data.machine);
    const expectedIo = rulesVersion === "2" ? "simplified" : false;
    if (machine.cpus !== 1 || machine.io !== expectedIo || machine.contextSwitchCost !== 0) {
      issue("machine", "\u4EC5\u652F\u6301\u5355 CPU\u3001\u65E0\u8BBE\u5907\u6392\u961F\u7684\u7B80\u5316 I/O\u3001\u96F6\u5207\u6362\u5F00\u9500");
    }
    const inputStrategy = record(data.strategy);
    let strategy = { kind: "FCFS" };
    if (!isStrategyKind(inputStrategy.kind)) issue("strategy.kind", "\u7B56\u7565\u5FC5\u987B\u662F RR\u3001FCFS\u3001SJF \u6216 SRTF");
    else if (inputStrategy.kind === "RR") {
      strategy = { kind: "RR", quantum: integer(inputStrategy.quantum, 1, 100, "strategy.quantum") };
    } else {
      strategy = { kind: inputStrategy.kind };
      if ("quantum" in inputStrategy) issue("strategy.quantum", "\u975E RR \u7B56\u7565\u4E0D\u80FD\u5305\u542B\u65F6\u95F4\u7247");
    }
    const rows = Array.isArray(data.processes) ? data.processes : [];
    if (rows.length > 20) issue("processes", "\u6700\u591A 20 \u4E2A\u8FDB\u7A0B");
    const identifiers = /* @__PURE__ */ new Map();
    const processes = rows.map((row, index) => {
      const process = record(row);
      const id = typeof process.id === "string" ? process.id.trim() : "";
      if (!id || [...id].length > 20) issue(`processes.${index}.id`, "\u6807\u8BC6\u9700\u4E3A 1\u201320 \u4E2A\u5B57\u7B26");
      const duplicate = identifiers.get(id);
      if (duplicate !== void 0) {
        issue(`processes.${index}.id`, "\u6807\u8BC6\u91CD\u590D");
        const firstPath = `processes.${duplicate}.id`;
        if (!issues.some((entry) => entry.path === firstPath && entry.message === "\u6807\u8BC6\u91CD\u590D")) issue(firstPath, "\u6807\u8BC6\u91CD\u590D");
      } else identifiers.set(id, index);
      const arrival = integer(process.arrival, 0, 1e5, `processes.${index}.arrival`);
      const submittedAt = process.submittedAt === void 0 ? void 0 : integer(process.submittedAt, 0, 1e5, `processes.${index}.submittedAt`);
      if (submittedAt !== void 0 && submittedAt > arrival) issue(`processes.${index}.submittedAt`, "\u63D0\u4EA4\u65F6\u523B\u4E0D\u80FD\u665A\u4E8E\u5230\u8FBE\u65F6\u523B");
      const submittedAfterEvent = process.submittedAfterEvent === void 0 ? void 0 : integer(process.submittedAfterEvent, 0, 1e9, `processes.${index}.submittedAfterEvent`);
      if (submittedAt === void 0 && submittedAfterEvent !== void 0) issue(`processes.${index}.submittedAfterEvent`, "\u63D0\u4EA4\u4E8B\u4EF6\u8FB9\u754C\u53EA\u80FD\u7528\u4E8E\u52A8\u6001\u63D0\u4EA4\u8BB0\u5F55");
      let steps;
      let burst;
      if (rulesVersion === "2" && Array.isArray(process.steps)) {
        if (process.steps.length < 1 || process.steps.length > 12) issue(`processes.${index}.steps`, "\u6B65\u9AA4\u6570\u5FC5\u987B\u662F 1\u201312");
        let cpuTotal = 0;
        let durationTotal = 0;
        steps = process.steps.map((rawStep, stepIndex) => {
          const step = record(rawStep);
          if (step.type !== "CPU" && step.type !== "IO") issue(`processes.${index}.steps.${stepIndex}.type`, "\u6B65\u9AA4\u7C7B\u578B\u5FC5\u987B\u662F CPU \u6216 IO");
          const duration = integer(step.duration, 1, 100, `processes.${index}.steps.${stepIndex}.duration`);
          durationTotal += Number.isFinite(duration) ? duration : 0;
          if (step.type === "CPU" && Number.isFinite(duration)) cpuTotal += duration;
          return { type: step.type === "IO" ? "IO" : "CPU", duration };
        });
        if (steps[0]?.type !== "CPU") issue(`processes.${index}.steps`, "\u884C\u4E3A\u5E8F\u5217\u5FC5\u987B\u4ECE CPU \u6B65\u9AA4\u5F00\u59CB");
        if (!steps.some((step) => step.type === "CPU")) issue(`processes.${index}.steps`, "\u884C\u4E3A\u5E8F\u5217\u81F3\u5C11\u9700\u8981\u4E00\u4E2A CPU \u6B65\u9AA4");
        if (durationTotal > 600) issue(`processes.${index}.steps`, "\u5355\u8FDB\u7A0B\u6B65\u9AA4\u603B\u65F6\u957F\u6700\u591A 600");
        burst = cpuTotal;
        if ("burst" in process && integer(process.burst, 1, 600, `processes.${index}.burst`) !== cpuTotal) {
          issue(`processes.${index}.burst`, "\u517C\u5BB9 CPU \u603B\u9700\u6C42\u5FC5\u987B\u7B49\u4E8E CPU \u6B65\u9AA4\u65F6\u957F\u4E4B\u548C");
        }
      } else {
        if (rulesVersion === "2" && "steps" in process) issue(`processes.${index}.steps`, "\u6B65\u9AA4\u5FC5\u987B\u662F\u6570\u7EC4");
        burst = integer(process.burst, 1, rulesVersion === "2" ? 600 : 100, `processes.${index}.burst`);
      }
      const seed = process.seed === void 0 ? void 0 : integer(process.seed, 0, 4294967295, `processes.${index}.seed`);
      return {
        id,
        arrival,
        ...submittedAt === void 0 ? {} : { submittedAt },
        ...submittedAfterEvent === void 0 ? {} : { submittedAfterEvent },
        burst,
        ...steps ? { steps } : {},
        ...seed === void 0 ? {} : { seed }
      };
    });
    if (issues.length) throw new ConfigError(issues);
    return {
      formatVersion: 1,
      rulesVersion,
      name,
      machine: { cpus: 1, io: expectedIo, contextSwitchCost: 0 },
      strategy,
      processes
    };
  }
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  }

  // src/simulation.ts
  function stepsFor(process) {
    return process.steps?.map((step) => ({ ...step })) ?? [{ type: "CPU", duration: process.burst }];
  }
  function computeIdle(state) {
    return state.running === null && state.queue.length === 0 && !state.processes.some((process) => process.status === "\u672A\u63D0\u4EA4" || process.status === "\u672A\u5230\u8FBE" || process.status === "\u963B\u585E");
  }
  function snapshotState(state) {
    const snapshot = structuredClone(state);
    snapshot.idle = computeIdle(snapshot);
    return snapshot;
  }
  function hasFutureSubmission(run) {
    return run.config.processes.some((process) => process.submittedAt !== void 0 && (process.submittedAt > run.state.time || process.submittedAt === run.state.time && (process.submittedAfterEvent ?? 0) >= run.events.length) && !run.state.processes.some((current) => current.id === process.id));
  }
  function makeProcess(process, order) {
    const steps = stepsFor(process);
    return {
      ...process,
      order,
      steps,
      currentStepIndex: 0,
      stepRemaining: steps[0].duration,
      remaining: process.burst,
      cpuTime: 0,
      readyWaitTime: 0,
      blockedTime: 0,
      blockedUntil: null,
      status: process.submittedAt === void 0 ? "\u672A\u5230\u8FBE" : "\u672A\u63D0\u4EA4",
      firstStart: null,
      completion: null
    };
  }
  var queueText = (queue) => queue.length ? queue.join("\u3001") : "\u7A7A";
  var processById = (state, id) => state.processes.find((process) => process.id === id);
  var currentStep = (process) => process.steps[process.currentStepIndex];
  var nextCpuDuration = (process) => currentStep(process)?.type === "CPU" ? currentStep(process).duration : Number.POSITIVE_INFINITY;
  var candidateDuration = (process, strategy) => strategy.kind === "SRTF" ? process.stepRemaining : nextCpuDuration(process);
  function createRun(input) {
    const config = parseConfig(input);
    const processes = config.processes.flatMap((process, order) => process.submittedAt === void 0 ? [makeProcess(process, order)] : []);
    const state = { time: 0, running: null, queue: [], sliceUsed: 0, processes };
    return freeze({ config, state: { ...state, idle: computeIdle(state) }, events: [], timeline: [] });
  }
  function select(state, strategy) {
    const candidates = state.queue.map((id, readyOrder) => ({ id, readyOrder, duration: candidateDuration(processById(state, id), strategy) }));
    return strategyDefinitions[strategy.kind].chooseCandidate(candidates).id;
  }
  function sliceRemaining(state, strategy) {
    const timeSlice = strategyDefinitions[strategy.kind].timeSlice(strategy);
    return timeSlice === null ? Number.POSITIVE_INFINITY : timeSlice - state.sliceUsed;
  }
  function enqueueReady(process, state) {
    process.status = "\u5C31\u7EEA";
    process.blockedUntil = null;
    state.queue.push(process.id);
  }
  function completeProcess(process, state) {
    process.status = "\u5B8C\u6210";
    process.completion = state.time;
    process.currentStepIndex = process.steps.length;
    process.stepRemaining = 0;
    process.remaining = 0;
    process.blockedUntil = null;
  }
  function settleDispatch(state, strategy, emit, trigger, runningBefore) {
    if (!state.running && state.queue.length) {
      const selected = select(state, strategy);
      const completed = state.processes.find((process) => process.status === "\u5B8C\u6210" && process.completion === state.time);
      const cause = trigger || (completed ? `${completed.id} \u7684\u6700\u540E\u4E00\u4E2A CPU \u6B65\u9AA4\u5B8C\u6210\u3002` : "");
      const definition = strategyDefinitions[strategy.kind];
      const candidates = definition.describeCandidates(state.queue.map((id, readyOrder) => ({ id, readyOrder, duration: candidateDuration(processById(state, id), strategy) })));
      const same = runningBefore?.id === selected && runningBefore.remaining > 0 ? strategy.kind === "RR" ? "\u4EC5\u81EA\u8EAB\u53EF\u8FD0\u884C\uFF0C\u7247\u6EE1\u540E\u7EE7\u7EED\u81EA\u8EAB\uFF0C\u5E76\u672A\u5207\u6362\u5230\u5176\u4ED6\u8FDB\u7A0B\u3002" : "\u4EC5\u81EA\u8EAB\u53EF\u8FD0\u884C\uFF0C\u6B65\u9AA4\u5B8C\u6210\u540E\u7EE7\u7EED\u81EA\u8EAB\uFF0C\u5E76\u672A\u5207\u6362\u5230\u5176\u4ED6\u8FDB\u7A0B\u3002" : "";
      emit("\u6D3E\u53D1", selected, `${cause}\u5019\u9009 ${candidates}\uFF1B${definition.decisionRule}\uFF0C\u56E0\u6B64\u9009\u4E2D ${selected}\u3002${same}`, () => {
        state.queue.splice(state.queue.indexOf(selected), 1);
        const process = processById(state, selected);
        process.status = "\u8FD0\u884C";
        process.firstStart ??= state.time;
        state.running = selected;
        state.sliceUsed = 0;
      });
    } else if (state.running) {
      const definition = strategyDefinitions[strategy.kind];
      const timeSlice = definition.timeSlice(strategy);
      const current = processById(state, state.running);
      const readyCandidates = state.queue.map((id, readyOrder) => ({ id, readyOrder, duration: candidateDuration(processById(state, id), strategy) }));
      if (strategy.kind === "SRTF") {
        const selected = definition.chooseCandidate(readyCandidates);
        if (selected && selected.duration < current.stepRemaining) {
          const reason = definition.explainPreemption(readyCandidates, current.id, current.stepRemaining, selected.id);
          emit("\u62A2\u5360", selected.id, reason, () => {
            state.queue.splice(state.queue.indexOf(selected.id), 1);
            enqueueReady(current, state);
            current.status = "\u5C31\u7EEA";
            const process = processById(state, selected.id);
            process.status = "\u8FD0\u884C";
            process.firstStart ??= state.time;
            state.running = selected.id;
            state.sliceUsed = 0;
          });
          return;
        }
      }
      const detail = definition.isPreemptive ? timeSlice === null ? `${strategy.kind} \u4E3A\u53EF\u62A2\u5360\u7B56\u7565\u3002` : `\u672C\u8F6E\u5DF2\u7528 ${state.sliceUsed}/${timeSlice}\uFF0C\u5230\u8FBE\u4E0D\u91CD\u7F6E\u65F6\u95F4\u7247\uFF1BI/O \u5524\u9192\u4E5F\u4E0D\u91CD\u7F6E\u65F6\u95F4\u7247\u3002` : `${strategy.kind} \u4E3A\u975E\u62A2\u5360\u7B56\u7565\uFF0C\u65B0\u5230\u8FBE\u6216 I/O \u5524\u9192\u4EFB\u52A1\u7B49\u5F85\u5F53\u524D CPU \u6B65\u9AA4\u5B8C\u6210\u3002`;
      const explanation = definition.explainContinuation(strategy, state.running, state.sliceUsed, readyCandidates, current.stepRemaining);
      emit("\u7EE7\u7EED", state.running, strategy.kind === "SRTF" ? explanation : `\u6CA1\u6709\u89E6\u53D1\u62A2\u5360\uFF0C${state.running} \u7EE7\u7EED\u8FD0\u884C\uFF1B${detail}`);
    }
  }
  function nextEventTime(state, config, strategy, eventCount) {
    const times = [];
    for (const process of config.processes) {
      if (process.submittedAt === void 0 || state.processes.some((current) => current.id === process.id)) continue;
      if (process.submittedAt > state.time) times.push(process.submittedAt);
      else if (process.submittedAt === state.time && (process.submittedAfterEvent ?? 0) <= eventCount) times.push(state.time);
    }
    for (const process of state.processes) {
      if (process.status === "\u672A\u5230\u8FBE") times.push(process.arrival);
      if (process.status === "\u672A\u63D0\u4EA4") times.push(process.submittedAt);
      if (process.status === "\u963B\u585E" && process.blockedUntil !== null) times.push(process.blockedUntil);
    }
    if (state.running) {
      times.push(state.time + processById(state, state.running).stepRemaining);
      if (strategyDefinitions[strategy.kind].timeSlice(strategy) !== null) times.push(state.time + sliceRemaining(state, strategy));
    }
    return times.length ? Math.min(...times) : Number.POSITIVE_INFINITY;
  }
  function advance(previous) {
    if (previous.state.idle && !hasFutureSubmission(previous) && !previous.state.processes.some((process) => process.status === "\u672A\u63D0\u4EA4")) return previous;
    const state = structuredClone(previous.state), events = [...previous.events], timeline = [...previous.timeline];
    const strategy = previous.config.strategy;
    const emit = (type, process, reason, mutate = () => {
    }) => {
      const before = snapshotState(state);
      mutate();
      events.push(freeze({ sequence: events.length + 1, time: state.time, type, process, reason, before, after: snapshotState(state), strategy }));
    };
    const submissionsNow = previous.config.processes.map((process, order) => ({ process, order })).filter((item) => item.process.submittedAt === state.time && (item.process.submittedAfterEvent ?? 0) <= events.length && !state.processes.some((current) => current.id === item.process.id));
    if (submissionsNow.length) {
      for (const { process: input, order } of submissionsNow) {
        const process = makeProcess(input, order);
        emit("\u5230\u8FBE", process.id, `${process.id} \u5728 t=${state.time} \u52A8\u6001\u63D0\u4EA4\uFF0C\u5230\u8FBE\u5E76\u6309\u63D0\u4EA4\u987A\u5E8F\u5165\u961F\u3002`, () => {
          state.processes.push(process);
          enqueueReady(process, state);
        });
        settleDispatch(state, strategy, emit, "", null);
      }
      state.idle = computeIdle(state);
      const result2 = { config: previous.config, state, events, timeline };
      assertInvariants(result2);
      return freeze(result2);
    }
    const runningBefore = state.running === null ? null : processById(state, state.running);
    const oldTime = state.time, nextTime = nextEventTime(state, previous.config, strategy, events.length);
    if (!Number.isFinite(nextTime)) return previous;
    if (nextTime < state.time) throw new Error("\u65E0\u6CD5\u63A8\u8FDB\u6A21\u62DF\u65F6\u949F");
    const elapsed = nextTime - state.time;
    if (elapsed > 0) {
      const segment = { start: state.time, end: nextTime, id: state.running };
      const last = timeline.at(-1);
      if (last && last.id === segment.id && last.end === segment.start) timeline[timeline.length - 1] = { ...last, end: segment.end };
      else timeline.push(segment);
      if (runningBefore) {
        runningBefore.stepRemaining -= elapsed;
        runningBefore.remaining -= elapsed;
        runningBefore.cpuTime += elapsed;
        state.sliceUsed += elapsed;
      }
      for (const id of state.queue) processById(state, id).readyWaitTime += elapsed;
      for (const process of state.processes) if (process.status === "\u963B\u585E") process.blockedTime += elapsed;
    }
    state.time = nextTime;
    if (!runningBefore && elapsed > 0) {
      const waking = previous.state.processes.some((process) => process.status === "\u963B\u585E" && process.blockedUntil === nextTime);
      const arrival = previous.state.processes.some((process) => process.status === "\u672A\u5230\u8FBE" && process.arrival === nextTime) || previous.config.processes.some((process) => process.submittedAt === nextTime && !state.processes.some((current) => current.id === process.id));
      emit("\u7A7A\u95F2", null, `CPU \u7A7A\u95F2 [${oldTime},${nextTime})\uFF0C\u63A8\u8FDB\u5230${waking ? " I/O \u5B8C\u6210" : arrival ? "\u4E0B\u4E00\u6B21\u5230\u8FBE" : "\u4E0B\u4E00\u4E2A\u6A21\u62DF\u4E8B\u4EF6"}\u3002`);
    }
    let dispatchTrigger = "";
    if (runningBefore && runningBefore.stepRemaining === 0) {
      state.running = null;
      state.sliceUsed = 0;
      const nextIndex = runningBefore.currentStepIndex + 1;
      if (nextIndex >= runningBefore.steps.length) {
        dispatchTrigger = `${runningBefore.id} \u7684\u6700\u540E\u4E00\u4E2A CPU \u6B65\u9AA4\u5B8C\u6210\u3002`;
        emit("\u5B8C\u6210", runningBefore.id, `${runningBefore.id} \u7684\u884C\u4E3A\u5E8F\u5217\u5168\u90E8\u6267\u884C\u5B8C\u6BD5\uFF0C\u8FDB\u7A0B\u9000\u51FA\u3002`, () => completeProcess(runningBefore, state));
      } else {
        const next = runningBefore.steps[nextIndex];
        dispatchTrigger = `${runningBefore.id} \u7684 CPU \u6B65\u9AA4\u5B8C\u6210\u3002`;
        emit("\u6B65\u9AA4\u5B8C\u6210", runningBefore.id, `${runningBefore.id} \u5B8C\u6210\u6B65\u9AA4 ${runningBefore.currentStepIndex + 1}\uFF0C\u4E0B\u4E00\u6B65\u4E3A ${next.type}\u3002`, () => {
          runningBefore.currentStepIndex = nextIndex;
          runningBefore.stepRemaining = next.duration;
          if (next.type === "IO") {
            runningBefore.status = "\u963B\u585E";
            runningBefore.blockedUntil = state.time + next.duration;
          } else enqueueReady(runningBefore, state);
        });
        if (next.type === "IO") emit("I/O\u5F00\u59CB", runningBefore.id, `${runningBefore.id} \u8BF7\u6C42\u7B80\u5316 I/O\uFF0C\u963B\u585E\u81F3 t=${state.time + next.duration}\uFF1B\u4E0D\u6A21\u62DF\u8BBE\u5907\u6392\u961F\u3002`);
      }
    }
    const dueIo = state.processes.filter((process) => process.status === "\u963B\u585E" && process.blockedUntil === state.time).sort((a, b) => a.order - b.order);
    for (const process of dueIo) {
      const nextIndex = process.currentStepIndex + 1;
      emit("I/O\u5B8C\u6210", process.id, `${process.id} \u7684 I/O \u7B49\u5F85\u5728 t=${state.time} \u5B8C\u6210\u3002`, () => {
        process.blockedUntil = null;
        if (nextIndex >= process.steps.length) completeProcess(process, state);
        else {
          process.currentStepIndex = nextIndex;
          process.stepRemaining = process.steps[nextIndex].duration;
          if (process.steps[nextIndex].type === "IO") {
            process.status = "\u963B\u585E";
            process.blockedUntil = state.time + process.steps[nextIndex].duration;
          } else enqueueReady(process, state);
        }
      });
      if (process.status === "\u5B8C\u6210") emit("\u5B8C\u6210", process.id, `${process.id} \u7684\u6700\u540E\u4E00\u6B65 I/O \u5B8C\u6210\uFF0C\u8FDB\u7A0B\u9000\u51FA\u3002`);
      else if (process.status === "\u963B\u585E") emit("I/O\u5F00\u59CB", process.id, `${process.id} \u5F00\u59CB\u4E0B\u4E00\u6BB5\u7B80\u5316 I/O\uFF0C\u9884\u8BA1 t=${process.blockedUntil} \u5B8C\u6210\uFF1B\u4E0D\u6A21\u62DF\u8BBE\u5907\u6392\u961F\u3002`);
    }
    const arrivals = state.processes.filter((process) => process.status === "\u672A\u5230\u8FBE" && process.arrival === state.time).sort((a, b) => a.order - b.order);
    for (const process of arrivals) emit("\u5230\u8FBE", process.id, `${process.id} \u5728 t=${state.time} \u5230\u8FBE\uFF0C\u6309\u63D0\u4EA4\u987A\u5E8F\u5165\u961F\u3002`, () => enqueueReady(process, state));
    if (state.running && sliceRemaining(state, strategy) === 0) {
      const process = processById(state, state.running);
      dispatchTrigger = `${process.id} \u7247\u6EE1\u4E14\u5269\u4F59 ${process.stepRemaining}\uFF1B\u539F\u961F\u5217 ${queueText(state.queue)}\uFF1B\u56DE\u961F\u540E ${queueText([...state.queue, process.id])}\u3002`;
      emit("\u7247\u6EE1", process.id, dispatchTrigger, () => {
        state.queue.push(process.id);
        process.status = "\u5C31\u7EEA";
        state.running = null;
        state.sliceUsed = 0;
      });
    }
    settleDispatch(state, strategy, emit, dispatchTrigger, runningBefore);
    state.idle = computeIdle(state);
    const result = { config: previous.config, state, events, timeline };
    assertInvariants(result);
    return freeze(result);
  }
  function assertInvariants(run) {
    const { state, timeline } = run;
    const pristineAtTimeZero = run.events.length === 0 && timeline.length === 0 && state.time === 0 && state.running === null && state.queue.length === 0 && state.sliceUsed === 0;
    const fail = (condition, message) => {
      if (!condition) throw new Error(`\u6A21\u62DF\u4E0D\u53D8\u91CF\u5931\u8D25\uFF1A${message}`);
    };
    fail(new Set(state.queue).size === state.queue.length, "\u961F\u5217\u91CD\u590D");
    fail(new Set(state.processes.map((process) => process.id)).size === state.processes.length, "\u8FDB\u7A0B\u6807\u8BC6\u91CD\u590D");
    fail(state.processes.filter((process) => process.status === "\u8FD0\u884C").length === (state.running === null ? 0 : 1), "CPU \u6570\u91CF");
    fail(state.queue.every((id) => state.processes.some((process) => process.id === id && process.status === "\u5C31\u7EEA")), "\u975E\u6CD5\u961F\u5217\u6210\u5458");
    for (const process of state.processes) {
      const executed = timeline.filter((segment) => segment.id === process.id).reduce((sum, segment) => sum + segment.end - segment.start, 0);
      fail(process.remaining >= 0 && process.remaining + executed === process.burst, "CPU \u6267\u884C\u91CF\u5B88\u6052");
      fail(process.cpuTime === executed, "CPU \u65F6\u95F4\u7D2F\u8BA1");
      fail(process.status === "\u8FD0\u884C" === (state.running === process.id), "\u8FD0\u884C\u6807\u8BC6");
      fail(process.status === "\u5C31\u7EEA" === state.queue.includes(process.id), "\u5C31\u7EEA\u72B6\u6001");
      const awaitingInitialArrival = pristineAtTimeZero && process.arrival === 0 && process.submittedAt === void 0 && process.currentStepIndex === 0 && process.stepRemaining === process.steps[0]?.duration && process.remaining === process.burst && process.cpuTime === 0 && process.readyWaitTime === 0 && process.blockedTime === 0 && process.blockedUntil === null && process.firstStart === null && process.completion === null;
      fail(process.status !== "\u672A\u5230\u8FBE" || process.arrival > state.time || awaitingInitialArrival, "\u672A\u5230\u8FBE\u8FDB\u7A0B\u65F6\u95F4");
      fail(process.status !== "\u672A\u63D0\u4EA4" || process.submittedAt >= state.time, "\u672A\u63D0\u4EA4\u8FDB\u7A0B\u65F6\u95F4");
      fail(process.status !== "\u5B8C\u6210" || process.remaining === 0 && process.completion !== null && process.currentStepIndex === process.steps.length, "\u5B8C\u6210\u72B6\u6001");
      fail(process.status !== "\u5B8C\u6210" || process.completion - process.arrival === process.cpuTime + process.readyWaitTime + process.blockedTime, "\u5B8C\u6210\u8FDB\u7A0B\u65F6\u95F4\u5B88\u6052");
      fail(process.status !== "\u963B\u585E" || currentStep(process)?.type === "IO" && process.blockedUntil !== null && process.blockedUntil > state.time, "\u963B\u585E\u72B6\u6001");
      fail(process.status !== "\u5C31\u7EEA" && process.status !== "\u8FD0\u884C" || currentStep(process)?.type === "CPU", "CPU \u72B6\u6001\u6B65\u9AA4\u7C7B\u578B");
      fail(process.firstStart === null || process.firstStart >= process.arrival, "\u9996\u6B21\u54CD\u5E94");
      fail(process.stepRemaining >= 0, "\u5F53\u524D\u6B65\u9AA4\u5269\u4F59\u91CF");
      fail(!timeline.some((segment) => segment.id === process.id && (segment.start < process.arrival || process.completion !== null && segment.end > process.completion)), "\u6267\u884C\u65F6\u95F4\u8303\u56F4");
    }
    let end = 0;
    for (const segment of timeline) {
      fail(segment.start === end && segment.end > segment.start, "\u65F6\u95F4\u7EBF\u4E0D\u8FDE\u7EED\u6216\u5012\u9000");
      end = segment.end;
    }
    fail(end === state.time, "\u65F6\u949F\u4E0E\u65F6\u95F4\u7EBF\u4E0D\u4E00\u81F4");
    fail(state.idle === computeIdle(state), "\u5C31\u7EEA\u72B6\u6001\u6807\u8BB0\u4E0D\u4E00\u81F4");
  }

  // src/memory-lab-model.ts
  var FRAME_COUNT = 8;
  var PAGE_SIZE = 4;
  function translateAddress(processId, virtualAddress, allocation, pageSize = PAGE_SIZE) {
    if (virtualAddress < 0 || !Number.isInteger(virtualAddress)) throw new Error(`\u865A\u62DF\u5730\u5740\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570\uFF1A${virtualAddress}`);
    const pageNumber = Math.floor(virtualAddress / pageSize);
    const offset = virtualAddress % pageSize;
    const table = allocation.pageTables.get(processId);
    if (!table) throw new Error(`\u672A\u77E5\u8FDB\u7A0B\uFF1A${processId}`);
    const entry = table.find((candidate) => candidate.page === pageNumber);
    if (!entry) throw new Error(`\u8FDB\u7A0B ${processId} \u6CA1\u6709\u7B2C ${pageNumber} \u9875\uFF08\u7F3A\u9875\u4E0D\u5728\u672C\u573A\u666F\u6F14\u793A\u8303\u56F4\uFF09`);
    const frameNumber = entry.frame;
    const physicalAddress = frameNumber * pageSize + offset;
    return { virtualAddress, pageNumber, offset, frameNumber, physicalAddress };
  }
  var DEMAND_FRAME_COUNT = 4;
  var demandPagingScene = [
    { page: 0, resident: true, frame: 0 },
    { page: 1, resident: true, frame: 2 },
    { page: 2, resident: false, frame: null },
    { page: 3, resident: true, frame: 3 },
    { page: 4, resident: false, frame: null }
  ];
  return __toCommonJS(wiki_engine_entry_exports);
})();
