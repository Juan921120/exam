/* ========================================================
   AI训练师三级理论题 — 在线模拟测试
   app.js — 核心逻辑
   ======================================================== */

/* ===== CONFIG ===== */
const CONFIG = {
  TOTAL_QUESTIONS: 10,
  TF_COUNT:        4,
  SINGLE_COUNT:    3,
  MULTI_COUNT:     3,
  STORAGE_KEY:     'ai_quiz_v2',
};

/* ===== STATE ===== */
let state = {
  allQuestions:   [],   // loaded from JSON
  session:        null, // current quiz session
  currentIndex:   0,
  timer:          null,
  elapsedSeconds: 0,
  wrongInSession: {},   // 本次答题中答错的题 { qIndex: true }，用于即时显示解析
  isReviewMode:   false, // 是否在复习模式
  reviewType:     'session', // 'session'(本次测试复习) | 'mistakes'(错题本复习)
  settings: {
    quizMode: 'sequential',  // 'sequential' | 'random'
  },
};

/* ===== STORAGE HELPERS ===== */
function loadStorage() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || { history: [], mistakes: {}, sequentialProgress: 0 };
  } catch { return { history: [], mistakes: {}, sequentialProgress: 0 }; }
}
function saveStorage(data) {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

/* ===== RANDOM HELPERS ===== */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

/* ===== QUESTION SAMPLING ===== */
function buildSession(allQ) {
  if (state.settings.quizMode === 'sequential') {
    // 顺序模式：从上次断点继续
    const storage = loadStorage();
    const startIdx = storage.sequentialProgress || 0;
    // 如果已到末尾，从头开始
    const idx = startIdx >= allQ.length ? 0 : startIdx;
    const endIdx = Math.min(idx + CONFIG.TOTAL_QUESTIONS, allQ.length);
    // 不补齐，末尾不足10题就取剩余题目
    return allQ.slice(idx, endIdx);
  }
  // 随机模式：完全随机抽取
  return pickRandom(allQ, CONFIG.TOTAL_QUESTIONS);
}

/* ===== MODE SWITCH ===== */
function setMode(mode) {
  state.settings.quizMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  // 更新顺序进度显示
  const seqArea = document.getElementById('sequential-progress-area');
  if (seqArea) {
    seqArea.style.display = mode === 'sequential' ? 'block' : 'none';
  }
  renderHome();
}

function resetSequentialProgress() {
  if (!confirm('确认重置顺序进度？将从第1题重新开始。')) return;
  const storage = loadStorage();
  storage.sequentialProgress = 0;
  saveStorage(storage);
  renderHome();
  showToast('顺序进度已重置');
}

/* ===== SESSION INIT ===== */
function startQuiz() {
  const questions = buildSession(state.allQuestions);
  state.session = {
    questions,
    answers:    Array(questions.length).fill(null),  // null = unanswered
    submitted:  false,
    startTime:  Date.now(),
  };
  state.currentIndex   = 0;
  state.elapsedSeconds = 0;
  state.wrongInSession = {};
  state.isReviewMode   = false;
  startTimer();
  showPage('quiz');
  updateTopbarForQuiz();
  renderQuiz();
}

function startMistakesReview() {
  const storage = loadStorage();
  const mistakes = Object.values(storage.mistakes);
  if (mistakes.length === 0) {
    showToast('错题本是空的');
    return;
  }
  state.session = {
    questions: mistakes.map(m => ({ ...m })),
    answers:   mistakes.map(m => m.userAnswer),
    submitted: true,
    startTime: Date.now(),
  };
  state.currentIndex = 0;
  state.isReviewMode = true;
  state.reviewType = 'mistakes';
  showPage('quiz');
  updateTopbarForReview();
  renderQuiz();
}

function startSessionReview() {
  const { questions, answers } = state.session;
  if (!questions || questions.length === 0) return;

  state.currentIndex = 0;
  state.isReviewMode = true;
  state.reviewType   = 'session';
  showPage('quiz');
  updateTopbarForReview();
  renderQuiz();
}

function goBackFromReview() {
  if (state.reviewType === 'session') {
    showPage('result');
  } else {
    gotoMistakes();
  }
}

/* ===== TIMER ===== */
function startTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}
function stopTimer() {
  clearInterval(state.timer);
  state.timer = null;
}
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}
function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  el.textContent = formatTime(state.elapsedSeconds);
  el.parentElement.classList.toggle('warn', state.elapsedSeconds > 600);
}

