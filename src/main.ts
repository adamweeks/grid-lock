// @ts-nocheck
// Phase 1: verbatim port of index.html script. TypeScript types added in Phases 2–5.
import './style.css';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: Word List
// ═══════════════════════════════════════════════════════════════════════════════
const WORDS = new Set([
  // 4-letter
  "able","acid","aged","also","area","army","away","back","ball","band",
  "bank","base","bath","bear","beat","been","bell","best","bird","blow",
  "blue","boat","body","bomb","bond","bone","book","bore","born","both",
  "brow","bulk","burn","busy","call","calm","came","card","care","case",
  "cash","cast","cave","cell","chat","chin","chip","city","clam","clap",
  "claw","clay","clue","coal","coat","code","coil","cold","come","cook",
  "cool","cope","copy","core","corn","cost","coup","crew","crop","cure",
  "curl","damp","dark","data","date","dawn","days","dead","deal","dean",
  "dear","debt","deep","deny","desk","dime","dine","dirt","disk","dock",
  "does","door","dose","down","draw","drew","drop","drug","drum","dual",
  "dull","dump","dusk","dust","duty","each","earn","ease","east","easy",
  "edge","else","emit","epic","even","ever","evil","exam","face","fact",
  "fair","fall","fame","farm","fast","fate","fear","feat","feed","feel",
  "fell","felt","file","fill","film","find","fine","fire","firm","fish",
  "fist","flag","flat","flew","flip","flow","foam","fold","folk","fond",
  "font","food","fool","foot","ford","fore","fork","form","fort","foul",
  "four","free","from","fuel","full","fund","fuse","gain","game","gave",
  "gear","gene","gift","girl","give","glad","glow","glue","goal","gold",
  "golf","gone","good","grab","gram","grew","grid","grin","grip","grow",
  "gulf","gust","half","hall","halt","hand","hang","hard","harm","hate",
  "have","hawk","head","heal","heap","heat","heel","held","help","here",
  "hide","high","hill","hint","hire","hole","home","hook","hope","horn",
  "host","hour","huge","hung","hunt","hurt","icon","idea","inch","into",
  "iron","item","jobs","join","joke","jump","just","keen","keep","kind",
  "king","knew","know","lack","laid","lake","land","lane","last","late",
  "lead","leaf","lean","leap","left","lend","lens","less","life","lift",
  "like","lime","line","link","list","live","load","loan","lock","loft",
  "lone","long","look","loop","lord","lore","lose","loss","lost","love",
  "luck","lung","made","mail","main","make","male","mall","many","mark",
  "mart","mask","mass","mast","math","meal","mean","meat","meet","melt",
  "memo","menu","mere","mesh","mild","mile","milk","mill","mind","mine",
  "mint","miss","mode","mood","moon","more","most","move","much","muse",
  "must","myth","nail","name","navy","near","neat","neck","need","news",
  "next","nice","nine","node","none","noon","norm","nose","note","noun",
  "obey","once","only","open","oral","over","page","paid","pain","pair",
  "pale","palm","park","part","pass","past","path","pave","peak","peel",
  "peer","pick","pile","pine","pink","pipe","plan","play","plot","plug",
  "plus","poem","poet","pole","poll","pond","pool","poor","pork","port",
  "pose","post","pour","pray","prep","prey","pull","pump","pure","push",
  "quit","race","rack","rage","rail","rain","rank","rare","rate","read",
  "real","rely","rent","rest","rice","rich","ride","ring","riot","rise",
  "risk","road","roam","roar","rock","role","roll","roof","room","rope",
  "rose","rout","ruin","rule","rush","safe","said","sail","sake","salt",
  "same","sand","save","scan","seal","seam","seat","seed","seek","seem",
  "self","sell","send","sent","ship","shop","shot","show","shut","sick",
  "side","sign","silk","sill","sing","sink","site","size","skin","skip",
  "slam","slap","slim","slip","slow","slum","snap","snow","soap","soar",
  "sock","soft","soil","sole","some","song","soon","sort","soul","soup",
  "span","spin","spot","star","stay","stem","step","stir","stop","such",
  "suit","sure","tale","tall","task","team","tell","tend","tent","term",
  "test","text","than","that","them","then","they","thin","this","tide",
  "till","time","tire","told","toll","tomb","tone","took","tool","tore",
  "torn","tour","town","trap","tree","trim","trip","true","tube","tuck",
  "tuna","tune","turn","twin","type","unit","upon","used","user","vast",
  "veil","very","vest","view","vine","void","volt","vote","wade","wage",
  "wake","walk","wall","wane","ward","warm","wary","wash","wave","weak",
  "wear","weed","week","well","went","were","west","what","when","whom",
  "wide","wife","wild","will","wind","wine","wing","wire","wise","wish",
  "with","woke","wolf","wood","word","wore","work","worm","worn","wrap",
  "writ","yard","year","your","zero","zone",
  // 3-letter
  "ace","act","add","age","ago","aid","aim","air","all","and","ant","any",
  "apt","arc","are","ark","arm","art","ash","ask","ate","awe","axe","aye",
  "bag","ban","bar","bat","bay","bed","beg","bet","bid","big","bit","bow",
  "box","boy","bud","bug","bun","bus","but","buy","cab","can","cap","car",
  "cat","cob","cod","cog","con","cop","cow","cry","cub","cup","cut","dam",
  "day","den","dew","did","dig","dim","dip","doe","dog","dot","dry","dug",
  "dye","ear","eat","eel","egg","ego","elf","elm","end","era","eve","ewe",
  "eye","fan","far","fat","fax","fed","few","fig","fin","fit","fix","fly",
  "foe","fog","for","fox","fry","fur","gag","gap","gas","gay","get","god",
  "got","gun","gut","guy","gym","had","hag","ham","has","hat","hay","her",
  "hid","him","hip","his","hit","hog","hot","how","hub","hug","hum","hut",
  "ice","ill","imp","ink","inn","ion","ivy","jab","jam","jar","jaw","jet",
  "jot","joy","jug","jut","keg","key","kid","kit","lag","lap","law","lay",
  "leg","let","lid","lip","lit","log","lot","low","lug","mad","map","mar",
  "mat","may","mob","mod","mop","mud","mug","nab","nag","nap","net","new",
  "nod","nor","not","now","nun","nut","oak","oar","oat","odd","off","oil",
  "old","one","opt","orb","ore","our","out","owe","owl","own","pad","pan",
  "pap","par","pat","paw","pay","pea","peg","pen","pet","pie","pig","pin",
  "pit","pod","pop","pot","pow","pro","pub","pun","pup","put","rag","ram",
  "ran","rap","rat","raw","ray","red","ref","rep","rid","rig","rip","rob",
  "rot","row","rub","rug","rum","run","rut","rye","sac","sad","sag","sap",
  "sat","saw","say","sea","set","sew","she","shy","sin","sip","sir","sit",
  "six","ski","sky","sly","sob","son","sow","soy","spa","spy","sty","sub",
  "sue","sum","sun","sup","tab","tag","tan","tap","tar","tax","tea","ten",
  "the","tie","tip","toe","top","tot","toy","tub","tug","two","urn","use",
  "van","vat","via","vim","vow","war","was","wax","web","wed","wet","who",
  "why","wig","win","wit","woe","wok","won","woo","wow","yam","yap","yew",
  "you","yow","zap","zit","zoo"
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: Grid + Pivot + Detection
// ═══════════════════════════════════════════════════════════════════════════════

// Classic initial layout — designed to reveal: STAR, RATS, ARTS, CARE, RACE, ACRE, SLAP, LAKE…
const INITIAL_LETTERS = [
  ['S','T','A','R'],
  ['E','C','E','A'],
  ['R','A','K','T'],
  ['S','L','A','P'],
];

// Blitz letter pool (weighted toward common letters)
const LETTER_POOL = 'AAAAAABBBBCCCDDDDEEEEEEEEFFFGGGHHHHIIIIIIJJKKLLLLLMMMNNNNNOOOOOOPPPPQRRRRRRSSSSSSTTTTTTTUUUUUVVWWWXYYYZZ';

let grid = [];             // grid[r][c] = { letter, isLocked, isPulsing }
let score = 0;
let pendingWord = null;    // { word, cells:[{r,c}], dir } — used by Blitz only
let currentMode = null;    // 'classic' | 'blitz'
let classicSelection = []; // [{r,c}, ...] — player's current tile selection (Classic only)

function getRandomLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

function makeCell(letter) {
  return { letter, isLocked: false, isPulsing: false };
}

function initClassicGrid() {
  grid = INITIAL_LETTERS.map(row => row.map(makeCell));
}

function initBlitzGrid() {
  grid = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => makeCell(getRandomLetter()))
  );
}

