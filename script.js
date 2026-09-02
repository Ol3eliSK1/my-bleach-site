const body = document.body;
const themeSelect = document.querySelector('#theme-select');
const savedTheme = localStorage.getItem('bleach-theme') || 'dark';
function setTheme(theme) {
  body.dataset.theme = theme;
  if (themeSelect) themeSelect.value = theme;
  localStorage.setItem('bleach-theme', theme);
}
setTheme(savedTheme);
themeSelect?.addEventListener('change', (event) => setTheme(event.target.value));
const menuTrigger = document.querySelector('.menu-trigger');
const menuPanel = document.querySelector('.menu-panel');
const closeMenuControls = document.querySelectorAll('[data-close-menu]');
const modal = document.querySelector('#transmission-modal');
const playTriggers = document.querySelectorAll('.play-trigger');
const modalCloseControls = document.querySelectorAll('[data-close-modal]');
const toast = document.querySelector('.toast');

function setMenu(open) {
  body.classList.toggle('menu-open', open);
  menuTrigger?.setAttribute('aria-expanded', String(open));
  if (open) {
    window.setTimeout(() => menuPanel?.querySelector('a')?.focus(), 220);
  } else {
    menuTrigger?.focus();
  }
}

menuTrigger?.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
closeMenuControls.forEach((control) => control.addEventListener('click', () => setMenu(false)));
menuPanel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

function setModal(open) {
  if (!modal) return;
  modal.hidden = !open;
  body.classList.toggle('modal-open', open);
  if (open) {
    modal.querySelector('.modal-close')?.focus();
  }
}

playTriggers.forEach((trigger) => trigger.addEventListener('click', () => setModal(true)));
modalCloseControls.forEach((control) => control.addEventListener('click', () => setModal(false)));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (body.classList.contains('menu-open')) setMenu(false);
  if (modal && !modal.hidden) setModal(false);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const tabs = document.querySelectorAll('.roster-tab');
const rosterCards = document.querySelectorAll('.roster-card[data-group]');
let activeFilter = 'all';
let searchTerm = '';
function applyRosterFilters() {
  let visible = 0;
  rosterCards.forEach((card) => {
    const name = card.querySelector('.roster-info h3')?.textContent.toLowerCase() || '';
    const match = (activeFilter === 'all' || card.dataset.group === activeFilter) && name.includes(searchTerm);
    card.hidden = !match;
    if (match) visible += 1;
  });
  const status = document.querySelector('#search-status');
  if (status) status.textContent = searchTerm ? `พบ ${visible} แฟ้มจาก “${searchTerm}”` : `แสดง ${visible} แฟ้ม`;
}
tabs.forEach((tab) => tab.addEventListener('click', () => {
  activeFilter = tab.dataset.filter;
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  applyRosterFilters();
}));
document.querySelector('#character-search')?.addEventListener('input', (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  applyRosterFilters();
});

let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3600);
}

document.querySelectorAll('.join-trigger').forEach((button) => button.addEventListener('click', () => {
  showToast('Transmission request received. The archive will find you.');
  if (modal && !modal.hidden) setModal(false);
}));

let activeAudio = null;
let activeVoiceButton = null;
document.querySelectorAll('.voice-button').forEach((button) => {
  button.addEventListener('click', () => {
    const source = button.dataset.voice;
    if (!source) return;
    if (activeAudio && activeVoiceButton === button) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      button.classList.remove('is-playing');
      button.querySelector('span').textContent = '▶';
      button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Pause', 'Play'));
      activeAudio = null;
      activeVoiceButton = null;
      return;
    }
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeVoiceButton?.classList.remove('is-playing');
      if (activeVoiceButton) {
        activeVoiceButton.querySelector('span').textContent = '▶';
        activeVoiceButton.setAttribute('aria-label', activeVoiceButton.getAttribute('aria-label').replace('Pause', 'Play'));
      }
    }
    activeAudio = new Audio(source);
    activeVoiceButton = button;
    button.classList.add('is-playing');
    button.querySelector('span').textContent = 'Ⅱ';
    button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Play', 'Pause'));
    activeAudio.play().catch(() => showToast('ไม่สามารถเล่นไฟล์เสียงในเบราว์เซอร์นี้ได้'));
    activeAudio.addEventListener('ended', () => {
      button.classList.remove('is-playing');
      button.querySelector('span').textContent = '▶';
      button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Pause', 'Play'));
      activeAudio = null;
      activeVoiceButton = null;
    }, { once: true });
  });
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.media-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const rotateY = ((event.clientX - bounds.left) / bounds.width - .5) * 5;
      const rotateX = ((event.clientY - bounds.top) / bounds.height - .5) * -5;
      card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