/* ===== TOPBAR UPDATE ===== */
function updateTopbarForQuiz() {
  const right = document.getElementById('topbar-right');
  if (!right) return;
  const modeLabel = state.settings.quizMode === 'sequential' ? '顺序模式' : '随机模式';
  right.textContent = `${modeLabel} · 共 ${state.allQuestions.length} 题库`;
}

function updateTopbarForReview() {
  const right = document.getElementById('topbar-right');
  if (!right) return;
  const label = state.reviewType === 'session' ? '答题解析' : '错题复习';
  right.textContent = `${label} · 共 ${state.session.questions.length} 题`;
}

/* ===== PAGE NAVIGATION ===== */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${id}`);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ===== HOME PAGE ===== */
function renderHome() {
  const storage = loadStorage();
  const tf     = state.allQuestions.filter(q => q.type === 'tf').length;
  const single = state.allQuestions.filter(q => q.type === 'single').length;
  const multi  = state.allQuestions.filter(q => q.type === 'multi').length;

  document.getElementById('stat-tf').textContent     = tf;
  document.getElementById('stat-single').textContent = single;
  document.getElementById('stat-multi').textContent  = multi;

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.settings.quizMode);
  });
  const seqArea = document.getElementById('sequential-progress-area');
  if (seqArea) {
    seqArea.style.display = state.settings.quizMode === 'sequential' ? 'block' : 'none';
  }

  // Sequential progress
  const total = state.allQuestions.length;
  const covered = storage.sequentialProgress || 0;
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  document.getElementById('seq-covered').textContent = covered;
  document.getElementById('seq-progress-fill').style.width = `${pct}%`;

  // History
  const histEl = document.getElementById('history-list');
  if (storage.history.length === 0) {
    histEl.innerHTML = `<p style="color:var(--clr-text-3);font-size:14px;text-align:center;padding:20px 0;">暂无记录，完成第一次测试后显示</p>`;
  } else {
    histEl.innerHTML = storage.history.slice(-5).reverse().map(rec => {
      const pct = Math.round((rec.score / rec.total) * 100);
      const cls = pct >= 80 ? 'score-high' : pct >= 60 ? 'score-mid' : 'score-low';
      return `<div class="history-item">
        <div class="history-item-left">
          <div>${rec.date}</div>
          <div class="history-item-date">${rec.duration}</div>
        </div>
        <div class="history-item-score ${cls}">${rec.score}/${rec.total}</div>
      </div>`;
    }).join('');
  }

  // Mistakes count
  const mistakeCount = Object.keys(storage.mistakes).length;
  document.getElementById('mistakes-count-badge').textContent =
    mistakeCount > 0 ? `${mistakeCount} 题` : '暂无';
}

/* ===== QUIZ RENDER ===== */
function renderQuiz() {
  const { questions, answers } = state.session;
  const q   = questions[state.currentIndex];
  const ans = answers[state.currentIndex];
  const isReview = state.isReviewMode;

  // Progress
  const answered = answers.filter(a => a !== null).length;
  document.getElementById('progress-fill').style.width =
    `${(answered / questions.length) * 100}%`;
  document.getElementById('progress-text').textContent =
    isReview ? `${state.currentIndex + 1} / ${questions.length} 题` : `${answered} / ${questions.length} 已作答`;

  // Timer visibility
  const timerEl = document.getElementById('topbar-timer-inline');
  if (timerEl) {
    timerEl.style.display = isReview ? 'none' : 'block';
  }

  // Nav dots
  const dotsEl = document.getElementById('q-nav-dots');
  dotsEl.innerHTML = questions.map((_, i) => {
    let cls = 'q-nav-dot';
    if (i === state.currentIndex) cls += ' current';
    else if (answers[i] !== null) cls += ' answered';
    return `<button class="${cls}" onclick="goToQuestion(${i})">${i + 1}</button>`;
  }).join('');

  // Question card
  renderQuestionCard(q, ans, isReview);

  // Footer nav
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');
  const backBtn = document.getElementById('btn-back-mistakes');
  prevBtn.disabled = state.currentIndex === 0;
  
  if (isReview) {
    const backLabel = state.reviewType === 'session' ? '返回成绩' : '返回错题本';
    nextBtn.textContent = state.currentIndex === questions.length - 1 ? backLabel : '下一题 →';
    if (submitBtn) submitBtn.style.display = 'none';
    if (backBtn) {
      backBtn.style.display = 'inline-flex';
      backBtn.textContent = state.reviewType === 'session' ? '← 返回成绩' : '← 返回错题本';
    }
  } else {
    nextBtn.textContent = state.currentIndex === questions.length - 1 ? '完成 →' : '下一题 →';
    if (submitBtn) submitBtn.style.display = 'inline-flex';
    if (backBtn) backBtn.style.display = 'none';
  }
}

function renderQuestionCard(q, userAnswer, isReview) {
  const i = state.currentIndex;
  const typeBadgeMap = { tf: '判断题', single: '单选题', multi: '多选题' };
  const typeBadgeCls = { tf: 'badge-tf', single: 'badge-single', multi: 'badge-multi' };
  const hintMap = {
    tf:     '请选择：正确 (✓) 或 错误 (✗)',
    single: '单选，选择一个最佳答案',
    multi:  '多选，选择所有正确答案（可多选）',
  };

  // 判断当前题是否答错（非review模式下，已作答且错误）
  // 注意：多选题不在此阶段锁定，因为用户可以逐项勾选
  const showExplanation = !isReview && q.type !== 'multi' && userAnswer !== null && !isAnswerCorrect(q, userAnswer);

  document.getElementById('question-card').innerHTML = `
    <div class="q-header">
      <span class="q-num">第 ${i + 1} 题</span>
      <span class="badge ${typeBadgeCls[q.type]}">${typeBadgeMap[q.type]}</span>
    </div>
    <div class="q-text">${q.q}</div>
    <div class="q-type-hint">${hintMap[q.type]}</div>
    ${renderOptions(q, userAnswer, isReview || showExplanation)}
    ${(isReview || showExplanation) ? renderExplanation(q, userAnswer) : ''}
  `;
  bindOptionEvents(q, isReview || showExplanation);
}

function renderOptions(q, userAnswer, isReview) {
  if (q.type === 'tf') {
    return renderTF(q, userAnswer, isReview);
  }
  if (q.type === 'single') {
    return renderSingle(q, userAnswer, isReview);
  }
  return renderMulti(q, userAnswer, isReview);
}

function renderTF(q, userAnswer, isReview) {
  const correctAns = q.answer; // 'T' or 'F'
  function tfClass(val) {
    if (!isReview) {
      return userAnswer === val ? `selected-${val}` : '';
    }
    if (val === correctAns) {
      return userAnswer === val ? 'review-correct' : 'review-correct';
    }
    if (userAnswer === val && val !== correctAns) return 'review-wrong';
    return '';
  }
  return `<div class="tf-buttons">
    <button class="tf-btn ${tfClass('T')}" data-val="T" ${isReview ? 'disabled' : ''}>
      ✓ <span class="tf-label">正确</span>
    </button>
    <button class="tf-btn ${tfClass('F')}" data-val="F" ${isReview ? 'disabled' : ''}>
      ✗ <span class="tf-label">错误</span>
    </button>
  </div>`;
}

function renderSingle(q, userAnswer, isReview) {
  return `<ul class="options-list">
    ${q.options.map(opt => {
      let cls = 'option-item';
      if (!isReview) {
        if (userAnswer === opt.key) cls += ' selected';
      } else {
        if (opt.key === q.answer) cls += ' correct';
        else if (userAnswer === opt.key) cls += ' wrong';
      }
      return `<li class="${cls}" data-key="${opt.key}" ${isReview ? '' : 'tabindex="0"'}>
        <span class="option-key">${opt.key}</span>
        <span class="option-text">${opt.text}</span>
      </li>`;
    }).join('')}
  </ul>`;
}

function renderMulti(q, userAnswer, isReview) {
  const selected = Array.isArray(userAnswer) ? userAnswer : [];
  const correct  = q.answer.split('');
  return `<ul class="options-list">
    ${q.options.map(opt => {
      let cls = 'option-item';
      if (!isReview) {
        if (selected.includes(opt.key)) cls += ' selected';
      } else {
        const isCorrectKey = correct.includes(opt.key);
        const isSelected   = selected.includes(opt.key);
        if (isCorrectKey && isSelected)       cls += ' correct';
        else if (!isCorrectKey && isSelected) cls += ' wrong';
        else if (isCorrectKey && !isSelected) cls += ' missed';
      }
      return `<li class="${cls}" data-key="${opt.key}" ${isReview ? '' : 'tabindex="0"'}>
        <span class="option-key">${opt.key}</span>
        <span class="option-text">${opt.text}</span>
      </li>`;
    }).join('')}
  </ul>`;
}

function renderExplanation(q, userAnswer) {
  const correct = q.type === 'multi'
    ? q.answer.split('')
    : [q.answer];
  const userArr = q.type === 'multi'
    ? (Array.isArray(userAnswer) ? userAnswer : [])
    : [userAnswer];

  const isCorrect = JSON.stringify([...correct].sort()) === JSON.stringify([...userArr].sort());
  const answerStr = q.type === 'tf'
    ? (q.answer === 'T' ? '正确 ✓' : '错误 ✗')
    : `选项 ${q.answer}`;

  const explanationText = q.explanation || '请参考相关知识点理解本题。';

  return `<div class="explanation">
    <div class="explanation-label">📋 答案解析</div>
    <div class="explanation-correct ${isCorrect ? 'is-correct' : 'is-wrong'}">
      ${isCorrect ? '✅ 回答正确' : '❌ 回答错误'}
    </div>
    <div style="font-size:14px;color:var(--clr-text-2);margin-top:4px;">
      正确答案：<strong>${answerStr}</strong>
      ${!isCorrect ? `&nbsp;· 你的答案：${userAnswer ? (q.type === 'tf' ? (userAnswer === 'T' ? '正确 ✓' : '错误 ✗') : userAnswer) : '（未作答）'}` : ''}
    </div>
    <div class="explanation-detail">
      <div class="explanation-detail-label">💡 解析：</div>
      <div class="explanation-detail-text">${explanationText}</div>
    </div>
  </div>`;
}

/* ===== OPTION EVENT BINDING ===== */
function bindOptionEvents(q, isReview) {
  if (isReview) return;

  if (q.type === 'tf') {
    document.querySelectorAll('.tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        saveAnswer(q, btn.dataset.val);
        renderQuiz();
      });
    });
    return;
  }

  document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      if (q.type === 'single') {
        saveAnswer(q, key);
      } else {
        // multi: toggle
        let cur = state.session.answers[state.currentIndex];
        if (!Array.isArray(cur)) cur = [];
        const idx = cur.indexOf(key);
        if (idx === -1) cur = [...cur, key].sort();
        else cur = cur.filter(k => k !== key);
        saveAnswer(q, cur.length > 0 ? cur : null);
      }
      renderQuiz();
    });
    // keyboard support
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
}

function saveAnswer(q, val) {
  state.session.answers[state.currentIndex] = val;
}

/* ===== NAVIGATION ===== */
function goToQuestion(idx) {
  state.currentIndex = idx;
  renderQuiz();
}
function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuiz();
  }
}
function nextQuestion() {
  const total = state.session.questions.length;
  if (state.currentIndex < total - 1) {
    state.currentIndex++;
    renderQuiz();
  } else {
    if (state.isReviewMode) {
      if (state.reviewType === 'session') {
        showPage('result');
      } else {
        gotoMistakes();
      }
    } else {
      openSubmitModal();
    }
  }
}

/* ===== SUBMIT MODAL ===== */
function openSubmitModal() {
  const { questions, answers } = state.session;
  const unanswered = answers.filter(a => a === null).length;
  const msg = unanswered > 0
    ? `还有 <strong>${unanswered} 题</strong> 未作答，确认提交？未作答计为错误。`
    : `已完成全部 ${questions.length} 题，确认提交？`;
  document.getElementById('modal-msg').innerHTML = msg;
  document.getElementById('submit-modal').classList.remove('hidden');
}
function closeSubmitModal() {
  document.getElementById('submit-modal').classList.add('hidden');
}
function confirmSubmit() {
  closeSubmitModal();
  submitQuiz();
}

/* ===== SUBMIT & SCORE ===== */
function submitQuiz() {
  stopTimer();
  state.session.submitted = true;

  const { questions, answers } = state.session;
  let score = 0;
  const wrongIds = [];

  questions.forEach((q, i) => {
    const ua  = answers[i];
    const correct = isAnswerCorrect(q, ua);
    if (correct) score++;
    else wrongIds.push(q.id);
  });

  // Save history
  const storage = loadStorage();
  storage.history.push({
    date:     new Date().toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
    duration: formatTime(state.elapsedSeconds),
    score,
    total:    questions.length,
  });

  // 顺序模式：更新进度断点
  if (state.settings.quizMode === 'sequential') {
    const totalAll = state.allQuestions.length;
    const currentProgress = storage.sequentialProgress || 0;
    const newProgress = Math.min(currentProgress + questions.length, totalAll);
    storage.sequentialProgress = newProgress >= totalAll ? 0 : newProgress;
  }

  // Update mistakes book
  questions.forEach((q, i) => {
    const ua = answers[i];
    if (!isAnswerCorrect(q, ua)) {
      storage.mistakes[q.id] = { ...q, lastWrong: Date.now(), userAnswer: ua };
    } else {
      delete storage.mistakes[q.id];  // remove if now correct
    }
  });
  saveStorage(storage);

  renderResult(score, questions.length);
  showPage('result');
}

function isAnswerCorrect(q, userAnswer) {
  if (userAnswer === null || userAnswer === undefined) return false;
  if (q.type === 'tf' || q.type === 'single') return userAnswer === q.answer;
  // multi: compare sorted arrays
  const correct  = q.answer.split('').sort().join('');
  const ua       = Array.isArray(userAnswer) ? [...userAnswer].sort().join('') : '';
  return correct === ua;
}

/* ===== RESULT PAGE ===== */
function renderResult(score, total) {
  const pct  = Math.round((score / total) * 100);
  const { questions, answers } = state.session;

  document.getElementById('result-score-num').textContent = score;
  document.getElementById('result-score-den').textContent = `/ ${total}`;
  document.getElementById('result-pct').textContent       = `${pct}%`;
  document.getElementById('result-time').textContent      = formatTime(state.elapsedSeconds);

  const correct = questions.filter((q,i) => isAnswerCorrect(q, answers[i])).length;
  const wrong   = total - correct;
  document.getElementById('result-correct').textContent   = correct;
  document.getElementById('result-wrong').textContent     = wrong;

  // Grade message
  let grade = '';
  if (pct >= 90)      grade = '🎉 优秀！';
  else if (pct >= 80) grade = '👍 良好';
  else if (pct >= 60) grade = '📖 继续加油';
  else                grade = '💪 需要加强练习';

  document.getElementById('result-grade').textContent = grade;
  document.getElementById('result-pct-big').textContent = `正确率 ${pct}%`;
}

/* ===== REVIEW PAGE ===== */
let reviewFilter = 'all';

function renderReview() {
  const { questions, answers } = state.session;
  let filtered = questions.map((q, i) => ({
    q, ua: answers[i], correct: isAnswerCorrect(q, answers[i]), i,
  }));

  if (reviewFilter === 'wrong')   filtered = filtered.filter(x => !x.correct);
  if (reviewFilter === 'correct') filtered = filtered.filter(x => x.correct);

  const container = document.getElementById('review-list');
  if (filtered.length === 0) {
    container.innerHTML = `<div class="mistakes-empty"><div class="icon">🎉</div><p>没有符合条件的题目</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(({ q, ua, correct, i }) => {
    const typeBadgeCls = { tf: 'badge-tf', single: 'badge-single', multi: 'badge-multi' };
    const typeName     = { tf: '判断题', single: '单选题', multi: '多选题' };
    return `<div class="review-item">
      <div class="review-item-header">
        <span class="review-status ${correct ? 'correct' : 'wrong'}">${correct ? '✓' : '✗'}</span>
        <strong style="font-size:14px;">第 ${i+1} 题</strong>
        <span class="badge ${typeBadgeCls[q.type]}" style="margin-left:4px">${typeName[q.type]}</span>
      </div>
      <div style="font-size:15px;font-weight:500;margin-bottom:16px;line-height:1.65">${q.q}</div>
      ${renderOptions(q, ua, true)}
      ${renderExplanation(q, ua)}
    </div>`;
  }).join('');
}

