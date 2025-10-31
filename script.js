// ServiceHub main JavaScript
// Этот файл содержит весь функционал сайта, перенесённый из HTML,
// включая авторизацию, карточки исполнителей, админ‑панель и настройки.

// Используем отдельные ключи хранилища для тёмной темы,
// чтобы не конфликтовать с данными других версий
const LS = { users:'sd_users', session:'sd_session', sellers:'sd_sellers' };
function read(key, def){ try{ const raw = localStorage.getItem(key); const v = raw==null? undefined : JSON.parse(raw); return v!==undefined? v: def; }catch(e){ return def; } }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Получить список категорий из настроек или из значений по умолчанию
function getCategories(){
  const st = getSettings();
  if(st.categories && Array.isArray(st.categories) && st.categories.length){
    return st.categories;
  }
  return DEFAULT_SETTINGS.categories;
}
// Получить читаемое имя категории
function catLabel(v){
  const cats = getCategories();
  const found = cats.find(it => it.key === v);
  return found ? found.label : (v || '—');
}
function statusLabel(v){ return ({verified:'Проверенный', seller:'Исполнитель', recruiter:'Рекрутер', unverified:'Не проверен', blocked:'Заблокирован'})[v] || 'Исполнитель'; }

// Получить список избранных исполнителей текущего пользователя. Возвращает массив ID.
function getFavorites(){
  const s = getSession();
  if(!s) return [];
  const key = `sd_favorites_${s.u}`;
  const favs = read(key, []);
  return Array.isArray(favs) ? favs : [];
}

// Сохранить список избранных исполнителей для текущего пользователя
function setFavorites(arr){
  const s = getSession();
  if(!s) return;
  const key = `sd_favorites_${s.u}`;
  write(key, Array.isArray(arr) ? arr : []);
}

// Посчитать средний рейтинг исполнителя. Если отзывов нет, возвращает 0.
function avgRating(s){
  const revs = Array.isArray(s.reviews) ? s.reviews : [];
  if(revs.length === 0) return 0;
  const sum = revs.reduce((a, r) => a + Number(r.rating || 0), 0);
  return sum / revs.length;
}

// Словарь переводов интерфейса. Дополняйте при необходимости.
const TRANSLATIONS = {
  ru: {
    nav_home: 'Главная',
    nav_ads: 'Реклама',
    nav_how: 'Как попасть',
    nav_profile: 'Профиль',
    nav_admin: 'Админ‑панель',
    guarantee_title: 'Безопасные сделки и честные исполнители',
    guarantee_subtitle: 'Мы поддерживаем безопасные платежи и прозрачные условия работы.',
    guarantee_btn: 'Подробнее',
    search_placeholder: 'Поиск исполнителей, услуг, категорий…',
    ads_heading: 'Реклама',
    how_heading: 'Как попасть в каталог',
    how_step_registration_title: '👤 Регистрация',
    how_step_registration_desc: 'Создайте учётную запись или войдите в существующий аккаунт, чтобы получить доступ к кабинету исполнителя.',
    how_step_card_title: '📇 Заполните карточку',
    how_step_card_desc: 'Добавьте карточку исполнителя с описанием ваших услуг, опытом работы, реализованными проектами и контактами.',
    how_step_moderation_title: '🔍 Модерация',
    how_step_moderation_desc: 'Отправленная карточка поступит на проверку модератору. После одобрения она появится в каталоге.',
    how_step_trust_title: '⭐ Повышение доверия',
    how_step_trust_desc: 'Для большего доверия аудитории приобретите статус «Проверенный» и закрепите карточку в верхней части каталога.',
    how_cta_text: 'Если у вас остались вопросы, наша служба поддержки всегда готова помочь.',
    how_cta_btn: 'Написать в Telegram',
    ads_card_status_title: '🏅 Покупка статуса',
    ads_card_status_desc: 'Получите статус «Проверенный» или «Рекрутер»',
    ads_card_pin_title: '📌 Закреп строчки продавца',
    ads_card_pin_desc: 'Ваша карточка всегда сверху',
    ads_card_banner_title: '🖼️ Покупка баннера в шапке',
    ads_card_banner_desc: 'Реклама в заголовке каталога',
    ads_card_ticker_title: '📢 Покупка бегущей строки',
    ads_card_ticker_desc: 'Ваш текст увидят все',
    how_heading_short: 'Как попасть'
    , favorites_filter: 'Избранные'
  },
  en: {
    nav_home: 'Home',
    nav_ads: 'Advertising',
    nav_how: 'How to join',
    nav_profile: 'Profile',
    nav_admin: 'Admin',
    guarantee_title: 'Safe deals and honest contractors',
    guarantee_subtitle: 'We support secure payments and transparent terms.',
    guarantee_btn: 'Learn more',
    search_placeholder: 'Search services, providers…',
    ads_heading: 'Advertising',
    how_heading: 'How to join the directory',
    how_step_registration_title: '👤 Sign up',
    how_step_registration_desc: 'Create an account or log in to gain access to your performer dashboard.',
    how_step_card_title: '📇 Fill out your card',
    how_step_card_desc: 'Add a performer card with descriptions of your services, work experience, completed projects, and contacts.',
    how_step_moderation_title: '🔍 Moderation',
    how_step_moderation_desc: 'Submitted card will be reviewed by the moderator. After approval it appears in the catalog.',
    how_step_trust_title: '⭐ Increase trust',
    how_step_trust_desc: 'To gain more trust from the audience, purchase a "Verified" status and pin your card at the top of the catalog.',
    how_cta_text: 'If you have any questions, our support team is always ready to help.',
    how_cta_btn: 'Contact us on Telegram',
    ads_card_status_title: '🏅 Purchase status',
    ads_card_status_desc: 'Get "Verified" or "Recruiter" status',
    ads_card_pin_title: '📌 Pin your listing',
    ads_card_pin_desc: 'Your card always stays on top',
    ads_card_banner_title: '🖼️ Purchase a header banner',
    ads_card_banner_desc: 'Advertising in the catalog header',
    ads_card_ticker_title: '📢 Purchase ticker',
    ads_card_ticker_desc: 'Your text will be seen by everyone',
    how_heading_short: 'How to join'
    , favorites_filter: 'Favorites'
  }
};

// текущий язык интерфейса
let currentLanguage;
// глобальная переменная для поискового запроса. Используется для фильтрации исполнителей по имени, описанию и другим полям
let searchQuery = '';

// Применить выбранный язык ко всем элементам страницы
function applyLanguage(lang){
  currentLanguage = lang;
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.ru;
  // Навигация
  const navHome = document.getElementById('nav-home'); if(navHome) navHome.textContent = tr.nav_home;
  const navAds = document.getElementById('nav-ads'); if(navAds) navAds.textContent = tr.nav_ads;
  const navHow = document.getElementById('nav-how'); if(navHow) navHow.textContent = tr.nav_how;
  const navProfile = document.getElementById('nav-profile'); if(navProfile) navProfile.textContent = tr.nav_profile;
  const navAdmin = document.getElementById('nav-admin'); if(navAdmin) navAdmin.textContent = tr.nav_admin;
  // Переключатель языка показывает другую локаль
  const langToggle = document.getElementById('lang-toggle');
  if(langToggle) langToggle.textContent = lang === 'ru' ? 'EN' : 'RU';
  // Placeholder поиска
  const searchInput = document.getElementById('search-input');
  if(searchInput) searchInput.placeholder = tr.search_placeholder;
  // Гарантийный блок (если используется дефолтный текст)
  document.querySelectorAll('.guarantee h3').forEach(el => { if(el) el.textContent = tr.guarantee_title; });
  document.querySelectorAll('.guarantee p.muted').forEach(el => { if(el) el.textContent = tr.guarantee_subtitle; });
  // Кнопка гарантий (если не переопределена в настройках)
  document.querySelectorAll('.guarantee .guarantee-btn').forEach(el => { if(el) el.textContent = tr.guarantee_btn; });
  // Заголовки разделов
  const adsHeading = document.querySelector('#ads-section h2'); if(adsHeading) adsHeading.textContent = tr.ads_heading;
  const howHeading = document.querySelector('#how-section h2'); if(howHeading) howHeading.textContent = tr.how_heading;
  // Карточки рекламы
  const adsCards = document.querySelectorAll('#ads-section .info-card');
  if(adsCards.length >= 4){
    const keys = [
      ['ads_card_status_title','ads_card_status_desc'],
      ['ads_card_pin_title','ads_card_pin_desc'],
      ['ads_card_banner_title','ads_card_banner_desc'],
      ['ads_card_ticker_title','ads_card_ticker_desc']
    ];
    adsCards.forEach((card, idx) => {
      const head = card.querySelector('.info-head');
      const bodyP = card.querySelector('.info-body p');
      const k = keys[idx];
      if(head && tr[k[0]]) head.textContent = tr[k[0]];
      if(bodyP && tr[k[1]]) bodyP.textContent = tr[k[1]];
    });
  }
  // Карточки «Как попасть»
  const howCards = document.querySelectorAll('#how-section .info-card');
  if(howCards.length >= 4){
    const keys = [
      ['how_step_registration_title','how_step_registration_desc'],
      ['how_step_card_title','how_step_card_desc'],
      ['how_step_moderation_title','how_step_moderation_desc'],
      ['how_step_trust_title','how_step_trust_desc']
    ];
    howCards.forEach((card, idx) => {
      const head = card.querySelector('.info-head');
      const bodyP = card.querySelector('.info-body p');
      const k = keys[idx];
      if(head && tr[k[0]]) head.textContent = tr[k[0]];
      if(bodyP && tr[k[1]]) bodyP.textContent = tr[k[1]];
    });
  }
  // Текст и кнопка внизу страницы «Как попасть»
  const howCtaP = document.querySelector('#how-section .muted');
  if(howCtaP && tr.how_cta_text) howCtaP.textContent = tr.how_cta_text;
  const howCtaBtn = document.querySelector('#how-section a.btn');
  if(howCtaBtn && tr.how_cta_btn) howCtaBtn.textContent = tr.how_cta_btn;

  // Локализация фильтра избранных исполнителей (пункт в списке статусов)
  document.querySelectorAll('.fav-filter').forEach(el => {
    // Текст зависит от языка. Используем переводы из словаря или fallback
    el.textContent = tr.favorites_filter || ((lang === 'en') ? 'Favorites' : 'Избранные');
  });
}

// Ключ для настроек и значения по умолчанию
const SETTINGS_KEY = 'sd_settings';
const DEFAULT_SETTINGS = {
  ticker: {
    items: [
      '✅ 20 новых исполнителей добавлено за неделю',
      '⭐ Мы поддерживаем честные отзывы',
      '🚀 Начни сотрудничество уже сегодня'
    ],
    speed: 28
  },
  banners: {
    slots: [
      {src:'', link:''},
      {src:'', link:''}
    ]
  },
  // Баннер между поиском и каталогом
  midBanner: { src:'', link:'' },
  // Баннер в боковой панели
  sidebarBanner: { src:'', link:'' },
  palette: {
    accent:'',
    accentDark:'',
    accent2:''
  },
  guarantee: {
    title:'Безопасные сделки и честные исполнители',
    subtitle:'Мы поддерживаем безопасные платежи и прозрачные условия работы.'
  },
  // Текст и ссылка для кнопки в блоке гарантий
  guaranteeButton: {
    text:'Подробнее',
    link:'#'
  },
  // Язык интерфейса (ru или en)
  language: 'ru',
  // Категории по умолчанию. Каждая категория имеет ключ и отображаемое имя.
  categories: [
    {key:'design', label:'Дизайн'},
    {key:'programming', label:'Программирование'},
    {key:'marketing', label:'Маркетинг'},
    {key:'seo', label:'SEO'},
    {key:'content', label:'Копирайтинг'},
    {key:'support', label:'Поддержка'}
  ]
  ,
  // Логотип и иконка вкладки. src задаётся через админ‑панель. Если пусто, используется стандартный logo.svg
  logo: { src:'' },
  favicon: { src:'' },
  // Текст уведомления, отображаемого в верхней части страниц
  notification: { text:'ℹ️ Покупайте услуги только у проверенных исполнителей и читайте отзывы.' }
};