const bgm = document.querySelector('#archive-bgm');
const bgmToggle = document.querySelector('#bgm-toggle');
bgmToggle?.addEventListener('click', () => {
  if (!bgm) return;
  if (bgm.paused) {
    bgm.volume = .18;
    bgm.play().then(() => {
      bgmToggle.classList.add('is-on');
      bgmToggle.setAttribute('aria-pressed', 'true');
      bgmToggle.querySelector('.bgm-label').textContent = 'BGM ON';
    }).catch(() => showToast('แตะอีกครั้งเพื่อเปิดเสียงประกอบ')); 
  } else {
    bgm.pause();
    bgmToggle.classList.remove('is-on');
    bgmToggle.setAttribute('aria-pressed', 'false');
    bgmToggle.querySelector('.bgm-label').textContent = 'BGM OFF';
  }
});

let soundContext;
function playClickSfx() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  soundContext ||= new AudioContext();
  const oscillator = soundContext.createOscillator();
  const gain = soundContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(740, soundContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(460, soundContext.currentTime + .055);
  gain.gain.setValueAtTime(.045, soundContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, soundContext.currentTime + .07);
  oscillator.connect(gain).connect(soundContext.destination);
  oscillator.start();
  oscillator.stop(soundContext.currentTime + .075);
}
document.addEventListener('click', (event) => {
  if (event.target.closest('button, a')) playClickSfx();
});