// ── Pivot ──────────────────────────────────────────────────────────────────────
function pivot(pr, pc) {
  const tl = { ...grid[pr][pc] };
  const tr = { ...grid[pr][pc + 1] };
  const br = { ...grid[pr + 1][pc + 1] };
  const bl = { ...grid[pr + 1][pc] };
  grid[pr][pc + 1]     = tl;
  grid[pr + 1][pc + 1] = tr;
  grid[pr + 1][pc]     = br;
  grid[pr][pc]         = bl;

  pendingWord = null;
  clearAllPulsing();
  if (currentMode === 'classic') {
    classicSelection = [];
    updateWordDisplay();
  } else {
    detectWords();
  }
  updateUI();
  animateQuadrant(pr, pc);
}

function animateQuadrant(pr, pc) {
  [[pr,pc],[pr,pc+1],[pr+1,pc],[pr+1,pc+1]].forEach(([r,c]) => {
    const el = document.getElementById(`tile-${r}-${c}`);
    if (!el) return;
    el.classList.remove('tile-spinning');
    void el.offsetWidth;
    el.classList.add('tile-spinning');
    el.addEventListener('animationend', () => el.classList.remove('tile-spinning'), { once: true });
  });
}

// ── Word Detection ─────────────────────────────────────────────────────────────
function clearAllPulsing() {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      grid[r][c].isPulsing = false;
}