function getSettings(){
  const st = read(SETTINGS_KEY, null);
  if(!st) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const res = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  if(st.ticker){ res.ticker.items = Array.isArray(st.ticker.items)? st.ticker.items: res.ticker.items; res.ticker.speed = st.ticker.speed||res.ticker.speed; }
  if(st.banners && Array.isArray(st.banners.slots)){
    res.banners.slots = st.banners.slots.map((it,i)=>{
      const defSlot = {src:'',link:''};
      return Object.assign({}, defSlot, it||{});
    });
  }
  if(st.palette){ res.palette.accent = st.palette.accent||res.palette.accent; res.palette.accentDark = st.palette.accentDark||res.palette.accentDark; res.palette.accent2 = st.palette.accent2||res.palette.accent2; }
  if(st.guarantee){ res.guarantee.title = st.guarantee.title||res.guarantee.title; res.guarantee.subtitle = st.guarantee.subtitle||res.guarantee.subtitle; }
  if(st.categories && Array.isArray(st.categories) && st.categories.length){
    // копируем пользовательские категории, если они есть
    res.categories = st.categories.map(c => ({key:c.key, label:c.label}));
  }
  // midBanner и sidebarBanner
  if(st.midBanner){
    res.midBanner.src = st.midBanner.src || res.midBanner.src;
    res.midBanner.link = st.midBanner.link || res.midBanner.link;
  }
  if(st.sidebarBanner){
    res.sidebarBanner.src = st.sidebarBanner.src || res.sidebarBanner.src;
    res.sidebarBanner.link = st.sidebarBanner.link || res.sidebarBanner.link;
  }
  // логотип и иконка
  if(st.logo && st.logo.src){ res.logo.src = st.logo.src; }
  if(st.favicon && st.favicon.src){ res.favicon.src = st.favicon.src; }
  // уведомление
  if(st.notification && typeof st.notification.text === 'string'){ res.notification.text = st.notification.text; }
  return res;
}
function saveSettings(s){ write(SETTINGS_KEY, s); }

// Применить настройки к странице
function applySettings(){
  const st = getSettings();
  // Палитра: если не заданы в настройках, берем из CSS root
  const rootStyles = getComputedStyle(document.documentElement);
  const accent = st.palette.accent || rootStyles.getPropertyValue('--accent').trim();
  const accentDark = st.palette.accentDark || rootStyles.getPropertyValue('--accent-dark').trim();
  const accent2 = st.palette.accent2 || rootStyles.getPropertyValue('--accent-2').trim();
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-dark', accentDark);
  document.documentElement.style.setProperty('--accent-2', accent2);
  // Обновить кольцо для фокуса
  document.documentElement.style.setProperty('--ring', accent2);
  document.documentElement.style.setProperty('--ring-soft', `rgba(${hexToRgb(accent2)},.25)`);
  // Баннеры в шапке: обновляем все .banner-slot, циклично распределяя слоты
  const banners = st.banners && st.banners.slots ? st.banners.slots : [];
  const bannerEls = document.querySelectorAll('.banner-slot');
  bannerEls.forEach((slotEl, idx) => {
    const slot = banners[idx % banners.length] || {};
    if(slot.src){
      const linkStart = slot.link ? `<a href="${escapeHTML(slot.link)}" target="_blank" rel="noopener">` : '';
      const linkEnd = slot.link ? '</a>' : '';
      slotEl.innerHTML = `${linkStart}<img src="${escapeHTML(slot.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:10px">${linkEnd}`;
    } else {
      // если изображение не задано, оставляем текст или убираем содержимое
      // ничего не делаем, placeholder задаётся в HTML
    }
  });

  // Баннер после поиска (mid-banner). Может быть несколько баннеров на разных страницах.
  const midEls = document.querySelectorAll('.mid-banner');
  midEls.forEach(midEl => {
    if(st.midBanner && st.midBanner.src){
      const linkStart = st.midBanner.link ? `<a href="${escapeHTML(st.midBanner.link)}" target="_blank" rel="noopener">` : '';
      const linkEnd = st.midBanner.link ? '</a>' : '';
      midEl.innerHTML = `${linkStart}<img src="${escapeHTML(st.midBanner.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:10px">${linkEnd}`;
    } else {
      // Устанавливаем текст placeholder, если изображение не задано
      midEl.textContent = 'Здесь может быть ваша реклама — 1168x120';
    }
  });
  // Баннер в боковой панели
  const sbEl = document.getElementById('sidebar-banner');
  if(sbEl){
    if(st.sidebarBanner && st.sidebarBanner.src){
      const linkStart = st.sidebarBanner.link ? `<a href="${escapeHTML(st.sidebarBanner.link)}" target="_blank" rel="noopener">` : '';
      const linkEnd = st.sidebarBanner.link ? '</a>' : '';
      sbEl.innerHTML = `${linkStart}<img src="${escapeHTML(st.sidebarBanner.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:10px">${linkEnd}`;
    } else {
      sbEl.textContent = 'Здесь может быть ваша реклама — 280x120';
    }
  }
  // Бегущая строка: обновляем все тикеры на странице
  const tickerTracks = document.querySelectorAll('.ticker-track');
  tickerTracks.forEach(track => {
    const items = Array.isArray(st.ticker.items) ? st.ticker.items : DEFAULT_SETTINGS.ticker.items;
    track.innerHTML = '';
    items.forEach(it => { const span = document.createElement('span'); span.textContent = it; track.appendChild(span); });
    // дублируем для бесконечной ленты
    items.forEach(it => { const span = document.createElement('span'); span.textContent = it; track.appendChild(span); });
    track.style.setProperty('--t', st.ticker.speed + 's');
  });
  // Гарантия
  const gTitleEl = document.querySelector('.guarantee h3');
  const gSubEl = document.querySelector('.guarantee p.muted');
  if(gTitleEl) gTitleEl.textContent = st.guarantee.title;
  if(gSubEl) gSubEl.textContent = st.guarantee.subtitle;

  // Кнопка «Подробнее» в секции гарантий: текст и ссылка из настроек
  const gBtns = document.querySelectorAll('.guarantee .guarantee-btn');
  gBtns.forEach(btn => {
    const text = (st.guaranteeButton && st.guaranteeButton.text) ? st.guaranteeButton.text : DEFAULT_SETTINGS.guaranteeButton.text;
    const link = (st.guaranteeButton && st.guaranteeButton.link) ? st.guaranteeButton.link : DEFAULT_SETTINGS.guaranteeButton.link;
    btn.textContent = text;
    if(link){ btn.setAttribute('href', link); }
    else { btn.removeAttribute('href'); }
  });
  // Заполняем поля формы настройки текста и ссылки кнопки гарантий
  const gBtnTextInput = document.getElementById('guarantee-btn-text');
  const gBtnLinkInput = document.getElementById('guarantee-btn-link');
  if(gBtnTextInput) gBtnTextInput.value = (st.guaranteeButton && st.guaranteeButton.text) ? st.guaranteeButton.text : DEFAULT_SETTINGS.guaranteeButton.text;
  if(gBtnLinkInput) gBtnLinkInput.value = (st.guaranteeButton && st.guaranteeButton.link) ? st.guaranteeButton.link : DEFAULT_SETTINGS.guaranteeButton.link;

  // Логотип и иконка: обновляем изображение в шапке и favicon
  const logoImgEl = document.querySelector('.logo img');
  if(logoImgEl){
    if(st.logo && st.logo.src){ logoImgEl.src = st.logo.src; }
    else { logoImgEl.src = 'logo.svg'; }
  }
  const faviconEl = document.getElementById('favicon-tag');
  if(faviconEl){
    if(st.favicon && st.favicon.src){ faviconEl.href = st.favicon.src; }
    else { faviconEl.href = 'logo.svg'; }
  }
  // Уведомление: обновляем текст в каждом уведомлении на странице
  const notifText = st.notification && typeof st.notification.text === 'string' && st.notification.text.trim() ? st.notification.text : DEFAULT_SETTINGS.notification.text;
  document.querySelectorAll('.notification span').forEach(sp=>{ sp.textContent = notifText; });
  // Заполнить формы настроек (если существуют)
  const fileInputs = [document.getElementById('banner-file-1'), document.getElementById('banner-file-2')];
  const urlInputs = [document.getElementById('banner-url-1'), document.getElementById('banner-url-2')];
  const linkInputs = [document.getElementById('banner-link-1'), document.getElementById('banner-link-2')];
  const previewEls = [document.getElementById('banner-preview-1'), document.getElementById('banner-preview-2')];
  for(let i=0;i<2;i++){
    const slot = banners[i]||{};
    if(urlInputs[i]) urlInputs[i].value = slot.src && !slot.src.startsWith('data:')? slot.src: '';
    if(linkInputs[i]) linkInputs[i].value = slot.link || '';
    if(previewEls[i]){
      if(slot.src){ previewEls[i].innerHTML = `<img src="${escapeHTML(slot.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:6px">`; }
      else{ previewEls[i].innerHTML=''; }
    }
  }

  // заполняем поля баннера после поиска
  const midUrlInput = document.getElementById('mid-banner-url');
  const midLinkInput = document.getElementById('mid-banner-link');
  const midPrev = document.getElementById('mid-banner-preview');
  if(midUrlInput) midUrlInput.value = st.midBanner && st.midBanner.src && !st.midBanner.src.startsWith('data:') ? st.midBanner.src : '';
  if(midLinkInput) midLinkInput.value = st.midBanner && st.midBanner.link ? st.midBanner.link : '';
  if(midPrev){
    if(st.midBanner && st.midBanner.src){ midPrev.innerHTML = `<img src="${escapeHTML(st.midBanner.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:6px">`; }
    else{ midPrev.innerHTML = ''; }
  }
  // заполняем поля баннера в боковой панели
  const sbUrlInput = document.getElementById('sidebar-banner-url');
  const sbLinkInput = document.getElementById('sidebar-banner-link');
  const sbPrev = document.getElementById('sidebar-banner-preview');
  if(sbUrlInput) sbUrlInput.value = st.sidebarBanner && st.sidebarBanner.src && !st.sidebarBanner.src.startsWith('data:') ? st.sidebarBanner.src : '';
  if(sbLinkInput) sbLinkInput.value = st.sidebarBanner && st.sidebarBanner.link ? st.sidebarBanner.link : '';
  if(sbPrev){
    if(st.sidebarBanner && st.sidebarBanner.src){ sbPrev.innerHTML = `<img src="${escapeHTML(st.sidebarBanner.src)}" alt="баннер" style="max-width:100%;height:auto;border-radius:6px">`; }
    else{ sbPrev.innerHTML = ''; }
  }
  // логотип и иконка: заполняем поля формы
  const logoUrlInput = document.getElementById('logo-url');
  const logoPrev = document.getElementById('logo-preview');
  if(logoUrlInput) logoUrlInput.value = (st.logo && st.logo.src && !st.logo.src.startsWith('data:')) ? st.logo.src : '';
  if(logoPrev){
    if(st.logo && st.logo.src){ logoPrev.innerHTML = `<img src="${escapeHTML(st.logo.src)}" alt="логотип" style="max-width:100%;height:auto;border-radius:6px">`; }
    else { logoPrev.innerHTML = ''; }
  }
  const favUrlInput = document.getElementById('favicon-url');
  const favPrev = document.getElementById('favicon-preview');
  if(favUrlInput) favUrlInput.value = (st.favicon && st.favicon.src && !st.favicon.src.startsWith('data:')) ? st.favicon.src : '';
  if(favPrev){
    if(st.favicon && st.favicon.src){ favPrev.innerHTML = `<img src="${escapeHTML(st.favicon.src)}" alt="иконка" style="max-width:100%;height:auto;border-radius:6px">`; }
    else { favPrev.innerHTML = ''; }
  }
  // уведомление: заполняем поле текста
  const notifInput = document.getElementById('notification-text');
  if(notifInput) notifInput.value = st.notification && typeof st.notification.text === 'string' ? st.notification.text : DEFAULT_SETTINGS.notification.text;
  // бегущая строка формы
  const tickerItemsInput = document.getElementById('ticker-items');
  const tickerSpeedInput = document.getElementById('ticker-speed');
  if(tickerItemsInput) tickerItemsInput.value = (st.ticker.items||[]).join('\n');
  if(tickerSpeedInput) tickerSpeedInput.value = st.ticker.speed;
  // палитра формы
  const palAccent = document.getElementById('palette-accent');
  const palDark = document.getElementById('palette-accent-dark');
  const pal2 = document.getElementById('palette-accent2');
  if(palAccent) palAccent.value = toHex(accent);
  if(palDark) palDark.value = toHex(accentDark);
  if(pal2) pal2.value = toHex(accent2);
  // гарантия формы
  const gTitleInput = document.getElementById('guarantee-title');
  const gSubtitleInput = document.getElementById('guarantee-subtitle');
  if(gTitleInput) gTitleInput.value = st.guarantee.title;
  if(gSubtitleInput) gSubtitleInput.value = st.guarantee.subtitle;
  // После применения всех настроек обновляем язык интерфейса
  applyLanguage(st.language || 'ru');
}