function setReviewFilter(f) {
  reviewFilter = f;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  renderReview();
}

/* ===== MISTAKES PAGE ===== */
function renderMistakes() {
  const storage = loadStorage();
  const mistakes = Object.values(storage.mistakes);
  const container = document.getElementById('mistakes-list');
  const countEl   = document.getElementById('mistakes-total');

  countEl.textContent = `共 ${mistakes.length} 题`;

  if (mistakes.length === 0) {
    container.innerHTML = `<div class="mistakes-empty">
      <div class="icon">✅</div>
      <p>错题本是空的</p>
      <p style="font-size:13px;margin-top:6px">完成测试后，答错的题目会自动收录</p>
    </div>`;
    return;
  }

  const typeBadgeCls = { tf:'badge-tf', single:'badge-single', multi:'badge-multi' };
  const typeName     = { tf:'判断题', single:'单选题', multi:'多选题' };

  container.innerHTML = `<button class="btn btn-primary btn-block btn-lg" style="margin-bottom:20px" onclick="startMistakesReview()">
    📖 开始错题复习
  </button>` + mistakes.map(q => {
    const userAnswer = q.userAnswer;
    const userAnswerStr = formatUserAnswer(q, userAnswer);
    const correctAnswerStr = formatCorrectAnswer(q);

    return `
    <div class="review-item">
      <div class="review-item-header">
        <span class="badge ${typeBadgeCls[q.type]}">${typeName[q.type]}</span>
        <span style="font-size:12px;color:var(--clr-text-3);margin-left:auto">题目 #${q.id}</span>
      </div>
      <div style="font-size:15px;font-weight:500;margin-bottom:16px;line-height:1.65">${q.q}</div>
      ${renderMistakeOptions(q, userAnswer)}
      ${renderMistakeAnswerInfo(q, userAnswer, userAnswerStr, correctAnswerStr)}
      ${q.explanation ? `
        <div class="explanation-detail" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--clr-border);border-left:none;background:transparent;padding-left:0">
          <div class="explanation-detail-label">💡 解析：</div>
          <div class="explanation-detail-text">${q.explanation}</div>
        </div>
      ` : ''}
      <button class="btn btn-sm btn-ghost" style="margin-top:12px;color:var(--clr-wrong)" onclick="removeMistake(${q.id})">
        ✕ 从错题本移除
      </button>
    </div>
  `}).join('');
}

