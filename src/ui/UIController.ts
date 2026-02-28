/**
 * UIController — owns references to all named DOM elements and exposes
 * typed methods for updating them. No game logic here.
 */

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
  private readonly wordDisplay    = el('word-display');
  private readonly btnSubmitWord  = el<HTMLButtonElement>('btn-submit-word');
  private readonly instClassic    = el('instructions-classic');
  private readonly instBlitz      = el('instructions-blitz');
  private readonly screenSelect   = el('screen-select');
  private readonly screenGame     = el('screen-game');
  private readonly goScore        = el('go-score');
  private readonly goWords        = el('go-words');
  private readonly goCombo        = el('go-combo');
  private readonly screenGameover = el('screen-gameover');

  private _autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.timeAddBadge.textContent = `+${seconds}s`;
    this.timeAddBadge.classList.remove('hidden', 'time-badge');
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

  updateWordDisplay(letters: string, canSubmit: boolean) {
    this.wordDisplay.textContent = letters || '— tap tiles to select —';
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

  applyClassicModeUI() {
    this.stat2Label.textContent    = 'Locked';
    this.stat2Value.className      = 'text-2xl font-bold text-slate-200';
    this.stat2Value.textContent    = '0 / 16';
    this.comboBar.classList.add('hidden');
    this.instClassic.classList.remove('hidden');
    this.instBlitz.classList.add('hidden');
    this.timeAddBadge.classList.add('hidden');
    this.classicBuilder.classList.remove('hidden');
  }

  applyBlitzModeUI() {
    this.stat2Label.textContent = 'Time';
    this.stat2Value.textContent = '1:00';
    this.stat2Value.className   = 'text-2xl font-bold text-slate-200';
    this.timeAddBadge.classList.add('hidden');
    this.comboBar.classList.remove('hidden');
    this.instClassic.classList.add('hidden');
    this.instBlitz.classList.remove('hidden');
    this.classicBuilder.classList.add('hidden');
  }

  showScreen(id: 'screen-select' | 'screen-game') {
    const screens = [this.screenSelect, this.screenGame];
    screens.forEach(s => {
      if (s.id === id) { s.classList.remove('hidden'); s.style.display = 'flex'; }
      else             { s.classList.add('hidden');    s.style.display = 'none'; }
    });
  }

  showGameOver(score: number, wordsFound: number, bestCombo: number) {
    this.goScore.textContent = score.toLocaleString();
    this.goWords.textContent = String(wordsFound);
    this.goCombo.textContent = `x${bestCombo}`;
    this.screenGameover.classList.remove('hidden');
    this.screenGameover.style.display = 'flex';
  }

  hideGameOver() {
    this.screenGameover.classList.add('hidden');
    this.screenGameover.style.display = 'none';
  }
}