// Вспомогательные функции: преобразование HEX в RGB и обратно
function hexToRgb(hex){
  hex = hex.replace('#','');
  if(hex.length===3){ hex = hex.split('').map(c=>c+c).join(''); }
  const num = parseInt(hex,16);
  return `${(num>>16)&255},${(num>>8)&255},${num&255}`;
}
function toHex(col){
  col = col.trim();
  if(col.startsWith('#')) return col;
  const m = col.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if(m){ const r=Number(m[1]); const g=Number(m[2]); const b=Number(m[3]); const h=x=>x.toString(16).padStart(2,'0'); return `#${h(r)}${h(g)}${h(b)}`; }
  return col;
}

// Первичное заполнение данных для примера, включая дату создания и флаг блокировки
(function seed(){
  const now = new Date().toISOString();
  const usersSeed = [
    {u:'admin',p:'admin',role:'admin',created: now},
    {u:'user',p:'user',role:'user',created: now}
  ];
  const sellersSeed = [
    {id:1,name:'WebDesignPro',nick:'admin',desc:'Создаю современные и адаптивные сайты. Опыт более 5 лет.',cat:'design',status:'verified',flags:{verified:true,escrow:true,rating4:true},avatar:'',deposits:'фриланс: 5 лет',deals:42,tg:'@webdesignpro',forums:[{title:'Behance',url:'https://behance.net/user1'},{title:'Dribbble',url:'https://dribbble.com/user1'}],created: now,blocked:false,pending:false},
    {id:2,name:'CodeMaster',nick:'user',desc:'Разработка веб‑приложений под ключ. Node.js, Python.',cat:'programming',status:'seller',flags:{verified:true,escrow:false,rating4:true},avatar:'',deposits:'студия: 3 года',deals:15,tg:'@codemaster',forums:[{title:'GitHub',url:'https://github.com/user2'}],created: now,blocked:false,pending:false},
    {id:3,name:'MarketGuru',nick:'user',desc:'Помогаю компаниям расти с помощью эффективного маркетинга.',cat:'marketing',status:'unverified',flags:{verified:false,escrow:false,rating4:false},avatar:'',deposits:'—',deals:0,tg:'@marketguru',forums:[],created: now,blocked:false,pending:false},
    {id:4,name:'SEOExpert',nick:'admin',desc:'Оптимизация сайтов для поисковых систем. Аналитика трафика.',cat:'seo',status:'recruiter',flags:{verified:true,escrow:false,rating4:true},avatar:'',deposits:'агентство: 4 года',deals:7,tg:'@seoexpert',forums:[{title:'Portfolio',url:'https://portfolio.example/seoexpert'}],created: now,blocked:false,pending:false}
  ];
  const existingUsers = read(LS.users);
  if(!Array.isArray(existingUsers) || existingUsers.length===0) write(LS.users, usersSeed);
  const existingSellers = read(LS.sellers);
  if(!Array.isArray(existingSellers) || existingSellers.length===0) write(LS.sellers, sellersSeed);
})();

const authBox = document.getElementById('auth-box');
const userBox = document.getElementById('user-box');
const uName = document.getElementById('u-name');
const navAdmin = document.getElementById('nav-admin');

function getSession(){ return read(LS.session,null); }
function setSession(s){ if(s) write(LS.session,s); else localStorage.removeItem(LS.session); syncAuth(); }

function syncAuth(){
  const s = getSession();
  if(s){
    authBox.classList.add('hidden');
    userBox.classList.remove('hidden');
    uName.textContent = s.u + (s.role==='admin'? ' (admin)':'' );
    navAdmin.hidden = s.role!=='admin';
    const navProfile = document.getElementById('nav-profile');
    if(navProfile) navProfile.style.display = '';
    // Показываем фильтр «Избранные» только для авторизованных пользователей
    const favFilter = document.querySelector('#flt .fav-filter');
    if(favFilter) favFilter.style.display = '';
  }
  else {
    userBox.classList.add('hidden');
    authBox.classList.remove('hidden');
    navAdmin.hidden = true;
    const navProfile = document.getElementById('nav-profile');
    if(navProfile) navProfile.style.display = 'none';
    // Скрываем фильтр «Избранные» для неавторизованных пользователей
    const favFilter = document.querySelector('#flt .fav-filter');
    if(favFilter) favFilter.style.display = 'none';
  }
}
syncAuth();

const cardsWrap = document.getElementById('cards');
const emptyHint = document.getElementById('empty');
let currentFilter = {status:'all',cat:'all'};

function escapeHTML(s){ return (s+'').replace(/[&<>"]+/g, m=>({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[m])); }

function cardHTML(s){
  // Показать закреп: определяем, закреплена ли карточка в данный момент
  const now = Date.now();
  const pinnedActive = s.pinnedUntil && new Date(s.pinnedUntil).getTime() > now;
  // Формируем аватар; если закреплена, выводим зелёную галочку поверх
  let avaInner;
  if(s.avatar){
    avaInner = `<img src="${escapeHTML(s.avatar)}" alt="">`;
  } else {
    avaInner = escapeHTML((s.name || '?')[0] || '?');
  }
  // Для закреплённых карточек отображаем значок галочки внутри звезды
  const badge = pinnedActive ? `<span class="pinned-badge" title="Закреп на правах рекламы"><img src="assets/pinned-check.svg" alt="закреп" style="width:16px;height:16px"></span>` : '';
  const ava = `<div class="avatar">${avaInner}${badge}</div>`;
  // Иконка закрепа отображается сверху карточки, если закреп активен
  const pinIcon = pinnedActive ? `<span class="pin-icon" title="Закреп на правах рекламы">📌</span>` : '';
  // Иконка избранного: отображаем звёздочку. При клике переключает состояние избранного для текущего пользователя.
  let favIcon = '';
  const favs = getFavorites();
  const isFav = favs.includes(s.id);
  // Показываем иконку избранного только если пользователь авторизован
  if(getSession()){
    favIcon = `<span class="fav-icon${isFav? ' fav-active' : ''}" data-fav-id="${s.id}" title="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}">${isFav ? '★' : '☆'}</span>`;
  }
  // Кнопка для связи в Telegram
  const tgBtn = s.tg ? `<a class="btn btn-primary btn-tg" href="https://t.me/${escapeHTML(s.tg.replace(/^@/,''))}" target="_blank" rel="noopener" data-stop="1">Написать</a>` : '';
  // Рейтинг и количество отзывов
  const avg = avgRating(s);
  const reviewsCount = Array.isArray(s.reviews) ? s.reviews.length : 0;
  const ratingDisplay = reviewsCount ? `<span class="rating">★ ${avg.toFixed(1)} (${reviewsCount})</span>` : '';
  return `<article class="card${pinnedActive?' pinned':''}" data-profile="${s.id}">
      ${pinIcon}${favIcon}
      <div class="card-head" style="display:flex;align-items:center;gap:12px;justify-content:space-between">
        ${ava}
        <div class="card-main" style="min-width:0;flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="font-weight:800">${escapeHTML(s.name)}</div>
            <span class="chip status-${escapeHTML(s.status)}">${escapeHTML(statusLabel(s.status))}</span>
          </div>
          <div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${escapeHTML(s.desc || '')}</div>
          ${ratingDisplay ? `<div style="margin-top:4px">${ratingDisplay}</div>` : ''}
        </div>
        ${tgBtn}
      </div>
    </article>`;
}

function renderCards(){
  let list = read(LS.sellers,[]).filter(s=>{
    // не отображаем заблокированных или находящихся на модерации исполнителей
    if(s.blocked) return false;
    if(s.pending) return false;
    // Поддерживаем специальный фильтр "favorite" — показываем только избранные карточки
    let statusOk;
    if(currentFilter.status === 'favorite'){
      const favs = getFavorites();
      statusOk = favs.includes(s.id);
    } else {
      statusOk = currentFilter.status==='all' || s.status===currentFilter.status;
    }
    const catOk = currentFilter.cat==='all' || s.cat===currentFilter.cat;
    // Фильтрация по текстовому поисковому запросу
    let searchOk = true;
    if(searchQuery && searchQuery.length){
      const q = searchQuery.toLowerCase();
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const descMatch = (s.desc || '').toLowerCase().includes(q);
      const catMatch = catLabel(s.cat).toLowerCase().includes(q);
      const tgMatch = (s.tg || '').toLowerCase().includes(q);
      const depoMatch = (s.deposits || '').toLowerCase().includes(q);
      const forumsMatch = Array.isArray(s.forums) ? s.forums.some(it => ((it.title||'').toLowerCase().includes(q)) || ((it.url||'').toLowerCase().includes(q))) : false;
      searchOk = nameMatch || descMatch || catMatch || tgMatch || depoMatch || forumsMatch;
    }
    return statusOk && catOk && searchOk;
  });
  // Сортировка: закрепленные карточки (с неистёкшим pinnedUntil) первыми, затем по дате создания (новые сверху)
  const now = Date.now();
  list = list.sort((a,b)=>{
    const ap = a.pinnedUntil && new Date(a.pinnedUntil).getTime() > now ? 1 : 0;
    const bp = b.pinnedUntil && new Date(b.pinnedUntil).getTime() > now ? 1 : 0;
    if(bp !== ap) return bp - ap;
    const da = a.created ? new Date(a.created).getTime() : 0;
    const db = b.created ? new Date(b.created).getTime() : 0;
    return db - da;
  });
  cardsWrap.innerHTML = list.map(cardHTML).join('');
  emptyHint.classList.toggle('hidden', list.length>0);
}
renderCards();

document.querySelectorAll('.toggle').forEach(btn=>{
  btn.addEventListener('click',()=>{ const target = document.querySelector(btn.dataset.toggle); if(!target) return; target.hidden = !target.hidden; btn.textContent = target.hidden? 'Показать':'Скрыть'; });
});
document.querySelectorAll('#flt li').forEach(li=>{
  li.addEventListener('click',()=>{ document.querySelectorAll('#flt li').forEach(x=>x.classList.remove('active')); li.classList.add('active'); currentFilter.status = li.dataset.status; renderCards(); });
});
document.querySelectorAll('#cats li').forEach(li=>{
  li.addEventListener('click',()=>{ document.querySelectorAll('#cats li').forEach(x=>x.classList.remove('active')); li.classList.add('active'); currentFilter.cat = li.dataset.cat; renderCards(); });
});

// Обработчик клика по иконке избранного на карточке. Используем делегирование события.
document.addEventListener('click', (e)=>{
  const favEl = e.target.closest('.fav-icon');
  if(favEl){
    e.stopPropagation();
    const id = parseInt(favEl.getAttribute('data-fav-id'), 10);
    if(isNaN(id)) return;
    let favs = getFavorites();
    if(favs.includes(id)){
      favs = favs.filter(x => x !== id);
    } else {
      favs = favs.concat([id]);
    }
    setFavorites(favs);
    // при переключении избранного перерисовываем список и не меняем активную карточку
    renderCards();
  }
});

const cardModal = document.getElementById('card-modal');
function openModal(m){ m.classList.add('open'); }
function closeModal(m){ m.classList.remove('open'); }
document.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click',e=> closeModal(e.target.closest('.modal'))));
function id(x){ return document.getElementById(x); }

// Текущее состояние редактирования карточки (null означает новая)
let currentEditingId = null;

document.getElementById('btn-add-card').addEventListener('click',()=>{
  if(!getSession()) return openAuth('login');
  currentEditingId = null;
  id('c-nick').value = getSession().u;
  id('c-ava-file').value = '';
  id('c-ava-url').value='';
  id('c-ava-preview').innerHTML='?';
  delete id('c-ava-preview').dataset.src;
  const list = id('c-forums-list');
  if(list){ list.innerHTML=''; addForumRow(); }
  const ct = document.getElementById('card-title'); if(ct) ct.textContent = 'Новая карточка';
  openModal(cardModal);
});

function fileToDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file); }); }
id('c-ava-file').addEventListener('change', async (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const url = await fileToDataURL(f); const prev = id('c-ava-preview'); prev.innerHTML = `<img src="${url}" alt="">`; id('c-ava-url').value=''; prev.dataset.src=url; });
id('c-ava-url').addEventListener('input',()=>{ const v=id('c-ava-url').value.trim(); const prev=id('c-ava-preview'); if(v){ prev.innerHTML = `<img src="${v}" alt="">`; prev.dataset.src=v; }else{ prev.innerHTML='?'; delete prev.dataset.src; } });