const characterModal = document.querySelector('#character-modal');
const detailVoiceButton = document.querySelector('#character-modal-voice');
const factionNames = { shinigami: 'ยมทูต / SHINIGAMI', arrancar: 'อารันคา / ARRANCAR', quincy: 'ควินซี่ / QUINCY', 'zero-squad': 'หน่วยศูนย์ / ZERO SQUAD' };
const factionStories = {
  shinigami: 'ผู้พิทักษ์สมดุลระหว่างโลกมนุษย์และโซลโซไซตี้ ผู้ใช้ดาบฟันวิญญาณเพื่อส่งวิญญาณและปกป้องผู้ที่ยังมีชีวิต',
  arrancar: 'สิ่งมีชีวิตฮอลโลว์ที่ถอดหน้ากากออกและได้รับพลังรูปแบบยมทูต นักรบจากฮูเอโก มุนโดที่ขับเคลื่อนด้วยสัญชาตญาณและเกียรติยศ',
  quincy: 'นักรบมนุษย์ผู้ควบคุมอนุภาควิญญาณ พวกเขาต่อสู้ด้วยธนูและพลังเลือดที่สืบทอดผ่านรุ่นสู่รุ่น',
  'zero-squad': 'เหล่านักรบระดับตำนานผู้พิทักษ์ราชวังวิญญาณ พวกเขาคือผู้สร้างรากฐานสำคัญของโซลโซไซตี้และถูกเรียกตัวขึ้นเหนือ 13 หน่วยพิทักษ์'
};
const bankaiProfiles = {
  'Ichigo Kurosaki': ['Tensa Zangetsu', '天鎖斬月', 'คมดาบสีดำบีบอัดแรงกดดันวิญญาณทั้งหมดให้กลายเป็นความเร็วและพลังโจมตีที่เฉียบคม', 'ichigo'],
  'Rukia Kuchiki': ['Hakka no Togame', '白霞罰', 'อุณหภูมิที่ลดลงจนทุกสิ่งหยุดนิ่ง—ความงามสีขาวที่ต้องควบคุมด้วยความแม่นยำ', 'ice'],
  'Kenpachi Zaraki': ['Nozarashi', '野晒', 'พลังดิบของนักรบแห่งกองที่ 11 แปรเปลี่ยนเป็นคมดาบทำลายล้าง', 'blood'],
  'Byakuya Kuchiki': ['Senbonzakura Kageyoshi', '千本桜景厳', 'ทะเลกลีบดาบนับพันที่รวมตัวเป็นเขตประหารอันเงียบงัน', 'petal'],
  'Genryusai Yamamoto': ['Zanka no Tachi', '残火の太刀', 'เปลวเพลิงทั้งหมดถูกรวมไว้ในคมดาบเดียวจนความร้อนกลายเป็นสุญญากาศ', 'flame'],
  'Sosuke Aizen': ['Kyoka Suigetsu', '鏡花水月', 'ภาพลวงตาสมบูรณ์แบบที่บิดเบือนประสาทสัมผัสทั้งหมด—ไม่มีสิ่งใดเชื่อได้', 'illusion'],
  'Kisuke Urahara': ['Kannonbiraki Benihime Aratame', '観音開紅姫改メ', 'พลังแห่งการผ่าตัดและประกอบสสารใหม่ เปลี่ยนทุกสิ่งที่สัมผัสให้เป็นโครงสร้างใหม่', 'seam'],
  'Ichibe Hyosube': ['Shirafude Ichimonji', '白筆一文字', 'หมึกของผู้ตั้งชื่อสามารถลบความหมายของพลังและเขียนชื่อใหม่ให้สิ่งที่อยู่ตรงหน้า', 'ink'],
  'Oetsu Nimaiya': ['Sayafushi', '鞘伏', 'คมดาบต้นกำเนิดที่ไม่มีฝักและไม่เคยทื่อ—ประกายเหล็กตัดผ่านความมืดของราชวัง', 'steel'],
  'Senjumaru Shutara': ['Shatatsu Karagara Shigarami no Tsuji', '娑闥迦羅骸刺絡辻', 'ม่านผ้าและด้ายทองนับไม่ถ้วนเย็บชะตากรรมของศัตรูให้ติดอยู่ในโลกที่เธอทอขึ้น', 'thread'],
  'Tenjiro Kirinji': ['Kinpika', '金毘迦', 'แสงสีทองของน้ำพุร้อนฟื้นฟูร่างกายและเผาผลาญความเสียหายจนหมดสิ้น', 'steam'],
  'Kirio Hikifune': ['Gorō no Fuku', '餓樂廻廊', 'พลังชีวิตที่หล่อเลี้ยงจากอาหารแปรเปลี่ยนเป็นเถาวัลย์สีทองและแรงกดดันมหาศาล', 'feast']
};
const iconicQuotes = {
  'Ichigo Kurosaki': ['俺が守る。何度でも、何度でも立ち上がってやる。', 'Vdeio/characters/ichigo-kurosaki-quote-ja.wav'],
  'Rukia Kuchiki': ['舞え、袖白雪。私の誇りは、決して折れない。', 'Vdeio/characters/rukia-kuchiki-quote-ja.wav'],
  'Kenpachi Zaraki': ['俺は更木剣八だ。さあ、もっと楽しませろ！', 'Vdeio/characters/kenpachi-zaraki-quote-ja.wav'],
  'Byakuya Kuchiki': ['散れ、千本桜。誇りを懸けて、道を開く。', 'Vdeio/characters/byakuya-kuchiki-quote-ja.wav'],
  'Genryusai Yamamoto': ['万象一切灰燼と為せ、流刃若火。', 'Vdeio/characters/yamamoto-quote-ja.wav'],
  'Sosuke Aizen': ['砕けろ、鏡花水月。見えているものだけが真実だと思うな。', 'Vdeio/characters/aizen-sosuke-quote-ja.wav'],
  'Kisuke Urahara': ['啼け、紅姫。さて、ここからが本番ですよ。', 'Vdeio/characters/urahara-kisuke-quote-ja.wav'],
  'Ichibe Hyosube': ['黒蟻とて潰せ、真名呼和尚。名を奪えば、力もまた消える。', 'Vdeio/characters/ichibe-hyosube-quote-ja.wav'],
  'Oetsu Nimaiya': ['伸びろ、鞘伏！最高の一振り、見せてやるぜ。', 'Vdeio/characters/ouetsu-nimaiya-quote-ja.wav'],
  'Senjumaru Shutara': ['祈れ、金毘迦。すべての運命を、私の糸で縫い留めましょう。', 'Vdeio/characters/senjumaru-shutara-quote-ja.wav'],
  'Tenjiro Kirinji': ['金毘迦！熱く燃えて、傷ごと流しちまいな！', 'Vdeio/characters/tenjiro-kirinji-quote-ja.wav'],
  'Kirio Hikifune': ['餓樂廻廊！さあ、たっぷり味わって力をつけなさい。', 'Vdeio/characters/kiriyo-hikifune-quote-ja.wav']
};
function closeCharacterModal() {
  if (!characterModal) return;
  characterModal.hidden = true;
  body.classList.remove('modal-open');
}
function openCharacterModal(card) {
  if (!characterModal) return;
  const group = card.dataset.group;
  const title = card.querySelector('.roster-info h3')?.textContent || 'Unknown file';
  const role = card.querySelector('.roster-info p')?.textContent || '';
  const image = card.querySelector('.roster-media img');
  const index = card.querySelector('.roster-index')?.textContent || 'CHARACTER FILE';
  const voice = card.querySelector('.voice-button')?.dataset.voice || '';
  const bankai = bankaiProfiles[title] || ['การปลดปล่อยซันปาคุโตะ', '解放', 'คลื่นพลังของแฟ้มนี้กำลังถูกอ่านจากบันทึกวิญญาณ', group];
  const quote = iconicQuotes[title] || ['この力を、今ここに解放する。', voice];
  document.querySelector('#character-modal-title').textContent = title;
  document.querySelector('#character-modal-role').textContent = role;
  document.querySelector('#character-modal-index').textContent = index;
  document.querySelector('#character-modal-faction').textContent = factionNames[group] || group;
  document.querySelector('#character-modal-kicker').textContent = `${index} / DOSSIER`;
  document.querySelector('#character-modal-bio').textContent = `${factionStories[group] || ''} ${title} คือแฟ้มที่ถูกจัดเป็นกำลังสำคัญของสนามรบในบันทึกนี้ เสียงพากย์ญี่ปุ่นและรายละเอียดของแฟ้มจะถูกเรียกดูจากการ์ดโดยตรง`;
  const modalImage = document.querySelector('#character-modal-image');
  modalImage.src = image?.src || '';
  modalImage.alt = image?.alt || title;
  detailVoiceButton.dataset.voice = voice;
  detailVoiceButton.setAttribute('aria-label', `เล่นเสียงพากย์ญี่ปุ่นของ ${title}`);
  const bankaiReveal = document.querySelector('#bankai-reveal');
  bankaiReveal?.setAttribute('data-bankai-style', bankai[3]);
  document.querySelector('#bankai-title').textContent = bankai[0];
  document.querySelector('#bankai-name').textContent = bankai[1];
  document.querySelector('#bankai-note').textContent = bankai[2];
  document.querySelector('#bankai-quote-text').textContent = quote[0];
  const quoteButton = document.querySelector('#bankai-trigger');
  if (quoteButton) quoteButton.dataset.quote = quote[1];
  bankaiReveal?.classList.remove('is-igniting');
  requestAnimationFrame(() => bankaiReveal?.classList.add('is-igniting'));
  characterModal.hidden = false;
  body.classList.add('modal-open');
}
document.querySelectorAll('.media-card').forEach((card) => card.addEventListener('click', (event) => {
  if (event.target.closest('.voice-button')) return;
  openCharacterModal(card);
}));
document.querySelectorAll('[data-close-character]').forEach((control) => control.addEventListener('click', closeCharacterModal));
detailVoiceButton?.addEventListener('click', () => {
  const source = detailVoiceButton.dataset.voice;
  if (!source) return;
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; }
  activeAudio = new Audio(source);
  activeAudio.play().catch(() => showToast('ไม่สามารถเล่นเสียงไฟล์นี้ในเบราว์เซอร์ได้'));
  detailVoiceButton.classList.add('is-playing');
  detailVoiceButton.querySelector('span').textContent = 'Ⅱ';
  activeAudio.addEventListener('ended', () => {
    detailVoiceButton.classList.remove('is-playing');
    detailVoiceButton.querySelector('span').textContent = '▶';
    activeAudio = null;
  }, { once: true });
});
let bankaiAudioGraph = null;
function playBankaiVoiceWithFx(source) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  activeAudio = new Audio(source);
  activeAudio.preload = 'auto';
  if (!AudioContext) return activeAudio.play();
  soundContext ||= new AudioContext();
  const ctx = soundContext;
  const input = ctx.createMediaElementSource(activeAudio);
  const highpass = ctx.createBiquadFilter();
  const lowpass = ctx.createBiquadFilter();
  const compressor = ctx.createDynamicsCompressor();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const master = ctx.createGain();
  const reverb = ctx.createConvolver();
  const impulseLength = Math.floor(ctx.sampleRate * .72);
  const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < impulseLength; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2.7);
  }
  reverb.buffer = impulse;
  highpass.type = 'highpass'; highpass.frequency.value = 85;
  lowpass.type = 'lowpass'; lowpass.frequency.value = 9200;
  compressor.threshold.value = -18; compressor.knee.value = 14; compressor.ratio.value = 3.2; compressor.attack.value = .012; compressor.release.value = .18;
  dry.gain.value = .86; wet.gain.value = .22; master.gain.value = .92;
  input.connect(highpass).connect(lowpass).connect(compressor);
  compressor.connect(dry).connect(master);
  compressor.connect(reverb).connect(wet).connect(master);
  master.connect(ctx.destination);
  bankaiAudioGraph = { input, highpass, lowpass, compressor, dry, wet, master, reverb };
  return activeAudio.play();
}
function playIconicQuote() {
  const button = document.querySelector('#bankai-trigger');
  const source = button?.dataset.quote;
  if (!source) return;
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; }
  bankaiAudioGraph = null;
  playBankaiVoiceWithFx(source).catch(() => showToast('ไม่สามารถเล่นเสียง Bankai ในเบราว์เซอร์ได้'));
  button.classList.add('is-quoting');
  activeAudio.addEventListener('ended', () => {
    button.classList.remove('is-quoting');
    Object.values(bankaiAudioGraph || {}).forEach((node) => node.disconnect?.());
    bankaiAudioGraph = null;
    activeAudio = null;
  }, { once: true });
}
document.querySelector('#bankai-trigger')?.addEventListener('click', () => {
  const reveal = document.querySelector('#bankai-reveal');
  reveal?.classList.remove('is-igniting');
  requestAnimationFrame(() => reveal?.classList.add('is-igniting'));
  playIconicQuote();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && characterModal && !characterModal.hidden) closeCharacterModal();
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    document.querySelector('#character-search')?.focus();
  }
});