// ── Classic: Manual tile selection ─────────────────────────────────────────────
function updateWordDisplay() {
  const letters = classicSelection.map(({ r, c }) => grid[r][c].letter).join(' → ');
  const display = document.getElementById('word-display');
  if (display) {
    display.textContent = letters || '— tap tiles to select —';
    display.className = letters
      ? 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-200 min-h-[2.75rem]'
      : 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-400 min-h-[2.75rem]';
  }
  const btn = document.getElementById('btn-submit-word');
  if (btn) {
    const canSubmit = classicSelection.length >= 3;
    btn.disabled = !canSubmit;
    btn.className = `font-black py-2 rounded-xl text-sm border transition-colors ${
      canSubmit
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
        : 'bg-indigo-800 text-indigo-400 border-indigo-700'
    }`;
    btn.style.flex = '2 1 0%';
  }
}

function canExtendSelection(r, c) {
  if (grid[r][c].isLocked) return false;
  const n = classicSelection.length;
  if (n >= 4) return false;
  if (classicSelection.some(s => s.r === r && s.c === c)) return false;
  if (n === 0) return true;

  const last = classicSelection[n - 1];
  if (n === 1) {
    return (r === last.r && Math.abs(c - last.c) === 1) ||
           (c === last.c && Math.abs(r - last.r) === 1);
  }
  // Direction locked after 2 tiles
  const dr = classicSelection[1].r - classicSelection[0].r;
  const dc = classicSelection[1].c - classicSelection[0].c;
  return r === last.r + dr && c === last.c + dc;
}

function handleClassicTileClick(r, c) {
  if (grid[r][c].isLocked) return;

  // Tap a selected tile to deselect it and everything after
  const existingIdx = classicSelection.findIndex(s => s.r === r && s.c === c);
  if (existingIdx !== -1) {
    classicSelection = classicSelection.slice(0, existingIdx);
    updateWordDisplay();
    updateUI();
    return;
  }

  if (!canExtendSelection(r, c)) return;

  classicSelection.push({ r, c });
  updateWordDisplay();
  updateUI();
}

function isValidWord(str, cells) {
  if (!WORDS.has(str.toLowerCase())) return false;
  return cells.every(({ r, c }) => !grid[r][c].isLocked);
}