function normalizeURL(u){ u=(u||'').trim(); if(!u) return ''; try{ const url=new URL(u, window.location.origin); if(url.protocol==='http:'||url.protocol==='https:') return url.href; return ''; }catch(e){ try{ const url=new URL('https://'+u); return url.href; }catch(_){ return ''; } } }
function addForumRow(title='', url=''){
  const list = id('c-forums-list'); if(!list) return;
  const row = document.createElement('div'); row.className='forum-row';
  row.innerHTML = `
      <input class="field forum-title" placeholder="Название ресурса" value="${escapeHTML(title)}" />
      <input class="field forum-url" placeholder="https://ссылка-на-портфолио" value="${escapeHTML(url)}" />
      <button class="btn rm" type="button">✕</button>`;
  row.querySelector('.rm').addEventListener('click',()=>{ row.remove(); });
  list.appendChild(row);
}
function collectForums(){
  const list = id('c-forums-list'); if(!list) return [];
  const rows = Array.from(list.querySelectorAll('.forum-row'));
  return rows.map(r=>{
    const t = (r.querySelector('.forum-title')?.value||'').trim();
    const u = normalizeURL(r.querySelector('.forum-url')?.value||'');
    return {title:t, url:u};
  }).filter(it=> it.title && it.url);
}
const btnForumAdd = document.getElementById('forum-add'); if(btnForumAdd) btnForumAdd.addEventListener('click',()=> addForumRow());

id('c-save').addEventListener('click',()=>{
  const s = getSession(); if(!s) return;
  const name = (id('c-nick').value || s.u).trim();
  const desc = id('c-desc').value.trim();
  const cat = id('c-cat').value;
  const avatar = id('c-ava-preview').dataset.src||'';
  const deposits = id('c-deposits').value.trim();
  const deals = Math.max(0, parseInt(id('c-deals').value||'0',10))||0;
  const tg = id('c-tg').value.trim();
  const forums = collectForums();
  const arr = read(LS.sellers,[]);
  if(currentEditingId){
    const item = arr.find(x=> x.id===currentEditingId);
    if(item){
      item.name = name;
      item.desc = desc;
      item.cat = cat;
      item.avatar = avatar;
      item.deposits = deposits;
      item.deals = deals;
      item.tg = tg;
      item.forums = forums;
      // при редактировании отправляем на модерацию
      item.pending = true;
      write(LS.sellers,arr);
    }
    currentEditingId = null;
  } else {
    const idnew = (arr.reduce((m,x)=>Math.max(m,x.id),0)||0)+1;
    const status = 'unverified';
    const flags = {verified:false, escrow:false, rating4:false};
    // новая карточка автоматически помечается как ожидающая модерации
    arr.push({id:idnew,name,nick:s.u,desc,cat,status,flags,avatar,deposits,deals,tg,forums,created:new Date().toISOString(),blocked:false,pending:true});
    write(LS.sellers,arr);
  }
  closeModal(cardModal);
  ['c-desc','c-ava-url','c-deposits','c-deals','c-tg'].forEach(k=>{ const el=id(k); if(!el) return; if(el.type==='checkbox') el.checked=false; else el.value=''; });
  id('c-cat').value='design'; id('c-ava-preview').innerHTML='?'; delete id('c-ava-preview').dataset.src; const lst=id('c-forums-list'); if(lst) lst.innerHTML='';
  renderCards();
  if(document.getElementById('admin-modal').classList.contains('open')) fillAdminTables();
});

const authModal = id('auth-modal');
const tabsAuth = document.querySelectorAll('[data-auth-tab]');
tabsAuth.forEach(t=> t.addEventListener('click',()=>{ tabsAuth.forEach(x=>x.classList.remove('active')); t.classList.add('active'); id('form-login').classList.toggle('hidden', t.dataset.authTab!=='login'); id('form-register').classList.toggle('hidden', t.dataset.authTab!=='register'); id('auth-title').textContent = t.dataset.authTab==='login'? 'Вход':'Регистрация'; }));

document.getElementById('btn-login').addEventListener('click',()=> openAuth('login'));
document.getElementById('btn-register').addEventListener('click',()=> openAuth('register'));
function openAuth(mode){ const to = mode==='register'? 'register':'login'; tabsAuth.forEach(t=> t.classList.toggle('active', t.dataset.authTab===to)); id('form-login').classList.toggle('hidden', to!=='login'); id('form-register').classList.toggle('hidden', to!=='register'); id('auth-title').textContent = to==='login'? 'Вход':'Регистрация'; openModal(authModal); }

document.getElementById('do-register').addEventListener('click',()=>{
  const u = id('rg-user').value.trim();
  const p = id('rg-pass').value;
  const err = id('rg-err');
  err.textContent='';
  if(!u || !p){ err.textContent='Заполните логин и пароль'; return; }
  const users = read(LS.users,[]);
  if(users.some(x=>x.u===u)){ err.textContent='Пользователь уже существует'; return; }
  const role='user';
  users.push({u,p,role,created:new Date().toISOString()});
  write(LS.users,users);
  setSession({u,role});
  closeModal(authModal);
  syncAuth();
});
document.getElementById('do-login').addEventListener('click',()=>{
  const u = id('li-user').value.trim();
  const p = id('li-pass').value;
  const err = id('li-err');
  err.textContent='';
  const users = read(LS.users,[]);
  const found = users.find(x=>x.u===u && x.p===p);
  if(!found){ err.textContent='Неверные логин или пароль'; return; }
  setSession({u:found.u,role:found.role});
  closeModal(authModal);
});
document.getElementById('btn-logout').addEventListener('click',()=>{ setSession(null); });

const adminModal = id('admin-modal');
document.getElementById('nav-admin').addEventListener('click', (e)=>{
  e.preventDefault(); if(getSession()?.role!=='admin') return alert('Недостаточно прав'); openModal(adminModal); fillAdminTables(); });
const adminTabs = document.querySelectorAll('[data-admin-tab]');
adminTabs.forEach(t=> t.addEventListener('click',()=>{
  adminTabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  const tab = t.dataset.adminTab;
  id('admin-sellers').classList.toggle('hidden', tab!=='sellers');
  id('admin-users').classList.toggle('hidden', tab!=='users');
  id('admin-settings').classList.toggle('hidden', tab!=='settings');
  if(tab==='sellers'){ fillAdminSellers(); }
  if(tab==='users'){ fillAdminUsers(); }
  if(tab==='settings'){ fillAdminSettings(); }
}));

// Глобальные переменные для фильтров и выбора исполнителей
let sellerFilter = {nick:'', tg:'', cat:'all', status:'all'};
let sellerSelection = new Set();

// Открыть модальное окно для редактирования существующего исполнителя
function openEditSeller(idd){
  const arr = read(LS.sellers, []);
  const item = arr.find(x => x.id === idd);
  if(!item) return;
  currentEditingId = item.id;
  const titleEl = document.getElementById('card-title');
  if(titleEl) titleEl.textContent = 'Редактировать карточку';
  const nickInput = document.getElementById('c-nick');
  if(nickInput){ nickInput.value = item.name || ''; }
  const descInput = document.getElementById('c-desc');
  if(descInput){ descInput.value = item.desc || ''; }
  const catSelect = document.getElementById('c-cat');
  if(catSelect){ catSelect.value = item.cat || 'design'; }
  const avaPrev = document.getElementById('c-ava-preview');
  if(avaPrev){ if(item.avatar){ avaPrev.innerHTML = `<img src="${escapeHTML(item.avatar)}" alt="">`; avaPrev.dataset.src = item.avatar; } else { avaPrev.innerHTML = '?'; delete avaPrev.dataset.src; } }
  const avaFile = document.getElementById('c-ava-file'); if(avaFile) avaFile.value = '';
  const avaUrl = document.getElementById('c-ava-url'); if(avaUrl) avaUrl.value = '';
  const depInput = document.getElementById('c-deposits'); if(depInput) depInput.value = item.deposits || '';
  const dealsInput = document.getElementById('c-deals'); if(dealsInput) dealsInput.value = Number(item.deals || 0);
  const tgInput = document.getElementById('c-tg'); if(tgInput) tgInput.value = item.tg || '';
  const forumsList = document.getElementById('c-forums-list'); if(forumsList){ forumsList.innerHTML = ''; (Array.isArray(item.forums)? item.forums: []).forEach(f => addForumRow(f.title, f.url)); }
  openModal(cardModal);
}