// 格式化用户答案
function formatUserAnswer(q, userAnswer) {
  if (userAnswer === null || userAnswer === undefined) return '（未作答）';
  if (q.type === 'tf') return userAnswer === 'T' ? '正确 ✓' : '错误 ✗';
  if (q.type === 'single') return userAnswer;
  if (q.type === 'multi') return Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer;
  return userAnswer;
}

// 格式化正确答案
function formatCorrectAnswer(q) {
  if (q.type === 'tf') return q.answer === 'T' ? '正确 ✓' : '错误 ✗';
  return q.answer;
}

// 渲染错题选项（高亮用户答案和正确答案）
function renderMistakeOptions(q, userAnswer) {
  if (q.type === 'tf') {
    const userVal = userAnswer;
    const correctVal = q.answer;
    return `
      <div class="tf-buttons" style="margin-bottom:16px">
        <button class="tf-btn ${correctVal === 'T' ? 'review-correct' : ''} ${userVal === 'T' && userVal !== correctVal ? 'review-wrong' : ''}" disabled>
          ✓ <span class="tf-label">正确</span>
        </button>
        <button class="tf-btn ${correctVal === 'F' ? 'review-correct' : ''} ${userVal === 'F' && userVal !== correctVal ? 'review-wrong' : ''}" disabled>
          ✗ <span class="tf-label">错误</span>
        </button>
      </div>
    `;
  }

  const selected = q.type === 'multi' ? (Array.isArray(userAnswer) ? userAnswer : []) : [userAnswer];
  const correct  = q.type === 'multi' ? q.answer.split('') : [q.answer];

  return `
    <ul class="options-list">
      ${q.options.map(opt => {
        const isCorrectKey = correct.includes(opt.key);
        const isSelected   = selected.includes(opt.key);
        let cls = 'option-item';
        if (isCorrectKey && isSelected)       cls += ' correct';
        else if (!isCorrectKey && isSelected) cls += ' wrong';
        else if (isCorrectKey && !isSelected) cls += ' missed';
        return `<li class="${cls}">
          <span class="option-key">${opt.key}</span>
          <span class="option-text">${opt.text}</span>
        </li>`;
      }).join('')}
    </ul>
  `;
}