const statNames = ['พลัง', 'ความเร็ว', 'แรงดันวิญญาณ', 'ป้องกัน'];
const featuredStats = {
  'Ichigo Kurosaki': [96, 94, 97, 91], 'Rukia Kuchiki': [78, 84, 82, 76], 'Kenpachi Zaraki': [98, 81, 93, 96],
  'Uryu Ishida': [88, 91, 90, 79], 'Genryusai Yamamoto': [99, 72, 100, 98], 'Byakuya Kuchiki': [90, 89, 91, 87],
  'Sosuke Aizen': [99, 94, 99, 95], 'Kisuke Urahara': [93, 90, 96, 91],
  'Ichibe Hyosube': [100, 92, 100, 99], 'Oetsu Nimaiya': [98, 97, 95, 93], 'Senjumaru Shutara': [97, 91, 98, 94],
  'Tenjiro Kirinji': [95, 99, 92, 96], 'Kirio Hikifune': [94, 88, 97, 95],
  'Coyote Starrk': [92, 88, 90, 84], 'Grimmjow Jaegerjaquez': [87, 91, 83, 82], 'Yhwach': [100, 96, 100, 99],
  'Jugram Haschwalth': [97, 88, 96, 95], 'Bambietta Basterbine': [85, 86, 84, 78]
};
function deriveStats(name, group, index) {
  if (featuredStats[name]) return featuredStats[name];
  const base = group === 'shinigami' ? 72 : group === 'arrancar' ? 76 : 80;
  const bump = Math.min(18, Math.max(0, 35 - index));
  return [base + bump, base + (index % 9), base + bump - 2, base + (index % 7)];
}
const compareA = document.querySelector('#compare-a');
const compareB = document.querySelector('#compare-b');
const comparisonGrid = document.querySelector('#comparison-grid');
const statProfiles = [...rosterCards].map((card) => {
  const name = card.querySelector('.roster-info h3')?.textContent.trim() || 'Unknown';
  const group = card.dataset.group;
  const index = Number(card.querySelector('.roster-index')?.textContent.match(/\d+/)?.[0] || 1);
  return { name, group, image: card.querySelector('img')?.src || '', stats: deriveStats(name, group, index) };
});
function fillCompareSelect(select, selected) {
  if (!select) return;
  select.innerHTML = statProfiles.map((profile) => `<option value="${profile.name}" ${profile.name === selected ? 'selected' : ''}>${profile.name}</option>`).join('');
}
fillCompareSelect(compareA, 'Ichigo Kurosaki');
fillCompareSelect(compareB, 'Yhwach');
function renderComparison() {
  if (!comparisonGrid) return;
  const chosen = [compareA?.value, compareB?.value].map((name) => statProfiles.find((profile) => profile.name === name)).filter(Boolean);
  comparisonGrid.innerHTML = chosen.map((profile, i) => `<article class="stat-profile ${i ? 'stat-profile-b' : ''}"><div class="stat-profile-head"><img src="${profile.image}" alt=""><div><span>${profile.group.toUpperCase()} / FILE</span><h3>${profile.name}</h3></div><strong>${Math.max(...profile.stats)}</strong></div><div class="stat-bars">${profile.stats.map((value, index) => `<div class="stat-row"><span>${statNames[index]}</span><div><i style="width:${value}%"></i></div><b>${value}</b></div>`).join('')}</div></article>`).join('');
}
renderComparison();
compareA?.addEventListener('change', renderComparison);
compareB?.addEventListener('change', renderComparison);
document.querySelectorAll('.timeline-trigger').forEach((trigger) => trigger.addEventListener('click', () => {
  const item = trigger.closest('.timeline-item');
  document.querySelectorAll('.timeline-item').forEach((other) => { if (other !== item) other.classList.remove('is-active'); });
  item?.classList.toggle('is-active');
}));