function fillAdminTables(){
  fillAdminSellers();
  fillAdminUsers();
  fillAdminSettings();
}

function fillAdminSellers(){
  const all = read(LS.sellers,[]);
  const filtWrap = document.getElementById('seller-filters');
  if(filtWrap && !filtWrap.dataset.init){
    filtWrap.dataset.init='1';
    const filtTitle = document.createElement('div');
    filtTitle.textContent = 'Фильтры';
    filtTitle.style.fontWeight = '700';
    filtTitle.style.marginRight = '12px';
    filtTitle.style.alignSelf = 'center';
    filtWrap.appendChild(filtTitle);
    const nickInput = document.createElement('input'); nickInput.className='field'; nickInput.placeholder='Поиск по имени/никту'; nickInput.style.minWidth='160px';
    nickInput.addEventListener('input',()=>{ sellerFilter.nick = nickInput.value.trim(); fillAdminSellers(); });
    filtWrap.appendChild(nickInput);
    const tgInput = document.createElement('input'); tgInput.className='field'; tgInput.placeholder='Поиск по TG'; tgInput.style.minWidth='140px'; tgInput.addEventListener('input',()=>{ sellerFilter.tg = tgInput.value.trim(); fillAdminSellers(); });
    filtWrap.appendChild(tgInput);
    const catSel = document.createElement('select'); catSel.className='select';
    {
      const cats = getCategories();
      catSel.innerHTML = `<option value="all">Все категории</option>` + cats.map(c=>`<option value="${escapeHTML(c.key)}">${escapeHTML(c.label)}</option>`).join('');
    }
    catSel.addEventListener('change',()=>{ sellerFilter.cat = catSel.value; fillAdminSellers(); });
    filtWrap.appendChild(catSel);
    const statSel = document.createElement('select'); statSel.className='select';
    statSel.innerHTML = '<option value="all">Все статусы</option>' + ['verified','seller','recruiter','unverified','blocked'].map(st=>`<option value="${st}">${escapeHTML(statusLabel(st))}</option>`).join('');
    statSel.addEventListener('change',()=>{ sellerFilter.status = statSel.value; fillAdminSellers(); });
    filtWrap.appendChild(statSel);
  }
  const bulkWrap = document.getElementById('seller-bulk-actions');
  if(bulkWrap && !bulkWrap.dataset.init){
    bulkWrap.dataset.init='1';
    const bulkTitle = document.createElement('div');
    bulkTitle.textContent = 'Массовые действия';
    bulkTitle.style.fontWeight = '700';
    bulkTitle.style.marginRight = '12px';
    bulkTitle.style.alignSelf = 'center';
    bulkWrap.appendChild(bulkTitle);
    const bulkStatSel = document.createElement('select'); bulkStatSel.className='select';
    bulkStatSel.innerHTML = ['','verified','seller','recruiter','unverified','blocked'].map(st=>`<option value="${st}">${st? escapeHTML(statusLabel(st)):'— изменить статус —'}</option>`).join('');
    const bulkStatBtn = document.createElement('button'); bulkStatBtn.className='btn'; bulkStatBtn.textContent='Применить статус';
    bulkStatBtn.addEventListener('click',()=>{
      const val = bulkStatSel.value;
      if(!val) return;
      const arr = read(LS.sellers,[]);
      arr.forEach(item=>{ if(sellerSelection.has(item.id)) item.status = val; });
      write(LS.sellers,arr);
      sellerSelection.clear();
      document.getElementById('sel-all-sellers').checked=false;
      fillAdminSellers(); renderCards();
    });
    bulkWrap.appendChild(bulkStatSel);
    bulkWrap.appendChild(bulkStatBtn);
    const bulkCatSel = document.createElement('select'); bulkCatSel.className='select';
    {
      const cats = getCategories();
      bulkCatSel.innerHTML = `<option value="">— изменить категорию —</option>` + cats.map(c=>`<option value="${escapeHTML(c.key)}">${escapeHTML(c.label)}</option>`).join('');
    }
    const bulkCatBtn = document.createElement('button'); bulkCatBtn.className='btn'; bulkCatBtn.textContent='Применить категорию';
    bulkCatBtn.addEventListener('click',()=>{
      const val = bulkCatSel.value;
      if(!val) return;
      const arr = read(LS.sellers,[]);
      arr.forEach(item=>{ if(sellerSelection.has(item.id)) item.cat = val; });
      write(LS.sellers,arr);
      sellerSelection.clear();
      document.getElementById('sel-all-sellers').checked=false;
      fillAdminSellers(); renderCards();
    });
    bulkWrap.appendChild(bulkCatSel);
    bulkWrap.appendChild(bulkCatBtn);
    const bulkDelBtn = document.createElement('button'); bulkDelBtn.className='btn btn-danger'; bulkDelBtn.textContent='Удалить выбранные';
    bulkDelBtn.addEventListener('click',()=>{
      if(sellerSelection.size===0) return;
      let arr = read(LS.sellers,[]);
      arr = arr.filter(item=> !sellerSelection.has(item.id));
      write(LS.sellers,arr);
      sellerSelection.clear();
      document.getElementById('sel-all-sellers').checked=false;
      fillAdminSellers(); renderCards();
    });
    bulkWrap.appendChild(bulkDelBtn);
  }
  // Фильтрация
  let list = all;
  if(sellerFilter.nick){
    const q = sellerFilter.nick.toLowerCase();
    list = list.filter(it=> (it.name && it.name.toLowerCase().includes(q)) || (it.nick && it.nick.toLowerCase().includes(q)));
  }
  if(sellerFilter.tg){
    const q = sellerFilter.tg.toLowerCase();
    list = list.filter(it=> it.tg && it.tg.toLowerCase().includes(q));
  }
  if(sellerFilter.cat !== 'all'){
    list = list.filter(it=> it.cat === sellerFilter.cat);
  }
  if(sellerFilter.status !== 'all'){
    if(sellerFilter.status === 'blocked') list = list.filter(it=> it.blocked);
    else list = list.filter(it=> it.status === sellerFilter.status && !it.blocked);
  }
  const tbody = document.querySelector('#tbl-sellers tbody');
  tbody.innerHTML = list.map(item=>{
    const created = item.created? new Date(item.created).toLocaleDateString() : '';
    const statusOptions = ['verified','seller','recruiter','unverified','blocked'].map(st=>{
      const sel = item.status===st? 'selected':'';
      return `<option value="${st}" ${sel}>${escapeHTML(statusLabel(st))}</option>`;
    }).join('');
    return `<tr>
        <td><input type="checkbox" class="sel-chk" data-seller="${item.id}" ${sellerSelection.has(item.id)?'checked':''}></td>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(catLabel(item.cat))}</td>
        <td><select class="select sel-status" data-seller="${item.id}">${statusOptions}</select></td>
        <td>${escapeHTML(item.tg||'—')}</td>
        <td>${Number(item.deals||0)}</td>
        <td>${escapeHTML(created)}</td>
        <td>
          <button class="btn" data-edit-seller="${item.id}">Редактировать</button>
          <button class="btn btn-danger" data-del-seller="${item.id}">Удалить</button>
          <button class="btn" data-block-seller="${item.id}">${item.blocked? 'Разблокировать' : 'Блокировать'}</button>
          <button class="btn" data-pin-seller="${item.id}">${(item.pinnedUntil && new Date(item.pinnedUntil).getTime() > Date.now()) ? 'Снять закреп' : 'Закрепить'}</button>
          ${item.pending ? `<button class="btn" data-approve-seller="${item.id}">Одобрить</button>` : ''}
        </td>
      </tr>`;
  }).join('');
  tbody.querySelectorAll('.sel-chk').forEach(ch=> ch.addEventListener('change',()=>{
    const idd = +ch.getAttribute('data-seller');
    if(ch.checked) sellerSelection.add(idd); else sellerSelection.delete(idd);
    const allIds = Array.from(tbody.querySelectorAll('.sel-chk')).map(c=> +c.getAttribute('data-seller'));
    document.getElementById('sel-all-sellers').checked = allIds.length>0 && allIds.every(id=> sellerSelection.has(id));
  }));
  const selAll = document.getElementById('sel-all-sellers');
  if(selAll && !selAll.dataset.bound){
    selAll.dataset.bound='1';
    selAll.addEventListener('change',()=>{
      const check = selAll.checked;
      sellerSelection.clear();
      tbody.querySelectorAll('.sel-chk').forEach(chk=>{
        chk.checked = check;
        const idd = +chk.getAttribute('data-seller');
        if(check) sellerSelection.add(idd);
      });
    });
  }
  tbody.querySelectorAll('[data-del-seller]').forEach(btn=> btn.addEventListener('click',()=>{
    const idd = +btn.getAttribute('data-del-seller');
    let arr = read(LS.sellers,[]);
    arr = arr.filter(x=> x.id!==idd);
    write(LS.sellers,arr);
    sellerSelection.delete(idd);
    fillAdminSellers(); renderCards();
  }));
  tbody.querySelectorAll('[data-block-seller]').forEach(btn=> btn.addEventListener('click',()=>{
    const idd = +btn.getAttribute('data-block-seller');
    const arr = read(LS.sellers,[]);
    const item = arr.find(x=> x.id===idd);
    if(item){ item.blocked = !item.blocked; write(LS.sellers,arr); }
    fillAdminSellers(); renderCards();
  }));
  // обработка закрепления/снятия закрепа
  tbody.querySelectorAll('[data-pin-seller]').forEach(btn=> btn.addEventListener('click',()=>{
    const idd = +btn.getAttribute('data-pin-seller');
    const arr = read(LS.sellers,[]);
    const item = arr.find(x=> x.id===idd);
    if(item){
      const now = Date.now();
      const active = item.pinnedUntil && new Date(item.pinnedUntil).getTime() > now;
      if(active){ delete item.pinnedUntil; }
      else { item.pinnedUntil = new Date(now + 30*24*60*60*1000).toISOString(); }
      write(LS.sellers,arr);
    }
    fillAdminSellers(); renderCards();
  }));
  // одобрение модерации
  tbody.querySelectorAll('[data-approve-seller]').forEach(btn=> btn.addEventListener('click',()=>{
    const idd = +btn.getAttribute('data-approve-seller');
    const arr = read(LS.sellers,[]);
    const item = arr.find(x=> x.id===idd);
    if(item){ item.pending = false; write(LS.sellers,arr); }
    fillAdminSellers(); renderCards();
  }));
  tbody.querySelectorAll('.sel-status').forEach(sel=> sel.addEventListener('change',()=>{
    const idd = +sel.getAttribute('data-seller');
    const arr = read(LS.sellers,[]);
    const item = arr.find(x=> x.id===idd);
    if(item){ item.status = sel.value; if(sel.value==='blocked'){ item.blocked = true; } else { item.blocked = false; } write(LS.sellers,arr); }
    fillAdminSellers(); renderCards();
  }));
  tbody.querySelectorAll('[data-edit-seller]').forEach(btn=> btn.addEventListener('click',()=>{
    const idd = +btn.getAttribute('data-edit-seller');
    openEditSeller(idd);
  }));
}