// 渲染答案信息区域
function renderMistakeAnswerInfo(q, userAnswer, userAnswerStr, correctAnswerStr) {
  return `
    <div style="font-size:14px;margin-top:12px;color:var(--clr-text-2);padding:12px 16px;background:var(--clr-surface);border-radius:var(--radius-md);border:1px solid var(--clr-border)">
      <div style="margin-bottom:8px">
        <span style="color:var(--clr-text-3)">你的答案：</span>
        <strong style="color:var(--clr-wrong)">${userAnswerStr}</strong>
      </div>
      <div>
        <span style="color:var(--clr-text-3)">正确答案：</span>
        <strong style="color:var(--clr-correct)">${correctAnswerStr}</strong>
      </div>
    </div>
  `;
}

function removeMistake(id) {
  const storage = loadStorage();
  delete storage.mistakes[id];
  saveStorage(storage);
  renderMistakes();
  showToast('已从错题本移除');
}

function clearAllMistakes() {
  if (!confirm('确认清空所有错题？')) return;
  const storage = loadStorage();
  storage.mistakes = {};
  saveStorage(storage);
  renderMistakes();
  showToast('错题本已清空');
}

/* ===== TOAST ===== */
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ===== INIT ===== */
async function init() {
  try {
    const res = await fetch('questions.json');
    state.allQuestions = await res.json();
    console.log(`✅ 题库加载完成：${state.allQuestions.length} 题`);
    renderHome();
    showPage('home');
  } catch (err) {
    console.error('题库加载失败:', err);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px">
        <div>
          <div style="font-size:36px;margin-bottom:12px">⚠️</div>
          <h2 style="margin-bottom:8px">题库加载失败</h2>
          <p style="color:#666">请确保 questions.json 与 index.html 在同一目录下<br>并通过 HTTP 服务器访问（不能直接双击打开）</p>
        </div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);

/* ===== KEYBOARD NAVIGATION ===== */
document.addEventListener('keydown', e => {
  // 只在测试页面(page-quiz)激活时响应
  const quizPage = document.getElementById('page-quiz');
  if (!quizPage || !quizPage.classList.contains('active')) return;

  // 右方向键：下一题
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextQuestion();
  }
  // 左方向键：上一题
  else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevQuestion();
  }
});