function detectWords() {
  clearAllPulsing();
  pendingWord = null;
  let best = null;

  function tryWord(str, cells) {
    if (isValidWord(str, cells)) {
      if (!best || str.length > best.word.length) best = { word: str, cells };
    }
  }

  for (let r = 0; r < 4; r++) {
    const full = grid[r].map(t => t.letter).join('');
    tryWord(full, [0,1,2,3].map(c => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s+3), [s,s+1,s+2].map(c => ({ r, c })));
  }
  for (let c = 0; c < 4; c++) {
    const full = [0,1,2,3].map(r => grid[r][c].letter).join('');
    tryWord(full, [0,1,2,3].map(r => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s+3), [s,s+1,s+2].map(r => ({ r, c })));
  }

  if (best) {
    pendingWord = best;
    best.cells.forEach(({ r, c }) => { grid[r][c].isPulsing = true; });
    showMessage(`"${best.word.toUpperCase()}" detected! Tap to commit.`);
  } else {
    hideMessage();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIC MODE
// ═══════════════════════════════════════════════════════════════════════════════

function startClassic() {
  currentMode = 'classic';
  score = 0;
  pendingWord = null;
  classicSelection = [];
  initClassicGrid();

  document.getElementById('stat2-label').textContent = 'Locked';
  document.getElementById('stat2-value').className = 'text-2xl font-bold text-slate-200';
  document.getElementById('stat2-value').textContent = '0 / 16';
  document.getElementById('combo-bar').classList.add('hidden');
  document.getElementById('instructions-classic').classList.remove('hidden');
  document.getElementById('instructions-blitz').classList.add('hidden');
  document.getElementById('time-add-badge').classList.add('hidden');
  document.getElementById('classic-builder').classList.remove('hidden');

  buildBoard();
  updateUI();
  updateWordDisplay();
}

function commitWordClassic() {
  if (classicSelection.length < 3) return;
  const word = classicSelection.map(({ r, c }) => grid[r][c].letter).join('');
  if (!isValidWord(word, classicSelection)) {
    showMessage(`"${word}" is not a valid word.`, 1500);
    classicSelection = [];
    updateWordDisplay();
    updateUI();
    return;
  }
  const pts = word.length === 4 ? 500 : 100;
  classicSelection.forEach(({ r, c }) => {
    grid[r][c].isLocked = true;
  });
  score += pts;
  classicSelection = [];
  updateWordDisplay();
  updateUI();
  showMessage(`+${pts} pts — "${word}" locked in!`, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLITZ MODE
// ═══════════════════════════════════════════════════════════════════════════════

let blitzTimeLeft   = 60;
let blitzInterval   = null;
let blitzCombo      = 1;
let blitzBestCombo  = 1;
let blitzComboTimer = null;
let blitzWordsFound = 0;
const BLITZ_COMBO_WINDOW = 4000; // ms to extend combo

function startBlitz() {
  currentMode = 'blitz';
  score = 0;
  blitzTimeLeft  = 60;
  blitzCombo     = 1;
  blitzBestCombo = 1;
  blitzWordsFound = 0;
  pendingWord    = null;
  if (blitzInterval) clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);

  initBlitzGrid();

  document.getElementById('stat2-label').textContent = 'Time';
  document.getElementById('stat2-value').textContent = '1:00';
  document.getElementById('stat2-value').className = 'text-2xl font-bold text-slate-200';
  document.getElementById('time-add-badge').classList.add('hidden');
  document.getElementById('combo-bar').classList.remove('hidden');
  document.getElementById('instructions-classic').classList.add('hidden');
  document.getElementById('instructions-blitz').classList.remove('hidden');
  document.getElementById('classic-builder').classList.add('hidden');
  updateComboBadge();

  buildBoard();
  updateUI();
  detectWords();

  blitzInterval = setInterval(tickBlitz, 1000);
}

function tickBlitz() {
  blitzTimeLeft--;
  updateTimerDisplay();
  if (blitzTimeLeft <= 0) endBlitz();
}

function updateTimerDisplay() {
  const el = document.getElementById('stat2-value');
  const mins = Math.floor(blitzTimeLeft / 60);
  const secs = blitzTimeLeft % 60;
  el.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
  if (blitzTimeLeft <= 10) {
    el.classList.add('timer-urgent');
  } else {
    el.classList.remove('timer-urgent');
  }
}

function addBlitzTime(seconds) {
  blitzTimeLeft = Math.min(blitzTimeLeft + seconds, 99);
  updateTimerDisplay();
  // Show floating +Xs badge
  const badge = document.getElementById('time-add-badge');
  badge.textContent = `+${seconds}s`;
  badge.classList.remove('hidden', 'time-badge');
  void badge.offsetWidth;
  badge.classList.add('time-badge');
  badge.addEventListener('animationend', () => badge.classList.add('hidden'), { once: true });
}

function updateComboBadge() {
  const badge = document.getElementById('combo-badge');
  badge.textContent = `x${blitzCombo}`;
  const colors = ['','','bg-orange-900 border-orange-500 text-orange-300',
                     'bg-red-900 border-red-500 text-red-300',
                     'bg-yellow-900 border-yellow-500 text-yellow-300'];
  badge.className = `font-black text-sm px-4 py-1 rounded-full border ${colors[blitzCombo] || colors[2]}`;
  badge.classList.remove('combo-pop');
  void badge.offsetWidth;
  badge.classList.add('combo-pop');
}

function advanceCombo() {
  blitzCombo = Math.min(blitzCombo + 1, 4);
  if (blitzCombo > blitzBestCombo) blitzBestCombo = blitzCombo;
  updateComboBadge();
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzComboTimer = setTimeout(resetCombo, BLITZ_COMBO_WINDOW);
}

function resetCombo() {
  blitzCombo = 1;
  updateComboBadge();
}

function commitWordBlitz() {
  if (!pendingWord) return;
  const basePts  = pendingWord.word.length === 4 ? 500 : 100;
  const earnedPts = basePts * blitzCombo;
  const addedTime = pendingWord.word.length === 4 ? 15 : 8;

  const lockedCells = [...pendingWord.cells];
  lockedCells.forEach(({ r, c }) => {
    grid[r][c].isPulsing = false;
  });

  score += earnedPts;
  blitzWordsFound++;
  pendingWord = null;
  addBlitzTime(addedTime);
  advanceCombo();

  updateUI();
  showMessage(`+${earnedPts} pts${blitzCombo > 1 ? ` (x${blitzCombo} combo!)` : ''}`, 1800);

  // Animate tiles out, then cascade-refill after short delay
  animateTilesExit(lockedCells, () => {
    cascadeRefill(lockedCells);
  });
}

function animateTilesExit(cells, cb) {
  let done = 0;
  cells.forEach(({ r, c }) => {
    const el = document.getElementById(`tile-${r}-${c}`);
    if (!el) { done++; if (done === cells.length) cb(); return; }
    el.classList.add('tile-exiting');
    el.addEventListener('animationend', () => {
      done++;
      if (done === cells.length) cb();
    }, { once: true });
  });
}

function cascadeRefill(exitedCells) {
  // Group exited cells by column
  const byCol = {};
  exitedCells.forEach(({ r, c }) => {
    if (!byCol[c]) byCol[c] = [];
    byCol[c].push(r);
  });

  // For each column: shift non-exited rows down, fill from top
  Object.entries(byCol).forEach(([colStr, rows]) => {
    const c = +colStr;
    // Collect non-exiting rows top-to-bottom
    const kept = [];
    for (let r = 0; r < 4; r++) {
      if (!rows.includes(r)) kept.push({ ...grid[r][c] });
    }
    // Fill from top: new random letters first, then kept tiles
    const newLetters = rows.map(() => makeCell(getRandomLetter()));
    const newCol = [...newLetters, ...kept];
    for (let r = 0; r < 4; r++) {
      grid[r][c] = { ...newCol[r], isLocked: false, isPulsing: false };
    }
  });

  // Re-render and detect
  updateUI();

  // Animate entering tiles
  exitedCells.forEach(({ r, c }) => {
    // The new tiles that filled the top are in rows 0..n-1 for this column
    const byCol2 = {};
    exitedCells.forEach(cell => {
      if (!byCol2[cell.c]) byCol2[cell.c] = [];
      byCol2[cell.c].push(cell.r);
    });
    // Animate all tiles in the column that shifted
    for (let row = 0; row < 4; row++) {
      const el = document.getElementById(`tile-${row}-${c}`);
      if (!el) continue;
      el.classList.remove('tile-entering');
      void el.offsetWidth;
      el.classList.add('tile-entering');
      el.addEventListener('animationend', () => el.classList.remove('tile-entering'), { once: true });
    }
  });

  detectWords();
}

function endBlitz() {
  clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzInterval = null;

  document.getElementById('go-score').textContent = score.toLocaleString();
  document.getElementById('go-words').textContent = blitzWordsFound;
  document.getElementById('go-combo').textContent = `x${blitzBestCombo}`;
  document.getElementById('screen-gameover').classList.remove('hidden');
  document.getElementById('screen-gameover').style.display = 'flex';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════════════

function buildBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  board.style.display = 'grid';
  board.style.gridTemplateColumns = 'repeat(7, 1fr)';
  board.style.gridTemplateRows = 'repeat(7, 1fr)';
  board.style.gap = '0px';
  board.style.width = '100%';
  board.style.aspectRatio = '1 / 1';

  for (let gr = 0; gr < 7; gr++) {
    for (let gc = 0; gc < 7; gc++) {
      const isTileRow = gr % 2 === 0;
      const isTileCol = gc % 2 === 0;

      if (isTileRow && isTileCol) {
        const r = gr / 2, c = gc / 2;
        const el = document.createElement('div');
        el.id = `tile-${r}-${c}`;
        el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
        el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';
        el.addEventListener('click', () => {
          if (currentMode === 'classic') {
            handleClassicTileClick(r, c);
          } else if (grid[r][c].isPulsing) {
            commitWordBlitz();
          }
        });
        board.appendChild(el);
      } else if (!isTileRow && !isTileCol) {
        const pr = (gr - 1) / 2, pc = (gc - 1) / 2;
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center justify-center';
        const btn = document.createElement('button');
        btn.className = 'pivot-btn';
        btn.innerHTML = '↻';
        btn.addEventListener('click', () => pivot(pr, pc));
        wrapper.appendChild(btn);
        board.appendChild(wrapper);
      } else {
        board.appendChild(document.createElement('div'));
      }
    }
  }
}

function updateUI() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = grid[r][c];
      const el = document.getElementById(`tile-${r}-${c}`);
      if (!el) continue;
      el.textContent = tile.letter;
      el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
      el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';
      const isSelected = classicSelection.some(s => s.r === r && s.c === c);
      if (tile.isLocked) {
        el.classList.add('tile-locked', 'text-white');
        el.style.cursor = 'default';
      } else if (tile.isPulsing) {
        // Blitz only
        el.classList.add('tile-pulse', 'text-yellow-900');
        el.style.cursor = 'pointer';
      } else if (isSelected) {
        // Classic only
        el.classList.add('tile-selected');
        el.style.cursor = 'pointer';
      } else {
        el.classList.add('bg-slate-100', 'text-slate-900');
        el.style.cursor = currentMode === 'classic' ? 'pointer' : 'default';
        el.style.removeProperty('box-shadow');
      }
    }
  }

  document.getElementById('score-display').textContent = score.toLocaleString();

  if (currentMode === 'classic') {
    const locked = grid.flat().filter(t => t.isLocked).length;
    document.getElementById('stat2-value').textContent = `${locked} / 16`;
    if (locked === 16) showMessage(`All tiles locked! Final score: ${score}`, 0);
  }
}