function fillAdminUsers(){
  const us = read(LS.users,[]);
  const tbu = document.querySelector('#tbl-users tbody');
  tbu.innerHTML = us.map(u=>{
    const created = u.created? new Date(u.created).toLocaleDateString() : '';
    const actions = [];
    if(u.u !== 'admin'){
      if(u.role === 'user') actions.push(`<button class="btn" data-promote-user="${escapeHTML(u.u)}">Повысить до admin</button>`);
      if(u.role === 'admin') actions.push(`<button class="btn" data-demote-user="${escapeHTML(u.u)}">Понизить до user</button>`);
      actions.push(`<button class="btn" data-reset-user="${escapeHTML(u.u)}">Сбросить пароль</button>`);
      actions.push(`<button class="btn btn-danger" data-del-user="${escapeHTML(u.u)}">Удалить</button>`);
    } else {
      actions.push('—');
    }
    return `<tr>
        <td>${escapeHTML(u.u)}</td>
        <td>${escapeHTML(u.role)}</td>
        <td>${escapeHTML(created)}</td>
        <td>${actions.join(' ')}</td>
      </tr>`;
  }).join('');
  tbu.querySelectorAll('[data-promote-user]').forEach(btn=> btn.addEventListener('click',()=>{
    const u = btn.getAttribute('data-promote-user');
    const arr = read(LS.users,[]);
    const user = arr.find(x=> x.u===u);
    if(user){ user.role='admin'; write(LS.users,arr); fillAdminUsers(); syncAuth(); }
  }));
  tbu.querySelectorAll('[data-demote-user]').forEach(btn=> btn.addEventListener('click',()=>{
    const u = btn.getAttribute('data-demote-user');
    const arr = read(LS.users,[]);
    const user = arr.find(x=> x.u===u);
    if(user){ user.role='user'; write(LS.users,arr); fillAdminUsers(); syncAuth(); }
  }));
  tbu.querySelectorAll('[data-reset-user]').forEach(btn=> btn.addEventListener('click',()=>{
    const u = btn.getAttribute('data-reset-user');
    const arr = read(LS.users,[]);
    const user = arr.find(x=> x.u===u);
    if(user){
      const newPass = Math.random().toString(36).slice(2,10);
      user.p = newPass;
      write(LS.users,arr);
      alert('Новый пароль для '+u+': '+newPass);
    }
  }));
  tbu.querySelectorAll('[data-del-user]').forEach(btn=> btn.addEventListener('click',()=>{
    const u = btn.getAttribute('data-del-user');
    let arr = read(LS.users,[]);
    arr = arr.filter(x=> x.u!==u);
    write(LS.users,arr);
    fillAdminUsers();
  }));
}

// Обновить UI категорий после их изменения
function updateCategoriesUI(){
  const cats = getCategories();
  // обновляем боковое меню категорий
  const catUl = document.getElementById('cats');
  if(catUl){
    // запомнить выбранную категорию
    const selectedCat = currentFilter.cat;
    catUl.innerHTML = '';
    const makeLi = (val,label)=>{
      const li = document.createElement('li');
      li.dataset.cat = val;
      li.textContent = label;
      if(selectedCat === val) li.classList.add('active');
      li.addEventListener('click',()=>{
        document.querySelectorAll('#cats li').forEach(x=> x.classList.remove('active'));
        li.classList.add('active');
        currentFilter.cat = li.dataset.cat;
        renderCards();
      });
      return li;
    };
    catUl.appendChild(makeLi('all','Все категории'));
    cats.forEach(catObj=>{
      catUl.appendChild(makeLi(catObj.key, catObj.label));
    });
  }
  // обновляем селектор категории в форме создания карточки
  const catSelect = document.getElementById('c-cat');
  if(catSelect){
    catSelect.innerHTML = cats.map(c=>`<option value="${escapeHTML(c.key)}">${escapeHTML(c.label)}</option>`).join('');
    // если текущий фильтр не существует, выбираем первую категорию
    catSelect.value = cats[0] ? cats[0].key : '';
  }
  // Обновляем селекторы категорий в админ фильтре и массовых действиях через повторную инициализацию
  const filtWrap = document.getElementById('seller-filters');
  if(filtWrap){ delete filtWrap.dataset.init; }
  const bulkWrap = document.getElementById('seller-bulk-actions');
  if(bulkWrap){ delete bulkWrap.dataset.init; }
  fillAdminSellers();
  renderCards();
}

function fillAdminSettings(){
  const fileInputs = [document.getElementById('banner-file-1'), document.getElementById('banner-file-2')];
  const urlInputs = [document.getElementById('banner-url-1'), document.getElementById('banner-url-2')];
  const linkInputs = [document.getElementById('banner-link-1'), document.getElementById('banner-link-2')];
  const st = getSettings();
  function handleBannerFile(i){
    const file = fileInputs[i].files && fileInputs[i].files[0];
    if(!file) return;
    const fr = new FileReader();
    fr.onload = ()=>{
      st.banners.slots[i].src = fr.result;
      if(urlInputs[i]) urlInputs[i].value = '';
      saveSettings(st);
      applySettings();
    };
    fr.readAsDataURL(file);
  }
  fileInputs.forEach((inp,i)=>{
    if(inp && !inp.dataset.bound){ inp.dataset.bound='1'; inp.addEventListener('change',()=> handleBannerFile(i)); }
  });
  urlInputs.forEach((inp,i)=>{
    if(inp && !inp.dataset.bound){ inp.dataset.bound='1'; inp.addEventListener('input',()=>{
      st.banners.slots[i].src = normalizeURL(inp.value.trim());
      saveSettings(st);
      applySettings();
    }); }
  });
  linkInputs.forEach((inp,i)=>{
    if(inp && !inp.dataset.bound){ inp.dataset.bound='1'; inp.addEventListener('input',()=>{
      st.banners.slots[i].link = inp.value.trim();
      saveSettings(st);
    }); }
  });

  // Баннер после поиска (mid-banner)
  const midFileInput = document.getElementById('mid-banner-file');
  const midUrlInput2 = document.getElementById('mid-banner-url');
  const midLinkInput2 = document.getElementById('mid-banner-link');
  if(midFileInput && !midFileInput.dataset.bound){ midFileInput.dataset.bound='1'; midFileInput.addEventListener('change',()=>{
      const f = midFileInput.files && midFileInput.files[0];
      if(!f) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        st.midBanner.src = fr.result;
        if(midUrlInput2) midUrlInput2.value='';
        saveSettings(st);
        applySettings();
      };
      fr.readAsDataURL(f);
    }); }
  if(midUrlInput2 && !midUrlInput2.dataset.bound){ midUrlInput2.dataset.bound='1'; midUrlInput2.addEventListener('input',()=>{
      st.midBanner.src = normalizeURL(midUrlInput2.value.trim());
      saveSettings(st);
      applySettings();
    }); }
  if(midLinkInput2 && !midLinkInput2.dataset.bound){ midLinkInput2.dataset.bound='1'; midLinkInput2.addEventListener('input',()=>{
      st.midBanner.link = midLinkInput2.value.trim();
      saveSettings(st);
    }); }

  // Баннер в боковой панели
  const sbFileInput = document.getElementById('sidebar-banner-file');
  const sbUrlInput2 = document.getElementById('sidebar-banner-url');
  const sbLinkInput2 = document.getElementById('sidebar-banner-link');
  if(sbFileInput && !sbFileInput.dataset.bound){ sbFileInput.dataset.bound='1'; sbFileInput.addEventListener('change',()=>{
      const f = sbFileInput.files && sbFileInput.files[0];
      if(!f) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        st.sidebarBanner.src = fr.result;
        if(sbUrlInput2) sbUrlInput2.value='';
        saveSettings(st);
        applySettings();
      };
      fr.readAsDataURL(f);
    }); }
  if(sbUrlInput2 && !sbUrlInput2.dataset.bound){ sbUrlInput2.dataset.bound='1'; sbUrlInput2.addEventListener('input',()=>{
      st.sidebarBanner.src = normalizeURL(sbUrlInput2.value.trim());
      saveSettings(st);
      applySettings();
    }); }
  if(sbLinkInput2 && !sbLinkInput2.dataset.bound){ sbLinkInput2.dataset.bound='1'; sbLinkInput2.addEventListener('input',()=>{
      st.sidebarBanner.link = sbLinkInput2.value.trim();
      saveSettings(st);
    }); }
  // бегущая строка
  const tickerItems = document.getElementById('ticker-items');
  const tickerSpeed = document.getElementById('ticker-speed');
  if(tickerItems && !tickerItems.dataset.bound){ tickerItems.dataset.bound='1'; tickerItems.addEventListener('input',()=>{
    st.ticker.items = tickerItems.value.split('\n').map(x=>x.trim()).filter(x=>x);
    saveSettings(st);
    applySettings();
  }); }
  if(tickerSpeed && !tickerSpeed.dataset.bound){ tickerSpeed.dataset.bound='1'; tickerSpeed.addEventListener('change',()=>{
    const v = parseInt(tickerSpeed.value||'0',10);
    st.ticker.speed = isNaN(v)? DEFAULT_SETTINGS.ticker.speed : Math.max(5,v);
    saveSettings(st);
    applySettings();
  }); }
  // палитра
  const palAccent2 = document.getElementById('palette-accent');
  const palDark2 = document.getElementById('palette-accent-dark');
  const pal22 = document.getElementById('palette-accent2');
  function updatePalette(){
    st.palette.accent = palAccent2.value;
    st.palette.accentDark = palDark2.value;
    st.palette.accent2 = pal22.value;
    saveSettings(st);
    applySettings();
  }
  [palAccent2,palDark2,pal22].forEach(inp=>{
    if(inp && !inp.dataset.bound){ inp.dataset.bound='1'; inp.addEventListener('change',updatePalette); }
  });
  // гарантия
  const gTitle = document.getElementById('guarantee-title');
  const gSub = document.getElementById('guarantee-subtitle');
  if(gTitle && !gTitle.dataset.bound){ gTitle.dataset.bound='1'; gTitle.addEventListener('input',()=>{
    st.guarantee.title = gTitle.value;
    saveSettings(st);
    applySettings();
  }); }
  if(gSub && !gSub.dataset.bound){ gSub.dataset.bound='1'; gSub.addEventListener('input',()=>{
    st.guarantee.subtitle = gSub.value;
    saveSettings(st);
    applySettings();
  }); }

  // текст и ссылка кнопки в блоке гарантий
  const gBtnTextInput2 = document.getElementById('guarantee-btn-text');
  const gBtnLinkInput2 = document.getElementById('guarantee-btn-link');
  if(gBtnTextInput2 && !gBtnTextInput2.dataset.bound){
    gBtnTextInput2.dataset.bound='1';
    gBtnTextInput2.addEventListener('input', ()=>{
      st.guaranteeButton.text = gBtnTextInput2.value;
      saveSettings(st);
      applySettings();
    });
  }
  if(gBtnLinkInput2 && !gBtnLinkInput2.dataset.bound){
    gBtnLinkInput2.dataset.bound='1';
    gBtnLinkInput2.addEventListener('input', ()=>{
      st.guaranteeButton.link = gBtnLinkInput2.value.trim();
      saveSettings(st);
      applySettings();
    });
  }
  // экспорт
  const exportBtn = document.getElementById('export-json');
  if(exportBtn && !exportBtn.dataset.bound){ exportBtn.dataset.bound='1'; exportBtn.addEventListener('click',()=>{
    const data = { sellers: read(LS.sellers,[]), users: read(LS.users,[]), settings: getSettings() };
    document.getElementById('json-data').value = JSON.stringify(data, null, 2);
  }); }
  // импорт
  const importBtn = document.getElementById('import-json');
  if(importBtn && !importBtn.dataset.bound){ importBtn.dataset.bound='1'; importBtn.addEventListener('click',()=>{
    try{
      const txt = document.getElementById('json-import').value;
      const obj = JSON.parse(txt);
      if(obj.sellers) write(LS.sellers,obj.sellers);
      if(obj.users) write(LS.users,obj.users);
      if(obj.settings) saveSettings(obj.settings);
      fillAdminTables();
      renderCards();
      applySettings();
      alert('Импортировано');
    }catch(e){ alert('Некорректный JSON'); }
  }); }

  // управление категориями
  const catListEl = document.getElementById('cat-list');
  const addCatBtn = document.getElementById('add-cat');
  const saveCatBtn = document.getElementById('save-cat');
  // Helper: отобразить текущие категории в форме
  function renderCatList(){
    if(!catListEl) return;
    catListEl.innerHTML = '';
    const cats = getCategories();
    cats.forEach((c, idx)=>{
      const row = document.createElement('div');
      row.className = 'row';
      row.style.gap = '6px';
      row.style.alignItems = 'center';
      const keyInput = document.createElement('input'); keyInput.className='field'; keyInput.placeholder='Ключ'; keyInput.style.minWidth='120px'; keyInput.value = c.key;
      const labelInput = document.createElement('input'); labelInput.className='field'; labelInput.placeholder='Название'; labelInput.style.minWidth='160px'; labelInput.value = c.label;
      const rmBtn = document.createElement('button'); rmBtn.className='btn rm'; rmBtn.textContent='✕';
      rmBtn.addEventListener('click',()=>{ row.remove(); });
      row.appendChild(keyInput);
      row.appendChild(labelInput);
      row.appendChild(rmBtn);
      catListEl.appendChild(row);
    });
  }
  // Инициализировать форму категорий один раз
  if(catListEl && !catListEl.dataset.init){
    catListEl.dataset.init = '1';
    renderCatList();
  }
  if(addCatBtn && !addCatBtn.dataset.bound){
    addCatBtn.dataset.bound = '1';
    addCatBtn.addEventListener('click',()=>{
      const row = document.createElement('div');
      row.className = 'row';
      row.style.gap = '6px';
      row.style.alignItems = 'center';
      const keyInput = document.createElement('input'); keyInput.className='field'; keyInput.placeholder='Ключ'; keyInput.style.minWidth='120px';
      const labelInput = document.createElement('input'); labelInput.className='field'; labelInput.placeholder='Название'; labelInput.style.minWidth='160px';
      const rmBtn = document.createElement('button'); rmBtn.className='btn rm'; rmBtn.textContent='✕'; rmBtn.addEventListener('click',()=>{ row.remove(); });
      row.appendChild(keyInput);
      row.appendChild(labelInput);
      row.appendChild(rmBtn);
      catListEl.appendChild(row);
    });
  }
  if(saveCatBtn && !saveCatBtn.dataset.bound){
    saveCatBtn.dataset.bound = '1';
    saveCatBtn.addEventListener('click',()=>{
      const rows = Array.from(catListEl.querySelectorAll('.row'));
      const newCats = [];
      rows.forEach(r=>{
        const k = r.querySelector('input.field:nth-child(1)').value.trim();
        const l = r.querySelector('input.field:nth-child(2)').value.trim();
        if(k && l) newCats.push({key:k, label:l});
      });
      const st2 = getSettings();
      st2.categories = newCats;
      saveSettings(st2);
      // обновляем категории на сайте
      updateCategoriesUI();
      alert('Категории сохранены');
    });
  }

  // ----- Логотип и иконка -----
  // Выбор файла для логотипа
  const logoFile = document.getElementById('logo-file');
  const logoUrl = document.getElementById('logo-url');
  const logoPrevEl = document.getElementById('logo-preview');
  const favFile = document.getElementById('favicon-file');
  const favUrl = document.getElementById('favicon-url');
  const favPrevEl = document.getElementById('favicon-preview');
  if(logoFile && !logoFile.dataset.bound){
    logoFile.dataset.bound = '1';
    logoFile.addEventListener('change',()=>{
      const f = logoFile.files && logoFile.files[0];
      if(!f) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        st.logo.src = fr.result;
        if(logoUrl) logoUrl.value='';
        saveSettings(st);
        applySettings();
      };
      fr.readAsDataURL(f);
    });
  }
  if(logoUrl && !logoUrl.dataset.bound){
    logoUrl.dataset.bound = '1';
    logoUrl.addEventListener('input',()=>{
      st.logo.src = normalizeURL(logoUrl.value.trim());
      saveSettings(st);
      applySettings();
    });
  }
  // Файл favicon
  if(favFile && !favFile.dataset.bound){
    favFile.dataset.bound = '1';
    favFile.addEventListener('change',()=>{
      const f = favFile.files && favFile.files[0];
      if(!f) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        st.favicon.src = fr.result;
        if(favUrl) favUrl.value='';
        saveSettings(st);
        applySettings();
      };
      fr.readAsDataURL(f);
    });
  }
  if(favUrl && !favUrl.dataset.bound){
    favUrl.dataset.bound = '1';
    favUrl.addEventListener('input',()=>{
      st.favicon.src = normalizeURL(favUrl.value.trim());
      saveSettings(st);
      applySettings();
    });
  }
  // ----- Уведомление -----
  const notifInput2 = document.getElementById('notification-text');
  if(notifInput2 && !notifInput2.dataset.bound){
    notifInput2.dataset.bound = '1';
    notifInput2.addEventListener('input',()=>{
      st.notification.text = notifInput2.value;
      saveSettings(st);
      applySettings();
    });
  }
}

