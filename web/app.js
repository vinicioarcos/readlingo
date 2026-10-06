'use strict';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'readlingo.v1';
const DEMO_MODE = document.documentElement?.dataset.runtime === 'demo';
const SEED_BOOKS = [{
  id: 'garden',
  title: 'A Garden in the City',
  level: 'A2',
  subtitle: 'Una historia sobre los pequeños comienzos · Texto original',
  text: 'Every morning, Maya walks to work through a busy street. One day, she sees a small garden between two tall buildings. There are yellow flowers, green leaves, and a wooden bench. She stops for a moment and listens to the birds.\n\nAn old man is planting a tree. “Would you like to help?” he asks. Maya smiles and puts her bag on the bench. The ground is soft, and the air smells fresh. Together, they give the young tree some water.\n\nThe next morning, Maya comes back. She brings her friend Leo and a little box of seeds. They decide to visit the garden every Saturday. A small place in a busy city becomes the beginning of a new friendship.'
}, {
  id: 'coast',
  title: 'The Train to Tomorrow',
  level: 'B1',
  subtitle: 'Un viaje para aprender a mirar · Texto original',
  text: 'Daniel had always planned his journeys carefully. He booked tickets weeks ahead and checked the weather every morning. But when his train stopped in a small coastal town, he discovered that the most memorable part of a journey might be the part you never planned.\n\nThe station manager explained that a fallen tree was blocking the railway. Instead of waiting inside, Daniel followed a narrow path towards the sea. At the end of the path, a woman was repairing a fishing net. She invited him to sit down and told him stories about the town.\n\nBy the time the next train arrived, Daniel had learned more about the coast than any guidebook could have taught him. He still enjoyed making plans, but he began to leave a little space for the unexpected. Sometimes, a delay is simply a different kind of opportunity.'
}, {
  id: 'market',
  title: 'The Value of a Small Choice',
  level: 'B2',
  subtitle: 'Economía cotidiana, historias humanas · Texto original',
  text: 'At the edge of the market, Elena compares two bags of coffee. One is cheaper; the other comes from a nearby cooperative. Her decision seems simple, yet it reflects a wider question: how do individual choices shape the communities in which we live?\n\nA lower price can help households stretch a limited budget. However, price alone does not reveal everything about a product. Working conditions, environmental costs, and the distribution of income may remain hidden. Economists study these trade-offs, but consumers rarely have complete information when they make a purchase.\n\nElena asks the seller how the cooperative shares its earnings. The answer does not remove every uncertainty, but it helps her make a more informed decision. Her purchase will not transform the entire economy. Still, understanding the consequences of a small choice is a useful place to begin.'
}];
// Curated English → Spanish entries. IPA transcriptions are broad, not accent scoring.
const DICTIONARY = {
  garden: ['jardín', '/ˈɡɑːrdən/'],
  morning: ['mañana (parte del día)', '/ˈmɔːrnɪŋ/'],
  walks: ['camina', '/wɔːks/'],
  work: ['trabajo; trabajar', '/wɜːrk/'],
  busy: ['con mucha actividad; concurrido', '/ˈbɪzi/'],
  street: ['calle', '/striːt/'],
  small: ['pequeño/a', '/smɔːl/'],
  between: ['entre', '/bɪˈtwiːn/'],
  tall: ['alto/a', '/tɔːl/'],
  buildings: ['edificios', '/ˈbɪldɪŋz/'],
  yellow: ['amarillo/a', '/ˈjeloʊ/'],
  flowers: ['flores', '/ˈflaʊərz/'],
  green: ['verde', '/ɡriːn/'],
  leaves: ['hojas; también «deja» según contexto', '/liːvz/'],
  wooden: ['de madera', '/ˈwʊdən/'],
  bench: ['banco (asiento)', '/bentʃ/'],
  moment: ['momento', '/ˈmoʊmənt/'],
  listens: ['escucha', '/ˈlɪsənz/'],
  birds: ['pájaros', '/bɜːrdz/'],
  planting: ['plantando', '/ˈplæntɪŋ/'],
  tree: ['árbol', '/triː/'],
  help: ['ayudar; ayuda', '/help/'],
  smiles: ['sonríe; sonrisas', '/smaɪlz/'],
  bag: ['bolso; bolsa', '/bæɡ/'],
  ground: ['suelo; tierra', '/ɡraʊnd/'],
  soft: ['suave; blando/a', '/sɔːft/'],
  air: ['aire', '/er/'],
  fresh: ['fresco/a', '/freʃ/'],
  together: ['juntos/as', '/təˈɡeðər/'],
  young: ['joven', '/jʌŋ/'],
  water: ['agua; regar', '/ˈwɔːtər/'],
  friend: ['amigo/a', '/frend/'],
  seeds: ['semillas', '/siːdz/'],
  beginning: ['comienzo', '/bɪˈɡɪnɪŋ/'],
  friendship: ['amistad', '/ˈfrendʃɪp/'],
  journey: ['viaje; trayecto', '/ˈdʒɜːrni/'],
  journeys: ['viajes', '/ˈdʒɜːrniz/'],
  carefully: ['cuidadosamente', '/ˈkerfəli/'],
  weather: ['tiempo atmosférico', '/ˈweðər/'],
  coastal: ['costero/a', '/ˈkoʊstəl/'],
  memorable: ['memorable', '/ˈmemərəbəl/'],
  railway: ['vía férrea; ferrocarril', '/ˈreɪlweɪ/'],
  narrow: ['estrecho/a', '/ˈnæroʊ/'],
  path: ['sendero; camino', '/pæθ/'],
  sea: ['mar', '/siː/'],
  repairing: ['reparando', '/rɪˈperɪŋ/'],
  delay: ['retraso', '/dɪˈleɪ/'],
  unexpected: ['inesperado/a', '/ˌʌnɪkˈspektɪd/'],
  opportunity: ['oportunidad', '/ˌɑːpərˈtuːnəti/'],
  market: ['mercado', '/ˈmɑːrkɪt/'],
  choice: ['elección', '/tʃɔɪs/'],
  choices: ['elecciones; decisiones', '/ˈtʃɔɪsɪz/'],
  cheaper: ['más barato/a', '/ˈtʃiːpər/'],
  cooperative: ['cooperativa; cooperativo/a', '/koʊˈɑːpərətɪv/'],
  decision: ['decisión', '/dɪˈsɪʒən/'],
  households: ['hogares', '/ˈhaʊshoʊldz/'],
  budget: ['presupuesto', '/ˈbʌdʒɪt/'],
  price: ['precio', '/praɪs/'],
  income: ['ingresos; renta', '/ˈɪnkʌm/'],
  hidden: ['oculto/a', '/ˈhɪdən/'],
  consumers: ['consumidores', '/kənˈsuːmərz/'],
  purchase: ['compra; comprar', '/ˈpɜːrtʃəs/'],
  earnings: ['ganancias; ingresos', '/ˈɜːrnɪŋz/'],
  uncertainty: ['incertidumbre', '/ʌnˈsɜːrtənti/'],
  economy: ['economía (sistema económico)', '/ɪˈkɑːnəmi/'],
  economists: ['economistas', '/ɪˈkɑːnəmɪsts/'],
  consequences: ['consecuencias', '/ˈkɑːnsəkwensɪz/'],
  understanding: ['comprensión; comprendiendo', '/ˌʌndərˈstændɪŋ/']
};
let state = {
  version: 1,
  books: [],
  currentBook: 'garden',
  positions: {},
  vocab: {}
};
let config = {
  translation: false,
  pronunciation: false
};
let selectedWord = '',
  sentences = [],
  utteranceToken = 0,
  translationToken = 0,
  assessmentToken = 0,
  assessmentBusy = false,
  sentenceTranslationToken = 0,
  statusTimer;