function showMessage(text, autoDismissMs = 0) {
  const banner = document.getElementById('message-banner');
  banner.querySelector('div').textContent = text;
  banner.classList.remove('hidden');
  if (autoDismissMs > 0) setTimeout(hideMessage, autoDismissMs);
}
function hideMessage() {
  document.getElementById('message-banner').classList.add('hidden');
}

function showScreen(id) {
  ['screen-select','screen-game'].forEach(s => {
    const el = document.getElementById(s);
    if (s === id) { el.classList.remove('hidden'); el.style.display = 'flex'; }
    else          { el.classList.add('hidden'); el.style.display = 'none'; }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT WIRING
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('btn-submit-word').addEventListener('click', () => {
  if (currentMode === 'classic') commitWordClassic();
});

document.getElementById('btn-clear-selection').addEventListener('click', () => {
  classicSelection = [];
  updateWordDisplay();
  updateUI();
});

document.getElementById('btn-classic').addEventListener('click', () => {
  showScreen('screen-game');
  startClassic();
});

document.getElementById('btn-blitz').addEventListener('click', () => {
  showScreen('screen-game');
  startBlitz();
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }
  if (blitzComboTimer) { clearTimeout(blitzComboTimer); blitzComboTimer = null; }
  hideMessage();
  showScreen('screen-select');
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (currentMode === 'classic') startClassic();
  else startBlitz();
});

document.getElementById('go-play-again').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-gameover').style.display = 'none';
  startBlitz();
});

document.getElementById('go-modes').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-gameover').style.display = 'none';
  showScreen('screen-select');
});

// ── Init ──────────────────────────────────────────────────────────────────────
showScreen('screen-select');