// Построить профиль пользователя
function buildProfile(){
  const profEl = document.getElementById('profile-info');
  const session = getSession();
  if(!profEl || !session){ return; }
  const users = read(LS.users, []);
  const user = users.find(u => u.u === session.u);
  const sellers = read(LS.sellers, []).filter(x => x.nick === session.u && !x.blocked);
  const approved = sellers.find(x => !x.pending);
  const pending = sellers.find(x => x.pending);
  let html = '';
  // Базовая карточка с информацией о пользователе
  html += `<section class="info-card">
    <div class="info-head">👤 Профиль</div>
    <div class="info-body">
      <p><b>Никнейм:</b> ${escapeHTML(session.u)}</p>
      <p><b>Роль:</b> ${escapeHTML(session.role)}</p>
      <p><b>Дата регистрации:</b> ${user && user.created ? escapeHTML(new Date(user.created).toLocaleDateString()) : '—'}</p>
    </div>
  </section>`;
  if(approved){
    html += `<section class="info-card" style="margin-top:16px">
      <div class="info-head">🪪 Ваша карточка</div>
      <div class="info-body">
        <p><b>Название:</b> ${escapeHTML(approved.name)}</p>
        <p><b>Описание:</b> ${escapeHTML(approved.desc)}</p>
        <p><b>Категория:</b> ${escapeHTML(catLabel(approved.cat))}</p>
        <p><b>Опыт:</b> ${escapeHTML(approved.deposits || '—')}</p>
        <p><b>Проекты:</b> ${Number(approved.deals || 0)}</p>
        <p><b>Telegram:</b> ${approved.tg ? escapeHTML(approved.tg) : '—'}</p>
        <div style="margin-top:12px"><button class="btn" id="profile-edit-card">Редактировать карточку</button></div>
      </div>
    </section>`;
  } else if(pending){
    html += `<section class="info-card" style="margin-top:16px">
      <div class="info-head">⌛ На модерации</div>
      <div class="info-body">
        <p><b>Название:</b> ${escapeHTML(pending.name)}</p>
        <p><b>Описание:</b> ${escapeHTML(pending.desc)}</p>
        <p><b>Категория:</b> ${escapeHTML(catLabel(pending.cat))}</p>
        <p style="color:var(--warning);margin-top:4px;">Карточка ожидает модерации. После одобрения она появится в каталоге.</p>
      </div>
    </section>`;
  } else {
    html += `<section class="info-card" style="margin-top:16px">
      <div class="info-head">➕ Создание карточки</div>
      <div class="info-body">
        <p>У вас пока нет карточки исполнителя.</p>
        <div style="margin-top:12px"><button class="btn btn-primary" id="profile-add-card">Создать карточку</button></div>
      </div>
    </section>`;
  }
  profEl.innerHTML = html;
  const editBtn = document.getElementById('profile-edit-card');
  if(editBtn && approved){
    editBtn.addEventListener('click',()=>{
      // открываем редактор карточки без смены раздела
      openEditSeller(approved.id);
    });
  }
  const addBtn = document.getElementById('profile-add-card');
  if(addBtn){
    addBtn.addEventListener('click',()=>{
      // открываем модальное окно создания карточки
      document.getElementById('btn-add-card').click();
    });
  }
}