let cachedBookId = '',
  cachedBookText = '',
  cachedParagraphs = [];
let recorder = null,
  stream = null,
  recordTimer = null,
  recordTimeout = null,
  recordBlob = null,
  recordUrl = null,
  recordReference = '',
  recordSession = 0,
  recordStarted = 0;
function notify(message, error = false) {
  clearTimeout(statusTimer);
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
  $('status').hidden = false;
  statusTimer = setTimeout(() => $('status').hidden = true, 9000);
}
function isObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}
function validKey(key) {
  return /^[\p{L}][\p{L}'’-]{0,59}$/u.test(key) && !['constructor', 'prototype', '__proto__'].includes(key);
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!isObject(saved) || saved.version !== 1 || !Array.isArray(saved.books) || !isObject(saved.positions) || !isObject(saved.vocab)) throw Error('Formato no válido');
    state.books = saved.books.slice(0, 30).filter(b => isObject(b) && typeof b.id === 'string' && /^user-[\w-]+$/.test(b.id) && typeof b.title === 'string' && typeof b.text === 'string' && b.text.trim() && b.text.length <= 500000).map(b => ({
      id: b.id,
      title: b.title.slice(0, 120),
      text: b.text,
      level: 'Personal',
      subtitle: 'Texto importado por ti · Nivel sin evaluar'
    }));
    for (const [key, value] of Object.entries(saved.positions)) {
      if ((SEED_BOOKS.some(b => b.id === key) || state.books.some(b => b.id === key)) && Number.isInteger(value) && value >= 0) state.positions[key] = value;
    }
    for (const [key, v] of Object.entries(saved.vocab).slice(0, 10000)) {
      if (validKey(key) && isObject(v) && typeof v.meaning === 'string' && ['learning', 'known'].includes(v.status) && Number.isFinite(v.due) && Number.isFinite(v.interval) && v.interval >= 0 && v.interval <= 3650) {
        state.vocab[key] = {
          meaning: v.meaning.slice(0, 2000),
          source: typeof v.source === 'string' ? v.source.slice(0, 120) : 'Origen no registrado',
          ipa: typeof v.ipa === 'string' ? v.ipa.slice(0, 120) : '',
          status: v.status,
          due: v.due,
          interval: v.interval
        };
      }
    }
    if (allBooks().some(b => b.id === saved.currentBook)) state.currentBook = saved.currentBook;
  } catch (error) {
    notify('No se pudo recuperar el progreso guardado. Se cargó la biblioteca de ejemplo.', true);
  }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    notify('Los cambios solo están en esta sesión: no se pudo guardar en el navegador. Exporta tu progreso antes de salir.', true);
    return false;
  }
}
function allBooks() {
  return [...SEED_BOOKS, ...state.books];
}
function currentBook() {
  return allBooks().find(b => b.id === state.currentBook) || SEED_BOOKS[0];
}
function boundedChunks(text, limit) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const candidate = rest.slice(0, limit);
    const sentenceEnds = [...candidate.matchAll(/[.!?][”"’']*\s/g)];
    const lastEnd = sentenceEnds.at(-1);
    let cut = lastEnd && lastEnd.index > limit / 3 ? lastEnd.index + lastEnd[0].length : candidate.lastIndexOf(' ');
    if (cut < limit / 3) cut = limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
function paragraphs() {
  const book = currentBook();
  if (cachedBookId !== book.id || cachedBookText !== book.text) {
    cachedBookId = book.id;
    cachedBookText = book.text;
    cachedParagraphs = book.text.split(/\n\s*\n/).flatMap(t => boundedChunks(t, 1800)).filter(Boolean);
  }
  return cachedParagraphs;
}
function position() {
  return Math.min(state.positions[currentBook().id] || 0, paragraphs().length - 1);
}
function paragraph() {
  return paragraphs()[position()] || '';
}
function splitSentences(text) {
  const parts = text.match(/[^.!?]+(?:[.!?]+[”"’']*|$)/g);
  return (parts || [text]).flatMap(s => boundedChunks(s, 800)).filter(Boolean);
}
function create(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function renderShelf() {
  const list = $('book-list');
  list.replaceChildren();
  for (const book of allBooks()) {
    const button = create('button', 'shelf-book' + (book.id === state.currentBook ? ' selected' : ''));
    button.setAttribute('aria-current', book.id === state.currentBook ? 'true' : 'false');
    button.append(create('span', 'shelf-cover', book.title.charAt(0)));
    const copy = create('span', 'shelf-copy');
    copy.append(create('strong', '', book.title), create('small', '', book.level === 'Personal' ? 'Lectura importada' : `${book.level} · ReadLingo Originals`));
    button.append(copy);
    button.addEventListener('click', () => {
      stopSpeech();
      clearRecording();
      state.currentBook = book.id;
      save();
      showView('reader');
      renderReader();
    });
    list.append(button);
  }
}
function renderReader() {
  const book = currentBook();
  $('book-title').textContent = book.title;
  $('cover-initial').textContent = book.title.charAt(0);
  $('book-level').textContent = book.level === 'Personal' ? 'Nivel sin evaluar' : `${book.level} · Orientativo`;
  $('book-subtitle').textContent = book.subtitle;
  sentences = splitSentences(paragraph());
  const passage = $('passage');
  passage.replaceChildren();
  sentences.forEach((sentence, index) => {
    const span = create('span', 'sentence');
    span.dataset.index = String(index);
    const tokens = sentence.split(/([\p{L}]+(?:['’-][\p{L}]+)*)/gu);
    tokens.forEach((token, i) => {
      if (i % 2) {
        const word = create('button', 'word', token);
        word.type = 'button';
        word.dataset.word = token.toLowerCase();
        word.setAttribute('aria-label', `Consultar ${token}`);
        if (state.vocab[token.toLowerCase()]?.status === 'learning') word.classList.add('learned');
        word.addEventListener('click', () => selectWord(token, word));
        span.append(word);
      } else span.append(document.createTextNode(token));
    });
    passage.append(span, document.createTextNode(' '));
  });
  const count = paragraphs().length;
  const pos = position();
  $('paragraph-label').textContent = `FRAGMENTO ${pos + 1} DE ${count}`;
  $('progress').value = (pos + 1) / count * 100;
  $('progress-text').textContent = `${pos + 1} / ${count} fragmentos`;
  $('prev').disabled = pos === 0;
  $('next').disabled = pos >= count - 1;
  $('practice-sentence').replaceChildren();
  sentences.forEach((s, i) => {
    const option = create('option', '', `Oración ${i + 1} · ${s.slice(0, 44)}${s.length > 44 ? '…' : ''}`);
    option.value = String(i);
    $('practice-sentence').append(option);
  });
  updatePractice();
  renderShelf();
  updateCounts();
}
function selectWord(word, button) {
  selectedWord = word.toLowerCase();
  translationToken++;
  delete $('word-meaning').dataset.translatedWord;
  document.querySelectorAll('.word.selected').forEach(el => el.classList.remove('selected'));
  button?.classList.add('selected');
  const entry = DICTIONARY[selectedWord];
  const saved = state.vocab[selectedWord];
  $('selected-word').textContent = word;
  $('word-ipa').textContent = entry?.[1] || saved?.ipa || '';
  $('word-meaning').textContent = saved?.meaning || entry?.[0] || 'Esta palabra todavía no está en el glosario local.';
  $('word-source').textContent = saved?.source || (saved ? 'Origen no registrado' : entry ? 'Glosario local curado' : 'Sin significado disponible');
  $('word-listen').disabled = false;
  $('word-save').disabled = false;
  $('word-known').disabled = false;
  $('word-save').textContent = saved?.status === 'learning' ? '✓ Guardada' : '＋ Aprender';
  $('word-translate').hidden = !config.translation;
  $('word-translate').disabled = false;
}
function storeWord(status) {
  if (!selectedWord || !validKey(selectedWord)) return;
  const existing = state.vocab[selectedWord];
  const entry = DICTIONARY[selectedWord];
  state.vocab[selectedWord] = {
    meaning: $('word-meaning').dataset.translatedWord === selectedWord ? $('word-meaning').textContent : existing?.meaning || entry?.[0] || 'Significado pendiente de consultar',
    source: $('word-source').textContent,
    ipa: entry?.[1] || existing?.ipa || '',
    status,
    due: Date.now(),
    interval: existing?.interval || 0
  };
  const persisted = save();
  updateCounts();
  $('word-save').textContent = status === 'learning' ? '✓ Guardada' : '＋ Aprender';
  document.querySelectorAll('.word').forEach(el => {
    if (el.dataset.word === selectedWord) el.classList.toggle('learned', status === 'learning');
  });
  if (persisted) notify(status === 'learning' ? 'Palabra guardada para practicar.' : 'Palabra marcada como conocida.');
}
function dueWords() {
  return Object.entries(state.vocab).filter(([, v]) => v.status === 'learning' && v.due <= Date.now()).sort((a, b) => a[1].due - b[1].due);
}
function updateCounts() {
  $('vocab-count').textContent = Object.keys(state.vocab).length;
  $('due-count').textContent = dueWords().length;
}
function showView(view) {
  if (view !== 'reader') {
    stopSpeech();
    clearRecording();
  }
  ['reader', 'vocab', 'review'].forEach(name => {
    $(`${name}-view`).hidden = name !== view;
    $(`nav-${name}`).classList.toggle('active', name === view);
  });
  updateCounts();
  if (view === 'vocab') renderVocab();
  if (view === 'review') renderReview();
}
function renderVocab() {
  const list = $('vocab-list');
  list.replaceChildren();
  if (!Object.keys(state.vocab).length) {
    list.append(create('p', 'empty', 'Tu colección está esperando su primera palabra. Abre una lectura y pulsa una palabra para guardarla.'));
    return;
  }
  Object.entries(state.vocab).sort((a, b) => a[0].localeCompare(b[0])).forEach(([word, v]) => {
    const card = create('article', 'vocab-entry');
    card.append(create('h2', '', word), create('small', '', v.ipa), create('p', '', v.meaning), create('small', '', v.status === 'known' ? '✓ Conocida' : `En práctica · ${v.due <= Date.now() ? 'lista para repasar' : 'próximo repaso ' + new Date(v.due).toLocaleDateString('es')}`));
    const button = create('button', 'text-button', v.status === 'known' ? 'Volver a practicar' : 'Marcar como conocida');
    button.addEventListener('click', () => {
      v.status = v.status === 'known' ? 'learning' : 'known';
      v.due = Date.now();
      save();
      renderVocab();
      updateCounts();
    });
    card.append(create('p', 'fineprint', v.source || 'Origen no registrado'), button);
    list.append(card);
  });
}
function renderReview() {
  updateCounts();
  const card = $('review-card');
  card.replaceChildren();
  const due = dueWords();
  if (!due.length) {
    card.append(create('span', 'eyebrow', 'POR AHORA, TODO LISTO'), create('h2', '', 'Sigue descubriendo.'), create('p', 'empty', 'No tienes palabras pendientes de repaso. Las palabras nuevas aparecerán aquí al guardarlas.'));
    return;
  }
  const [word, v] = due[0];
  card.append(create('span', 'eyebrow', `${due.length} PALABRA${due.length === 1 ? '' : 'S'} PARA HOY`), create('h2', '', word));
  const play = create('button', 'text-button', '◖ Escuchar');
  play.addEventListener('click', () => speak([word]));
  card.append(play);
  const answer = create('div');
  answer.hidden = true;
  answer.append(create('p', '', v.meaning), create('small', '', v.ipa), create('p', 'fineprint', v.source || 'Origen no registrado'));
  const reveal = create('button', 'button primary', 'Mostrar significado');
  reveal.addEventListener('click', () => {
    answer.hidden = false;
    reveal.hidden = true;
  });
  card.append(document.createElement('br'), reveal, answer);
  const buttons = create('div', 'review-buttons');
  const again = create('button', 'button subtle', 'Otra vez · 10 min');
  const days = Math.min(v.interval ? Math.max(1, v.interval * 2) : 1, 3650);
  const good = create('button', 'button primary', `Lo recordé · ${days} día${days > 1 ? 's' : ''}`);
  again.addEventListener('click', () => {
    v.due = Date.now() + 600000;
    v.interval = 0;
    save();
    renderReview();
  });
  good.addEventListener('click', () => {
    v.interval = days;
    v.due = Date.now() + days * 86400000;
    save();
    renderReview();
  });
  buttons.append(again, good);
  answer.append(buttons);
}
function stopSpeech() {
  utteranceToken++;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
  $('listen').textContent = '▶ Escuchar párrafo';
}
function populateVoices() {
  if (!('speechSynthesis' in window)) {
    [$('listen'), $('word-listen'), $('sentence-listen')].forEach(el => el.disabled = true);
    return;
  }
  const previous = $('voice').value;
  const voices = window.speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
  $('voice').replaceChildren(create('option', '', 'Voz inglesa del dispositivo'));
  $('voice').options[0].value = '';
  voices.forEach(v => {
    const option = create('option', '', `${v.name} · ${v.lang}`);
    option.value = v.voiceURI;
    $('voice').append(option);
  });
  if ([...$('voice').options].some(o => o.value === previous)) $('voice').value = previous;
}
function speak(parts, highlight = false) {
  if (!('speechSynthesis' in window)) {
    notify('Este navegador no dispone de lectura en voz alta.', true);
    return;
  }
  stopSpeech();
  const token = utteranceToken;
  let index = 0;
  const run = () => {
    if (token !== utteranceToken || index >= parts.length) {
      if (token === utteranceToken) stopSpeech();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(parts[index]);
    const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === $('voice').value);
    utterance.lang = voice?.lang || 'en-US';
    if (voice) utterance.voice = voice;
    utterance.rate = Number($('rate').value);
    if (highlight) {
      document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
      document.querySelector(`.sentence[data-index="${index}"]`)?.classList.add('speaking');
      $('listen').textContent = '◖ Escuchando…';
    }
    utterance.onend = () => {
      index++;
      run();
    };
    utterance.onerror = event => {
      if (token === utteranceToken && event.error !== 'canceled' && event.error !== 'interrupted') {
        stopSpeech();
        notify('No se pudo reproducir la voz. Comprueba las voces inglesas del dispositivo.', true);
      }
    };
    window.speechSynthesis.speak(utterance);
  };
  run();
}
function updatePractice() {
  sentenceTranslationToken++;
  $('sentence-translation').hidden = true;
  $('sentence-translation').textContent = '';
  $('sentence-translate').disabled = false;
  clearRecording();
  $('practice-text').textContent = sentences[Number($('practice-sentence').value) || 0] || '';
}
function clearRecording() {
  recordSession++;
  assessmentToken++;
  assessmentBusy = false;
  clearInterval(recordTimer);
  clearTimeout(recordTimeout);
  if (recorder && recorder.state !== 'inactive') {
    try {
      recorder.stop();
    } catch (error) {/* already stopping */}
  }
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  recorder = null;
  recordBlob = null;
  recordReference = '';
  if (recordUrl) URL.revokeObjectURL(recordUrl);
  recordUrl = null;
  $('recording').pause();
  $('recording').removeAttribute('src');
  $('recording').hidden = true;
  $('record').disabled = false;
  $('record').textContent = '● Grabar mi voz';
  $('record-time').textContent = '';
  $('audio-consent').checked = false;
  $('assess').disabled = true;
  $('assess').textContent = 'Evaluar pronunciación';
  $('assessment-result').replaceChildren();
}
async function toggleRecording() {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    notify('La grabación necesita un navegador compatible en localhost o HTTPS.', true);
    return;
  }
  clearRecording();
  stopSpeech();
  const session = recordSession;
  $('record').disabled = true;
  try {
    const captured = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    if (session !== recordSession) {
      captured.getTracks().forEach(t => t.stop());
      return;
    }
    stream = captured;
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
    const activeRecorder = new MediaRecorder(stream, mime ? {
      mimeType: mime
    } : {});
    recorder = activeRecorder;
    const chunks = [];
    recordReference = $('practice-text').textContent;
    activeRecorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    activeRecorder.onstop = () => {
      captured.getTracks().forEach(t => t.stop());
      if (session !== recordSession) return;
      clearInterval(recordTimer);
      clearTimeout(recordTimeout);
      stream = null;
      recorder = null;
      $('record').disabled = false;
      $('record').textContent = '● Volver a grabar';
      $('record-time').textContent = '';
      recordBlob = new Blob(chunks, {
        type: activeRecorder.mimeType
      });
      if (!recordBlob.size) {
        notify('La grabación no contiene audio. Inténtalo de nuevo.', true);
        return;
      }
      recordUrl = URL.createObjectURL(recordBlob);
      $('recording').src = recordUrl;
      $('recording').hidden = false;
      $('assess').disabled = !$('audio-consent').checked;
      notify('Grabación lista. Escúchala y compárala con el modelo.');
    };
    activeRecorder.onerror = () => {
      clearRecording();
      notify('No se pudo completar la grabación.', true);
    };
    activeRecorder.start();
    recordStarted = Date.now();
    $('record').disabled = false;
    $('record').textContent = '■ Detener grabación';
    $('record-time').textContent = '0 / 20 s';
    recordTimer = setInterval(() => $('record-time').textContent = `${Math.floor((Date.now() - recordStarted) / 1000)} / 20 s`, 250);
    recordTimeout = setTimeout(() => {
      if (activeRecorder.state === 'recording') activeRecorder.stop();
    }, 20000);
  } catch (error) {
    if (session !== recordSession) return;
    clearRecording();
    notify(error.name === 'NotAllowedError' ? 'Permite el micrófono en el navegador para practicar.' : error.name === 'NotFoundError' ? 'No se encontró un micrófono conectado.' : 'No se pudo acceder al micrófono. Revisa sus permisos.', true);
  }
}
async function audioToWav(blob) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context || !window.OfflineAudioContext) throw Error('Este navegador no puede convertir el audio. Prueba un navegador actualizado.');
  const context = new Context();
  let decoded;
  try {
    decoded = await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close();
  }
  if (decoded.duration > 21) throw Error('La grabación supera los 20 segundos permitidos.');
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset, value) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return buffer;
}
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let start = 0; start < bytes.length; start += 32768) binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
  return btoa(binary);
}
async function api(path, body) {
  if (DEMO_MODE) throw Error('Esta función está disponible en la versión local de ReadLingo.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: body ? {
        'Content-Type': 'application/json'
      } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw Error('El servidor devolvió una respuesta no válida.');
    }
    if (!response.ok) throw Error(typeof result.error === 'string' ? result.error : 'No se pudo completar la solicitud.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw Error('La solicitud tardó demasiado. Inténtalo de nuevo.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
async function assess() {
  if (assessmentBusy || !config.pronunciation || !recordBlob || !$('audio-consent').checked) return;
  assessmentBusy = true;
  const token = ++assessmentToken;
  const blob = recordBlob;
  const reference = recordReference;
  $('assess').disabled = true;
  $('assess').textContent = 'Preparando audio…';
  try {
    const audio = toBase64(await audioToWav(blob));
    if (token !== assessmentToken || !$('audio-consent').checked) return;
    $('assess').textContent = 'Evaluando con Azure…';
    const result = await api('/api/pronunciation', {
      reference,
      audio
    });
    if (token !== assessmentToken) return;
    renderAssessment(result);
  } catch (error) {
    if (token === assessmentToken) notify(error.message || 'La evaluación no está disponible.', true);
  } finally {
    if (token === assessmentToken) {
      assessmentBusy = false;
      $('assess').disabled = !recordBlob || !$('audio-consent').checked;
      $('assess').textContent = 'Evaluar pronunciación';
    }
  }
}
function renderAssessment(result) {
  const target = $('assessment-result');
  target.replaceChildren();
  if (!isObject(result.scores)) throw Error('El proveedor no devolvió puntuaciones utilizables.');
  target.append(create('p', 'fineprint', 'Evaluación automática de Azure · Escala 0–100. Es una ayuda de práctica, no una certificación.'));
  if (result.text) target.append(create('p', 'fineprint', `Reconocido: ${result.text}`));
  const scores = create('div', 'scores');
  for (const [key, label] of Object.entries({
    accuracy: 'Precisión',
    fluency: 'Fluidez',
    completeness: 'Completitud',
    pronunciation: 'Pronunciación'
  })) {
    const score = result.scores[key];
    const item = create('div', 'score');
    item.append(create('strong', '', Number.isFinite(score) ? String(Math.round(score)) : '—'), document.createTextNode(label));
    scores.append(item);
  }
  target.append(scores);
  if (Array.isArray(result.words)) result.words.forEach(w => {
    const details = create('details', 'word-score');
    details.append(create('summary', '', `${w.word || ''} · ${Number.isFinite(w.accuracy) ? Math.round(w.accuracy) + '/100' : 'sin puntuación'}${w.error && w.error !== 'None' ? ' · ' + w.error : ''}`));
    if (Array.isArray(w.phonemes) && w.phonemes.length) w.phonemes.forEach(p => details.append(create('p', '', `${p.phoneme || ''}: ${Number.isFinite(p.accuracy) ? Math.round(p.accuracy) + '/100' : 'sin puntuación'}`)));else details.append(create('p', '', 'Sin detalle por fonema en esta respuesta.'));
    target.append(details);
  });
}
async function translate() {
  if (!config.translation || !selectedWord) return;
  const word = selectedWord;
  const token = ++translationToken;
  $('word-translate').disabled = true;
  try {
    const result = await api('/api/translate', {
      text: word
    });
    if (token !== translationToken) return;
    if (typeof result.translation !== 'string') throw Error('Traducción no disponible.');
    $('word-meaning').textContent = result.translation;
    $('word-meaning').dataset.translatedWord = word;
    $('word-source').textContent = typeof result.source === 'string' ? result.source.slice(0, 120) : 'Traducción en línea · origen no registrado';
    if (state.vocab[word]) {
      state.vocab[word].meaning = result.translation;
      state.vocab[word].source = $('word-source').textContent;
      save();
    }
    notify(`Traducción en línea${result.source ? ' · ' + result.source : ''}. Revisa su sentido en contexto.`);
  } catch (error) {
    if (token === translationToken) notify(error.message, true);
  } finally {
    if (token === translationToken) $('word-translate').disabled = false;
  }
}
function addBook(title, text) {
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) throw Error('El libro no contiene texto legible.');
  if (clean.length > 500000) throw Error('El límite de esta versión es de 500.000 caracteres por lectura.');
  if (state.books.length >= 30) throw Error('El límite de esta versión es de 30 libros importados.');
  const book = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim().slice(0, 120) || 'Mi lectura',
    text: clean,
    level: 'Personal',
    subtitle: 'Texto importado por ti · Nivel sin evaluar'
  };
  stopSpeech();
  clearRecording();
  state.books.push(book);
  state.currentBook = book.id;
  const persisted = save();
  showView('reader');
  renderReader();
  if (persisted) notify('Tu lectura ya está en la biblioteca.');
  return persisted;
}
function downloadProgress() {
  const blob = new Blob([JSON.stringify({
    ...state,
    exportedAt: new Date().toISOString()
  }, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = create('a');
  link.href = url;
  link.download = `readlingo-progreso-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Exportación creada con tus lecturas, palabras y progreso.');
}
function validateBackup(value) {
  const invalid = () => { throw Error('El respaldo no tiene un formato válido de ReadLingo.'); };
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.books) || value.books.length > 30 || !isObject(value.positions) || !isObject(value.vocab)) invalid();
  const books = [], ids = new Set(SEED_BOOKS.map(b => b.id));
  for (const b of value.books) {
    if (!isObject(b) || typeof b.id !== 'string' || !/^user-[\w-]+$/.test(b.id) || ids.has(b.id) || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 120 || typeof b.text !== 'string' || !b.text.trim() || b.text.length > 500000) invalid();
    ids.add(b.id);
    books.push({id: b.id, title: b.title, text: b.text, level: 'Personal', subtitle: 'Texto importado por ti · Nivel sin evaluar'});
  }
  if (!ids.has(value.currentBook)) invalid();
  const positions = {}, vocab = {};
  for (const [key, pos] of Object.entries(value.positions)) {
    if (!ids.has(key) || !Number.isSafeInteger(pos) || pos < 0) invalid();
    positions[key] = pos;
  }
  if (Object.keys(value.vocab).length > 10000) invalid();
  for (const [key, v] of Object.entries(value.vocab)) {
    if (!validKey(key) || !isObject(v) || typeof v.meaning !== 'string' || v.meaning.length > 2000 || !['learning', 'known'].includes(v.status) || !Number.isFinite(v.due) || v.due < 0 || v.due > 8640000000000000 || !Number.isFinite(v.interval) || v.interval < 0 || v.interval > 3650 || (v.ipa !== undefined && (typeof v.ipa !== 'string' || v.ipa.length > 120)) || (v.source !== undefined && (typeof v.source !== 'string' || v.source.length > 120))) invalid();
    vocab[key] = {meaning: v.meaning, ipa: v.ipa || '', source: v.source || 'Origen no registrado', status: v.status, due: v.due, interval: v.interval};
  }
  return {version: 1, books, currentBook: value.currentBook, positions, vocab};
}
function restoreProgress(text) {
  const candidate = validateBackup(JSON.parse(text));
  // Persist first: a quota failure must leave the current session intact.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
  stopSpeech();
  clearRecording();
  translationToken++;
  sentenceTranslationToken++;
  state = candidate;
  selectedWord = '';
  $('selected-word').textContent = 'Descubre una palabra';
  $('word-meaning').textContent = 'Pulsa una palabra para consultar su significado.';
  $('word-ipa').textContent = '';
  $('word-source').textContent = 'Selecciona una palabra para ver el origen de su significado.';
  ['word-save', 'word-known', 'word-listen'].forEach(id => $(id).disabled = true);
  $('word-translate').hidden = true;
  showView('reader');
  renderReader();
  notify('Respaldo restaurado: lecturas, palabras y progreso recuperados.');
}
$('nav-reader').addEventListener('click', () => showView('reader'));
$('nav-vocab').addEventListener('click', () => showView('vocab'));
$('nav-review').addEventListener('click', () => showView('review'));
$('prev').addEventListener('click', () => navigate(-1));
$('next').addEventListener('click', () => navigate(1));
function navigate(delta) {
  stopSpeech();
  clearRecording();
  state.positions[currentBook().id] = Math.max(0, Math.min(paragraphs().length - 1, position() + delta));
  save();
  renderReader();
}
$('listen').addEventListener('click', () => speak(sentences, true));
$('stop-listen').addEventListener('click', stopSpeech);
$('word-listen').addEventListener('click', () => speak([selectedWord]));
$('sentence-listen').addEventListener('click', () => speak([$('practice-text').textContent]));
$('word-save').addEventListener('click', () => storeWord('learning'));
$('word-known').addEventListener('click', () => storeWord('known'));
$('word-translate').addEventListener('click', translate);
$('sentence-translate').addEventListener('click', async () => {
  if (!config.translation) return;
  const token = ++sentenceTranslationToken;
  const text = $('practice-text').textContent;
  $('sentence-translate').disabled = true;
  try {
    const result = await api('/api/translate', {
      text
    });
    if (token !== sentenceTranslationToken) return;
    if (typeof result.translation !== 'string') throw Error('Traducción no disponible.');
    $('sentence-translation').textContent = result.translation + (result.source ? ' · ' + result.source : '');
    $('sentence-translation').hidden = false;
  } catch (error) {
    if (token === sentenceTranslationToken) notify(error.message, true);
  } finally {
    if (token === sentenceTranslationToken) $('sentence-translate').disabled = false;
  }
});
$('practice-sentence').addEventListener('change', () => {
  stopSpeech();
  updatePractice();
});
$('record').addEventListener('click', toggleRecording);
$('audio-consent').addEventListener('change', () => {
  $('assess').disabled = assessmentBusy || !recordBlob || !$('audio-consent').checked;
});
$('assess').addEventListener('click', assess);
$('paste-top').addEventListener('click', () => $('paste-dialog').showModal());
$('add-text').addEventListener('click', () => $('paste-dialog').showModal());
$('close-paste').addEventListener('click', () => $('paste-dialog').close());
$('paste-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    addBook($('paste-title').value, $('paste-content').value);
    $('paste-form').reset();
    $('paste-dialog').close();
  } catch (error) {
    notify(error.message, true);
  }
});
$('import-button').addEventListener('click', () => $('file-input').click());
async function importReading(file) {
  if (file.size > 10 * 1024 * 1024) throw Error('El archivo supera el límite de 10 MB.');
  if (/\.txt$/i.test(file.name)) {
    let text;
    try {
      text = new TextDecoder('utf-8', {fatal: true}).decode(await file.arrayBuffer());
    } catch (error) {
      throw Error('Guarda el archivo TXT con codificación UTF-8.');
    }
    if (text.includes('\u0000')) throw Error('El archivo no parece texto UTF-8.');
    addBook(file.name.replace(/\.txt$/i, ''), text);
    return;
  }
  if (!/\.epub$/i.test(file.name)) throw Error('Importa un archivo TXT o EPUB sin DRM.');
  if (!globalThis.ReadLingoEpub) throw Error('No se pudo cargar el importador EPUB. Recarga la página e inténtalo de nuevo.');
  const result = await ReadLingoEpub.extract(await file.arrayBuffer());
  const persisted = addBook(result.title || file.name.replace(/\.epub$/i, ''), result.text);
  if (persisted && result.language && !/^en(?:-|$)/i.test(result.language)) {
    notify(`El EPUB declara el idioma «${result.language}». Se conserva el texto original; ReadLingo no lo traduce automáticamente. Para practicar inglés, importa una edición en inglés.`);
  }
}
$('file-input').addEventListener('change', async () => {
  const file = $('file-input').files[0];
  $('file-input').value = '';
  if (!file) return;
  $('import-button').disabled = true;
  $('import-button').textContent = 'Importando…';
  try {
    await importReading(file);
  } catch (error) {
    notify(error.message || 'No se pudo importar el libro.', true);
  } finally {
    $('import-button').disabled = false;
    $('import-button').textContent = '＋ Importar libro';
  }
});
$('export-data').addEventListener('click', downloadProgress);
$('restore-data').addEventListener('click', () => $('restore-input').click());
$('restore-input').addEventListener('change', async () => {
  const file = $('restore-input').files[0];
  $('restore-input').value = '';
  if (!file) return;
  $('restore-data').disabled = true;
  try {
    if (file.size > 64 * 1024 * 1024) throw Error('El respaldo supera el límite de 64 MB.');
    const text = await file.text();
    const candidate = validateBackup(JSON.parse(text));
    if (!confirm(`¿Restaurar ${candidate.books.length} lecturas importadas y ${Object.keys(candidate.vocab).length} palabras? Reemplazará tu progreso actual. Exporta una copia antes de continuar.`)) return;
    restoreProgress(text);
  } catch (error) {
    notify('No se restauró el respaldo. Comprueba el archivo y el espacio disponible en el navegador.', true);
  } finally {
    $('restore-data').disabled = false;
  }
});
$('reset-data').addEventListener('click', () => {
  if (!confirm('¿Eliminar de este navegador tus lecturas importadas, palabras y progreso? Exporta una copia antes si deseas conservarlos.')) return;
  stopSpeech();
  clearRecording();
  state = {
    version: 1,
    books: [],
    currentBook: 'garden',
    positions: {},
    vocab: {}
  };
  selectedWord = '';
  const persisted = save();
  showView('reader');
  renderReader();
  if (persisted) notify('Progreso restablecido.');
});
window.addEventListener('pagehide', () => {
  stopSpeech();
  clearRecording();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && recorder?.state === 'recording') recorder.stop();
});
load();
renderReader();
populateVoices();
if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
if (DEMO_MODE) {
  $('demo-notice').hidden = false;
  $('file-input').accept = '.txt,.epub';
  $('import-help').textContent = 'Importa TXT UTF-8 o EPUB sin DRM de una edición en inglés. Se conserva el texto original, sin traducción automática ni ilustraciones. El archivo se procesa en tu navegador.';
  $('assessment-mode').textContent = 'Grabación local: escucha y compara. Esta demo no envía audio ni ofrece evaluación automática. Azure está disponible en la versión local.';
  $('assessment-controls').hidden = true;
} else api('/api/config').then(value => {
  config = {
    translation: value.translation === true,
    pronunciation: value.pronunciation === true
  };
  $('word-translate').hidden = !config.translation || !selectedWord;
  $('assessment-controls').hidden = !config.pronunciation;
  $('sentence-translate').hidden = !config.translation;
  $('assessment-mode').textContent = config.pronunciation ? 'Graba hasta 20 segundos. Evaluación en inglés de EE. UU. El audio solo se envía a Azure cuando das tu consentimiento y pulsas Evaluar.' : 'Grabación local: escucha y compara. Sin credenciales configuradas no hay evaluación fonética automática.';
}).catch(() => notify('Los servicios en línea no están disponibles. Puedes leer, escuchar y guardar palabras localmente.'));
setInterval(updateCounts, 60000);
