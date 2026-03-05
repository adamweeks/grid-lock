/**
 * UIController — owns references to all named DOM elements and exposes
 * typed methods for updating them. No game logic here.
 */
import type { AttemptRecord } from '../logic/DailyPuzzle.ts';

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} not found`);
  return e as T;
}

export class UIController {
  private readonly scoreDisplay   = el('score-display');
  private readonly stat2Label     = el('stat2-label');
  private readonly stat2Value     = el('stat2-value');
  private readonly timeAddBadge   = el('time-add-badge');
  private readonly comboBar       = el('combo-bar');
  private readonly comboBadge     = el('combo-badge');
  private readonly messageBanner  = el('message-banner');
  private readonly messageBannerInner: HTMLElement;
  private readonly classicBuilder = el('classic-builder');
  private readonly wordDisplay        = el('word-display');
  private readonly btnClearSelection  = el<HTMLButtonElement>('btn-clear-selection');
  private readonly btnSubmitWord      = el<HTMLButtonElement>('btn-submit-word');
  private readonly btnHint        = el<HTMLButtonElement>('btn-hint');
  private readonly instClassic    = el('instructions-classic');
  private readonly instBlitz      = el('instructions-blitz');
  private readonly screenSelect   = el('screen-select');
  private readonly screenGame     = el('screen-game');
  private readonly stat3Box       = el('stat3-box');
  private readonly spinDisplay    = el('spin-display');
  private readonly goIcon         = el('go-icon');
  private readonly goTitle        = el('go-title');
  private readonly goSubtitle     = el('go-subtitle');
  private readonly goStat3Label   = el('go-stat3-label');
  private readonly goScore        = el('go-score');
  private readonly goWords        = el('go-words');
  private readonly goCombo        = el('go-combo');
  private readonly screenGameover = el('screen-gameover');
  private readonly gameSubtitle   = el('game-subtitle');
  private readonly goShare        = el('go-share');
  private readonly goHistory      = el('go-history');
  private readonly goHistoryList  = el('go-history-list');

  private _autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private _scoreNotifTimer: ReturnType<typeof setTimeout> | null = null;
  private _shareText: string | null = null;

  constructor() {
    const inner = this.messageBanner.querySelector('div');
    if (!inner) throw new Error('#message-banner > div not found');
    this.messageBannerInner = inner as HTMLElement;
  }

  updateScore(score: number) {
    this.scoreDisplay.textContent = score.toLocaleString();
  }

  updateStat2Label(text: string) {
    this.stat2Label.textContent = text;
  }

  updateStat2Value(text: string) {
    this.stat2Value.textContent = text;
  }

  setStat2Class(className: string) {
    this.stat2Value.className = className;
  }

  updateTimerDisplay(timeLeft: number) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    this.stat2Value.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    if (timeLeft <= 10) {
      this.stat2Value.classList.add('timer-urgent');
    } else {
      this.stat2Value.classList.remove('timer-urgent');
    }
  }

  updateComboBadge(combo: number) {
    this.comboBadge.textContent = `x${combo}`;
    const colors = [
      '', '',
      'bg-orange-900 border-orange-500 text-orange-300',
      'bg-red-900 border-red-500 text-red-300',
      'bg-yellow-900 border-yellow-500 text-yellow-300',
    ];
    this.comboBadge.className = `font-black text-sm px-4 py-1 rounded-full border ${colors[combo] ?? colors[2]}`;
    this.comboBadge.classList.remove('combo-pop');
    void this.comboBadge.offsetWidth;
    this.comboBadge.classList.add('combo-pop');
  }

  showTimeAddBadge(seconds: number) {
    this.timeAddBadge.textContent = seconds > 0 ? `+${seconds}s` : `${seconds}s`;
    this.timeAddBadge.classList.remove('hidden', 'time-badge', 'text-green-400', 'text-red-400');
    this.timeAddBadge.classList.add(seconds > 0 ? 'text-green-400' : 'text-red-400');
    void this.timeAddBadge.offsetWidth;
    this.timeAddBadge.classList.add('time-badge');
    this.timeAddBadge.addEventListener(
      'animationend',
      () => this.timeAddBadge.classList.add('hidden'),
      { once: true },
    );
  }

  showMessage(text: string, autoDismissMs = 0) {
    if (this._autoDismissTimer !== null) clearTimeout(this._autoDismissTimer);
    this.messageBannerInner.textContent = text;
    this.messageBanner.classList.remove('hidden');
    if (autoDismissMs > 0) {
      this._autoDismissTimer = setTimeout(() => this.hideMessage(), autoDismissMs);
    }
  }

  hideMessage() {
    this.messageBanner.classList.add('hidden');
  }

  showScoreNotification(text: string, durationMs = 0, isError = false): void {
    if (this._scoreNotifTimer !== null) clearTimeout(this._scoreNotifTimer);
    this.wordDisplay.textContent = text;
    const color = isError ? 'text-red-400' : 'text-yellow-400';
    this.wordDisplay.className = `w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest ${color} min-h-[2.75rem] score-notif`;
    this.btnClearSelection.classList.add('hidden');
    this.btnSubmitWord.disabled = true;
    this.btnSubmitWord.className = 'font-black py-2 rounded-xl text-sm border transition-colors bg-indigo-800 text-indigo-400 border-indigo-700';
    this.btnSubmitWord.style.flex = '2 1 0%';
    if (durationMs > 0) {
      this._scoreNotifTimer = setTimeout(() => {
        this._scoreNotifTimer = null;
        this.updateWordDisplay('', false);
      }, durationMs);
    }
  }

  updateWordDisplay(letters: string, canSubmit: boolean) {
    if (this._scoreNotifTimer !== null) clearTimeout(this._scoreNotifTimer);
    this._scoreNotifTimer = null;
    this.wordDisplay.textContent = letters || '— tap tiles to select —';
    this.btnClearSelection.classList.toggle('hidden', !letters);
    this.wordDisplay.className = letters
      ? 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-200 min-h-[2.75rem]'
      : 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-400 min-h-[2.75rem]';

    this.btnSubmitWord.disabled = !canSubmit;
    this.btnSubmitWord.className = `font-black py-2 rounded-xl text-sm border transition-colors ${
      canSubmit
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
        : 'bg-indigo-800 text-indigo-400 border-indigo-700'
    }`;
    this.btnSubmitWord.style.flex = '2 1 0%';
  }

  setHintAvailable(_available: boolean) {
    // hint availability is intentionally not exposed via button state
  }

  updateSpinDisplay(spins: number) {
    this.spinDisplay.textContent = String(spins);
  }

  applyClassicModeUI() {
    this.stat2Label.textContent    = 'Locked';
    this.stat2Value.className      = 'text-2xl font-bold text-slate-200';
    this.stat2Value.textContent    = '0 / 16';
    this.stat3Box.classList.remove('hidden');
    this.spinDisplay.textContent   = '0';
    this.comboBar.classList.add('hidden');
    this.instClassic.classList.remove('hidden');
    this.instBlitz.classList.add('hidden');
    this.timeAddBadge.classList.add('hidden');
    this.classicBuilder.classList.remove('hidden');
    this.btnHint.classList.add('hidden');
  }

  applyBlitzModeUI() {
    this.stat2Label.textContent = 'Time';
    this.stat2Value.textContent = '1:00';
    this.stat2Value.className   = 'text-2xl font-bold text-slate-200';
    this.stat3Box.classList.add('hidden');
    this.timeAddBadge.classList.add('hidden');
    this.comboBar.classList.remove('hidden');
    this.instClassic.classList.add('hidden');
    this.instBlitz.classList.remove('hidden');
    this.classicBuilder.classList.remove('hidden');
    this.btnHint.classList.remove('hidden');
  }

  showScreen(id: 'screen-select' | 'screen-game') {
    const screens = [this.screenSelect, this.screenGame];
    screens.forEach(s => {
      if (s.id === id) { s.classList.remove('hidden'); s.style.display = 'flex'; }
      else             { s.classList.add('hidden');    s.style.display = 'none'; }
    });
  }

  showGameOver(score: number, wordsFound: number, bestCombo: number) {
    this.goIcon.textContent       = '⚡';
    this.goTitle.textContent      = "Time's Up!";
    this.goSubtitle.textContent   = 'Blitz final results';
    this.goStat3Label.textContent = 'Best Combo';
    this.goScore.textContent      = score.toLocaleString();
    this.goWords.textContent      = String(wordsFound);
    this.goCombo.textContent      = `x${bestCombo}`;
    this.goCombo.className        = 'font-bold text-orange-400';
    this.screenGameover.classList.remove('hidden');
    this.screenGameover.style.display = 'flex';
  }

  showClassicGameOver(score: number, wordsFound: number, spins: number, allLocked: boolean) {
    this.goIcon.textContent       = allLocked ? '🪨' : '🔒';
    this.goTitle.textContent      = allLocked ? 'Puzzle Complete!' : 'No More Moves!';
    this.goSubtitle.textContent   = 'Classic final results';
    this.goStat3Label.textContent = 'Spins Used';
    this.goScore.textContent      = score.toLocaleString();
    this.goWords.textContent      = String(wordsFound);
    this.goCombo.textContent      = String(spins);
    this.goCombo.className        = 'font-bold text-slate-200';
    this.goHistory.classList.add('hidden');
    this.screenGameover.classList.remove('hidden');
    this.screenGameover.style.display = 'flex';
  }

  hideGameOver() {
    this.screenGameover.classList.add('hidden');
    this.screenGameover.style.display = 'none';
    this.goShare.classList.add('hidden');
    this.goHistory.classList.add('hidden');
    this.goHistoryList.innerHTML = '';
    this._shareText = null;
  }

  /** Shows a subtitle line beneath the in-game title (e.g. "Daily Puzzle #64"). */
  setGameSubtitle(text: string) {
    this.gameSubtitle.textContent = text;
    this.gameSubtitle.classList.toggle('hidden', !text);
  }

  showDailyClassicGameOver(
    puzzleNumber: number,
    dateStr: string,
    score: number,
    wordsFound: number,
    spins: number,
    allLocked: boolean,
    attempts: AttemptRecord[],
  ) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    this.goIcon.textContent       = allLocked ? '📅' : '🔒';
    this.goTitle.textContent      = allLocked ? 'Daily Complete!' : 'No More Moves!';
    this.goSubtitle.textContent   = `Puzzle #${puzzleNumber} · ${dateLabel}`;
    this.goStat3Label.textContent = 'Spins Used';
    this.goScore.textContent      = score.toLocaleString();
    this.goWords.textContent      = String(wordsFound);
    this.goCombo.textContent      = String(spins);
    this.goCombo.className        = 'font-bold text-slate-200';

    if (allLocked) {
      this._shareText =
        `Grid-Lock Daily #${puzzleNumber}\n` +
        `Score: ${score.toLocaleString()} pts\n` +
        `Words: ${wordsFound} | Spins: ${spins}`;
      this.goShare.classList.remove('hidden');
    }

    this._renderHistory(attempts);

    this.screenGameover.classList.remove('hidden');
    this.screenGameover.style.display = 'flex';
  }

  private _renderHistory(attempts: AttemptRecord[]): void {
    if (attempts.length === 0) {
      this.goHistory.classList.add('hidden');
      return;
    }
    this.goHistoryList.innerHTML = '';
    attempts.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 py-1 border-b border-slate-700 last:border-0';
      const isCurrent = i === attempts.length - 1;
      const statusIcon = a.completed ? '✓' : '✕';
      const statusColor = a.completed ? 'text-emerald-400' : 'text-red-400';
      row.innerHTML =
        `<span class="text-slate-400 text-xs w-6">#${i + 1}</span>` +
        `<span class="${isCurrent ? 'text-yellow-400 font-bold' : 'text-slate-200'}">${a.score.toLocaleString()} pts</span>` +
        `<span class="text-slate-400">${a.wordsFound} word${a.wordsFound !== 1 ? 's' : ''}</span>` +
        `<span class="text-indigo-400">${a.spins} spin${a.spins !== 1 ? 's' : ''}</span>` +
        `<span class="${statusColor} font-bold text-xs">${statusIcon}</span>`;
      this.goHistoryList.appendChild(row);
    });
    this.goHistory.classList.remove('hidden');
  }

  async copyShareText(): Promise<void> {
    if (!this._shareText) return;
    try {
      await navigator.clipboard.writeText(this._shareText);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS) — silently ignore
    }
  }
}