// Глобальный слушатель кликов для открытия профиля продавца.
// Если клик происходит на кнопке/ссылке внутри карточки с атрибутом data-stop,
// то не открываем профиль.
document.addEventListener('click',(e)=>{
  // Если кликнули на элемент, помеченный как стоп, игнорируем
  if(e.target.closest('[data-stop]')) return;
  const cardEl = e.target.closest('[data-profile]');
  if(cardEl){ openSeller(+cardEl.getAttribute('data-profile')); }
});
function openSeller(id){
  const s = read(LS.sellers,[]).find(x=>x.id===id); if(!s) return;
  const m = document.createElement('div'); m.className='modal open';
  const ava = s.avatar? `<img src="${escapeHTML(s.avatar)}" alt="">` : escapeHTML((s.name||'?')[0]||'?');
  const chips = `
      ${s.status?`<span class="chip status-${escapeHTML(s.status)}">${escapeHTML(statusLabel(s.status))}</span>`:''}
      ${s.flags?.verified?'<span class="chip">Проверен</span>':''}
      ${s.flags?.escrow?'<span class="chip">Эскроу</span>':''}
      ${s.flags?.rating4?'<span class="chip">4★+</span>':''}`;
  // Список ресурсов без ссылок: выводим как чипы без якоря
  const forumList = Array.isArray(s.forums)&&s.forums.length ? `<div style='margin-top:8px'>${s.forums.map(it=>`<span class="link-chip">🔗 ${escapeHTML(it.title||'Ссылка')}</span>`).join(' ')}</div>` : '';
  // Формируем список отзывов и форму для добавления нового отзыва
  const reviews = Array.isArray(s.reviews) ? s.reviews : [];
  let reviewsHTML = '';
  if(reviews.length){
    reviewsHTML = reviews.map(r => {
      const starsFull = '★'.repeat(Math.max(1, Math.min(5, parseInt(r.rating||0,10))));
      const starsEmpty = '☆'.repeat(5 - starsFull.length);
      return `<div class='review'><span class='stars'>${starsFull}${starsEmpty}</span> <b>${escapeHTML(r.user)}</b>: ${escapeHTML(r.comment||'')}</div>`;
    }).join('');
  } else {
    reviewsHTML = `<p class="muted">Отзывов пока нет</p>`;
  }
  const sessionUser = getSession();
  const canReview = sessionUser && sessionUser.u !== s.nick;
  const reviewFormHTML = canReview ? `
    <div class='review-form' style='margin-top:12px'>
      <h4>Оставить отзыв</h4>
      <label>Оценка</label>
      <select class='field' id='review-rating'>
        <option value='5'>5</option>
        <option value='4'>4</option>
        <option value='3'>3</option>
        <option value='2'>2</option>
        <option value='1'>1</option>
      </select>
      <label>Комментарий</label>
      <textarea class='field' id='review-comment' rows='2' placeholder='Ваш отзыв...'></textarea>
      <button class='btn btn-primary' id='review-submit'>Отправить</button>
      <div id='review-error' class='muted' style='color:#f87171;margin-top:4px'></div>
    </div>
  ` : '';
  m.innerHTML = `
    <div class='panel'>
      <div class='panel-head'><b>${escapeHTML(s.name)}</b><button class='x' data-close>×</button></div>
      <div class='panel-body'>
        <div class='row' style='gap:16px;align-items:flex-start;'>
          <div class='avatar' style='width:72px;height:72px;font-size:32px'>${ava}</div>
          <div style='flex:1'>
            <div class='row' style='gap:8px;flex-wrap:wrap'>${chips}</div>
            <!-- Данные исполнителя с пиктограммами для улучшенного восприятия -->
            <p class='muted' style='margin-top:8px'><span style='margin-right:4px'>📁</span><b>Категория:</b> ${escapeHTML(catLabel(s.cat))}</p>
            <p style='margin:4px 0'><span style='margin-right:4px'>📝</span><b>Описание:</b> ${escapeHTML(s.desc||'—')}</p>
            <p class='muted' style='margin:4px 0'><span style='margin-right:4px'>💼</span><b>Опыт:</b> ${escapeHTML(s.deposits||'—')}</p>
            <p class='muted' style='margin:4px 0'><span style='margin-right:4px'>📊</span><b>Проекты:</b> ${Number(s.deals||0)}</p>
            <p class='muted' style='margin:4px 0'><span style='margin-right:4px'>✈️</span><b>Телеграм:</b> ${s.tg ? escapeHTML(s.tg) : '—'}</p>
            ${forumList}
            ${s.tg ? `<div style='margin-top:12px'><a class="btn btn-primary" href="https://t.me/${escapeHTML(String(s.tg).replace(/^@/,''))}" target="_blank" rel="noopener">Написать в Telegram</a></div>` : ''}
            <!-- Отзывы и форма -->
            <div style='margin-top:16px'>
              <h4>Отзывы (${reviews.length})</h4>
              ${reviewsHTML}
              ${reviewFormHTML}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  m.addEventListener('click',ev=>{ if(ev.target.matches('[data-close]')||ev.target===m) m.remove(); });
  document.body.appendChild(m);
}

document.querySelectorAll('.modal').forEach(m=> m.addEventListener('click',e=>{ if(e.target===m) closeModal(m); }));

syncAuth();
// Применяем пользовательские настройки (цветовая палитра, баннеры, бегущая строка и т.д.)
applySettings();
// Обновляем категории и связанные элементы после применения настроек
updateCategoriesUI();

// Получение количества подписчиков Telegram канала через Jina.ai (анонимный парсер)
(function(){
  const out = document.getElementById('tg-count'); if(!out) return;
  function fmt(n){ if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0).replace(/\.0$/,'')+'M'; if(n>=1e3) return (n/1e3).toFixed(n%1e3?1:0).replace(/\.0$/,'')+'K'; return String(n); }
  function fetchText(u){ return fetch(u,{cache:'no-store'}).then(r=>{ if(!r.ok) throw 0; return r.text(); }); }
  function extract(t){ const m = t.match(/([0-9][0-9\s\.,]*)\s*(подписчиков|подписчики|подписчика|subscribers|members)/i); return m? parseInt(m[1].replace(/[^0-9]/g,''),10):null; }
  (async ()=>{
    try{
      out.textContent='…';
      const urls=[
        'https://r.jina.ai/http://t.me/OwnershipDesign',
        'https://r.jina.ai/http://t.me/s/OwnershipDesign',
        'https://r.jina.ai/https://t.me/OwnershipDesign'];
      for(const u of urls){ try{ const t = await fetchText(u); const n = extract(t||''); if(n){ out.textContent = fmt(n); return; } }catch(e){} }
      out.textContent='—';
    }catch(e){ out.textContent='—'; }
  })();
})();

// Копирование TOR-ссылки (не используется в новой версии, но оставлено для совместимости)
(function(){
  const btn = document.getElementById('copy-onion'); if(!btn) return;
  function legacyCopy(text){ const ta=document.createElement('textarea'); ta.value=text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-1000px'; document.body.appendChild(ta); ta.focus(); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); }
  async function safeCopy(text){ try{ if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); } else { legacyCopy(text); } return true; } catch(e){ legacyCopy(text); return false; } }
  btn.addEventListener('click', async ()=>{ const val = (document.getElementById('onion-field')?.textContent||'').trim(); const ok = await safeCopy(val); btn.textContent = ok?'✅':'❌'; setTimeout(()=>btn.textContent='📋',1200); });
})();

// Автопрокрутка логотипов партнёров
(function(){
  const track = document.getElementById('partners-track'); if(!track) return;
  const clones = Array.from(track.children).map(n=>n.cloneNode(true)); clones.forEach(n=>track.appendChild(n));
  const style = document.createElement('style'); style.textContent='@keyframes partners-slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}'; document.head.appendChild(style);
  function setAnim(){ const gap=16; let total=0; Array.from(track.children).forEach(el=> total += el.getBoundingClientRect().width + gap); const half = total/2; const speed = 60; const dur = Math.max(20, Math.round(half/speed)); track.style.animation = `partners-slide ${dur}s linear infinite`; }
  setTimeout(setAnim,0); window.addEventListener('resize',()=>{ clearTimeout(window.__p2); window.__p2=setTimeout(setAnim,150); });
})();

// Поиск исполнителей: обновляем список при вводе или клике на кнопку
(function(){
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  if(input){
    input.addEventListener('input', ()=>{
      searchQuery = input.value.trim().toLowerCase();
      renderCards();
    });
    input.addEventListener('keypress', (e)=>{
      if(e.key === 'Enter'){
        searchQuery = input.value.trim().toLowerCase();
        renderCards();
      }
    });
  }
  if(btn){
    btn.addEventListener('click', ()=>{
      searchQuery = input ? input.value.trim().toLowerCase() : '';
      renderCards();
    });
  }
})();

// Переключение между домашней и рекламной страницами
(function(){
  const homeSection = document.getElementById('home-section');
  const adsSection  = document.getElementById('ads-section');
  const howSection  = document.getElementById('how-section');
  const profileSection = document.getElementById('profile-section');
  const navHome = document.getElementById('nav-home');
  const navAds  = document.getElementById('nav-ads');
  const navHow  = document.getElementById('nav-how');
  const navProfile = document.getElementById('nav-profile');
  function showHome(){
    if(homeSection) homeSection.classList.remove('hidden');
    if(adsSection)  adsSection.classList.add('hidden');
    if(howSection) howSection.classList.add('hidden');
    if(profileSection) profileSection.classList.add('hidden');
    document.querySelectorAll('nav .nav-link').forEach(x=> x.classList.remove('active'));
    if(navHome) navHome.classList.add('active');
    // Закрываем любые открытые модальные окна при смене раздела
    document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
  }
  function showAds(){
    if(homeSection) homeSection.classList.add('hidden');
    if(adsSection)  adsSection.classList.remove('hidden');
    if(howSection) howSection.classList.add('hidden');
    if(profileSection) profileSection.classList.add('hidden');
    document.querySelectorAll('nav .nav-link').forEach(x=> x.classList.remove('active'));
    if(navAds) navAds.classList.add('active');
    // Закрываем открытые модальные окна при переходе
    document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
  }
  function showHow(){
    if(homeSection) homeSection.classList.add('hidden');
    if(adsSection)  adsSection.classList.add('hidden');
    if(howSection) howSection.classList.remove('hidden');
    if(profileSection) profileSection.classList.add('hidden');
    document.querySelectorAll('nav .nav-link').forEach(x=> x.classList.remove('active'));
    if(navHow) navHow.classList.add('active');
    // Закрываем открытые модальные окна при переходе
    document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
  }
  function showProfile(){
    if(homeSection) homeSection.classList.add('hidden');
    if(adsSection) adsSection.classList.add('hidden');
    if(howSection) howSection.classList.add('hidden');
    if(profileSection) profileSection.classList.remove('hidden');
    document.querySelectorAll('nav .nav-link').forEach(x=> x.classList.remove('active'));
    if(navProfile) navProfile.classList.add('active');
    document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
    buildProfile();
  }
  // клик по логотипу возвращает на главную
  const logoEl = document.querySelector('.logo');
  if(logoEl){
    logoEl.style.cursor = 'pointer';
    // обработчик клика по логотипу будет назначен ниже вместе с хеш‑навигацией
  }

  /**
   * При навигации между разделами обновляем хеш в адресной строке.
   * Это позволяет сохранять активную вкладку после перезагрузки (F5).
   * Обработчик навигации устанавливает соответствующий хеш, а при
   * загрузке страницы и изменении хеша вызываются нужные функции отображения.
   */
  function updateHash(target){
    // не добавляем дубликаты, чтобы не создавать историю назад лишний раз
    const current = window.location.hash.replace('#','');
    if(current !== target){
      window.location.hash = target;
    }
  }
  // переопределяем обработчики клика по навигационным ссылкам
  if(navHome) navHome.addEventListener('click', (e)=>{ e.preventDefault(); updateHash('home'); showHome(); });
  if(navAds) navAds.addEventListener('click', (e)=>{ e.preventDefault(); updateHash('ads'); showAds(); });
  if(navHow) navHow.addEventListener('click', (e)=>{ e.preventDefault(); updateHash('how'); showHow(); });
  if(navProfile) navProfile.addEventListener('click', (e)=>{ e.preventDefault(); updateHash('profile'); showProfile(); });
  if(logoEl) logoEl.addEventListener('click',(e)=>{ e.preventDefault(); updateHash('home'); showHome(); });

  // функция инициализации отображения раздела в зависимости от хеша
  function applyInitialHash(){
    const hash = window.location.hash.replace('#','');
    switch(hash){
      case 'ads': showAds(); break;
      case 'how': showHow(); break;
      case 'profile':
        // показываем профиль только если пользователь авторизован
        if(getSession()) showProfile(); else showHome();
        break;
      case 'home':
      default: showHome(); break;
    }
  }
  // вызов при загрузке
  applyInitialHash();
  // обработчик изменения хеша (например при навигации кнопками браузера)
  window.addEventListener('hashchange', applyInitialHash);
})();

// Обработчик смены языка. При клике на переключатель языка
// меняем значение в настройках, сохраняем и повторно применяем настройки,
// что автоматически обновит все переведённые элементы.
(function(){
  const toggle = document.getElementById('lang-toggle');
  if(!toggle) return;
  toggle.addEventListener('click', () => {
    const st = getSettings();
    const newLang = st.language === 'ru' ? 'en' : 'ru';
    st.language = newLang;
    saveSettings(st);
    applySettings();
  });
})();