const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const factionAbilities = {
  shinigami: { name: 'ยมทูต / SHINIGAMI', color: 'orange', core: 'Reiatsu + Zanpakutō', role: 'ผู้รักษาสมดุลระหว่างโลกมนุษย์กับโซลโซไซตี้', edge: 'ชำนาญการต่อสู้ประชิด, การปลดปล่อยดาบ และเทคนิค Kidō', stats: [['ศักยภาพโจมตี', 88], ['ความคล่องตัว', 84], ['การควบคุมพลัง', 92]], skills: [['Zanpakutō', 'ดาบฟันวิญญาณที่สะท้อนตัวตนของผู้ถือและมีคำปลดปล่อยเฉพาะตัว'], ['Shikai / Bankai', 'การปลดปล่อยสองระดับที่เพิ่มรูปแบบและขอบเขตพลังของดาบ'], ['Kidō', 'คาถาผนึก ทำลาย และป้องกันที่ใช้ด้วยการควบคุม Reiatsu'], ['Shunpo', 'การเคลื่อนที่ความเร็วสูงเพื่อเข้าประชิด หลบหลีก และเปลี่ยนตำแหน่ง']], counter: 'รับมือด้วยการตัดวงจรการปลดปล่อยและโจมตีช่วงก่อนตั้งท่า' },
  arrancar: { name: 'อารันคา / ARRANCAR', color: 'violet', core: 'Hollow Power + Resurrección', role: 'ฮอลโลว์ที่ถอดหน้ากากและยืมรูปแบบพลังของยมทูต', edge: 'พลังทำลายสูง การฟื้นตัว และการต่อสู้ระยะไกลด้วย Cero', stats: [['ศักยภาพโจมตี', 91], ['ความคล่องตัว', 89], ['การควบคุมพลัง', 78]], skills: [['Resurrección', 'ปลดปล่อยดาบเพื่อคืนรูปร่างและความสามารถเฉพาะของฮอลโลว์'], ['Cero / Bala', 'ลำแสงพลังงานเข้มข้นและกระสุนพลังงานสำหรับกดดันต่อเนื่อง'], ['Sonído', 'การเคลื่อนที่ฉับพลันที่เน้นการซ้อนจังหวะและลวงตำแหน่ง'], ['Hierro', 'ผิวเหล็กจากการอัดแน่นพลังวิญญาณเพื่อรับแรงปะทะ']], counter: 'บังคับให้ใช้พลังต่อเนื่องและตัดทางฟื้นตัวด้วยการโจมตีแม่นยำ' },
  quincy: { name: 'ควินซี่ / QUINCY', color: 'gold', core: 'Reishi + Blut', role: 'นักรบมนุษย์ผู้ควบคุมอนุภาควิญญาณจากสิ่งแวดล้อม', edge: 'โจมตีระยะไกล สร้างอาวุธทันที และมีความสามารถเฉพาะตัวระดับ Sternritter', stats: [['ศักยภาพโจมตี', 86], ['ความคล่องตัว', 82], ['การควบคุมพลัง', 95]], skills: [['Heilig Bogen', 'ธนูแสงที่รวม Reishi เป็นลูกศรและยิงจากระยะปลอดภัย'], ['Blut Vene / Arterie', 'เส้นทางเลือดพลังวิญญาณสำหรับเสริมการป้องกันหรือการโจมตี'], ['Sklaverei', 'ดูดกลืนและควบคุม Reishi รอบตัวเพื่อเพิ่มทรัพยากรพลัง'], ['Vollständig', 'ปีกและวงแหวนพลังที่ขยายความสามารถของควินซี่ขั้นสูง']], counter: 'บีบพื้นที่และตัด Reishi รอบตัวเพื่อลดศักยภาพการยิงและการสร้างอาวุธ' },
  'zero-squad': { name: 'หน่วยศูนย์ / ZERO SQUAD', color: 'cyan', core: 'Royal Guard + Origin Arts', role: 'ผู้พิทักษ์ราชวังวิญญาณ ผู้สร้างรากฐานของพลังและวัฒนธรรมใน Soul Society', edge: 'ความสามารถระดับตำนานที่เปลี่ยนกฎของพื้นที่ ชื่อ อาวุธ และชีวิต', stats: [['ศักยภาพโจมตี', 99], ['ความคล่องตัว', 93], ['การควบคุมพลัง', 100]], skills: [['Name Authority', 'อำนาจของชื่อและหมึกที่เปลี่ยนความหมายของพลังในสนามรบ'], ['Asauchi Forging', 'ศิลปะการสร้างรากฐานของ Zanpakutō และคมดาบที่เชื่อมกับวิญญาณ'], ['Textile Dominion', 'การทอผ้า ด้าย และพื้นที่จำลองเพื่อปิดผนึกชะตากรรมของเป้าหมาย'], ['Life Restoration', 'การรักษาและฟื้นฟูด้วยน้ำพุร้อน อาหาร และพลังชีวิตที่ถูกหลอมใหม่']], counter: 'แฟ้มระดับราชวัง—ไม่มี counter มาตรฐาน ต้องประสานพลังหลายฝ่ายและทำลายเงื่อนไขของสนาม' }
};
const abilityTabs = document.querySelectorAll('.ability-tab');
const abilityOverview = document.querySelector('#ability-overview');
const abilitySkillGrid = document.querySelector('#ability-skill-grid');
function renderAbilities(group = 'shinigami') {
  const data = factionAbilities[group];
  if (!data || !abilityOverview || !abilitySkillGrid) return;
  abilityOverview.dataset.accent = data.color;
  abilityOverview.innerHTML = `<p class="eyebrow accent">${data.name}</p><h3>${data.core}</h3><p>${data.role}</p><div class="ability-facts"><span><small>COMBAT EDGE</small><strong>${data.edge}</strong></span><span><small>TACTICAL COUNTER</small><strong>${data.counter}</strong></span></div><div class="ability-meter-list">${data.stats.map(([label, value]) => `<div class="ability-meter"><span>${label}</span><div><i style="width:${value}%"></i></div><b>${value}</b></div>`).join('')}</div>`;
  abilitySkillGrid.innerHTML = data.skills.map(([name, detail], index) => `<article class="ability-skill"><span>0${index + 1}</span><div><h4>${name}</h4><p>${detail}</p></div></article>`).join('');
}
abilityTabs.forEach((tab) => tab.addEventListener('click', () => { abilityTabs.forEach((item) => { const active = item === tab; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); }); renderAbilities(tab.dataset.abilityFilter); }));
renderAbilities();
