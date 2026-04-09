const icon = (name, active = false, className = "") =>
  `<img class="${className || "icon-toned"} ${active ? "metric-card__icon--active" : ""}" src="/Users/vana/Documents/design-app/assets/symbols/${name}" alt="" />`;

const state = {
  page: "today",
  riskSubtab: "all",
  analyticsSubtab: "kpi",
};

const navItems = [
  { id: "today", label: "Сегодня", icon: "calendar.day.timeline.left.svg", count: 3 },
  { id: "risks", label: "Риски", icon: "flag.svg", count: 7 },
  { id: "search", label: "Поиск", icon: "magnifyingglass.svg" },
  { id: "leads", label: "Лиды", icon: "person.crop.rectangle.stack.svg", count: 67 },
  { id: "analytics", label: "Аналитика", icon: "chart.bar.svg" },
];

const todayMetrics = [
  ["Сделки в риске", 7, "exclamationmark.triangle.svg"],
  ["Зависшие сделки", 4, "clock.svg"],
  ["Входящих", 3, "tray.and.arrow.down.svg"],
  ["VIP клиенты", 2, "crown.svg"],
  ["Follow-Up сегодня", 4, "clock.svg"],
];

const todayVipClients = [
  {
    company: "ООО “Технопарк Групп”",
    risk: "Высокий",
    riskClass: "today-risk-chip--high",
    manager: "Дмитрий Соколов",
    description: "VIP-клиент без ответа 14 дней. Риск потери контракта на 4,8 млн руб./мес.",
  },
  {
    company: "ООО “БелыеТемки”",
    risk: "Средний",
    riskClass: "today-risk-chip--medium",
    manager: "Антон Митьков",
    description: "Переговоры по контракту 12,5 млн руб. замедлились. Запрос тех. карты висит 5 дней.",
  },
];

const vipClients = [
  {
    company: "ООО «ТехноПак Групп»",
    riskLabel: "Высокий",
    riskClass: "tag--red",
    manager: "Дмитрий Соколов",
    description: "VIP-клиент без ответа 14 дней. Риск потери контракта на 4,8 млн руб./мес.",
  },
  {
    company: "ООО «ФармаПак»",
    riskLabel: "Средний",
    riskClass: "tag--orange",
    manager: "Игорь Лебедев",
    description: "Переговоры по контракту 12,5 млн руб. замедлились. Запрос тех. карты висит 5 дней.",
  },
];

const priorityDeals = [
  {
    client: "ООО «ТехноПак Групп»",
    vip: true,
    summary: "14 дней без ответа на КП. Конкурент активен.",
    amount: "4.8 млн ₽",
    stage: "Переговоры",
    owner: "Д. Соколов",
    risk: "Высокий 72%",
    riskClass: "tag--red",
    mood: "Негативный",
    moodClass: "tag--red",
    action: "Позвонить лично, предложить скидку 5% до 15 апреля",
    age: "14 дней назад",
  },
  {
    client: "ООО «ЭкоПак Решения»",
    summary: "21 день без движения. Расчёт завис на согласовании.",
    amount: "650 тыс ₽",
    stage: "Заморожена",
    owner: "П. Волков",
    risk: "Критический 88%",
    riskClass: "tag--critical",
    mood: "Негативный",
    moodClass: "tag--red",
    action: "Срочно связаться, выяснить причину блокировки",
    age: "21 дн. назад",
  },
  {
    client: "АО «Продторг»",
    summary: "Конкурент предложил цену ниже. Клиент колеблется.",
    amount: "1.2 млн ₽",
    stage: "КП отправлено",
    owner: "Е. Новикова",
    risk: "Средний 45%",
    riskClass: "tag--orange",
    mood: "Смешанный",
    moodClass: "tag--mixed",
    action: "Отправить кейсы аналогичных клиентов и предложить пилотный запуск",
    age: "7 дней назад",
  },
  {
    client: "ООО «ФармаПак»",
    vip: true,
    summary: "Задержка с техническими характеристиками от производства",
    amount: "12.5 млн ₽",
    stage: "Переговоры",
    owner: "И. Лебедев",
    risk: "Средний 38%",
    riskClass: "tag--orange",
    mood: "Нейтральный",
    moodClass: "tag--neutral",
    action: "Ускорить подготовку техкарты, согласовать с производством",
    age: "3 дня назад",
  },
  {
    client: "ЗАО «МеталлПром»",
    summary: "Нет ответа 5 дней — в пределах нормы",
    amount: "920 тыс ₽",
    stage: "КП отправлено",
    owner: "Д. Соколов",
    risk: "Низкий 31%",
    riskClass: "tag--green",
    mood: "Нейтральный",
    moodClass: "tag--neutral",
    action: "Контрольный звонок через 2 дня",
    age: "5 дней назад",
  },
];

const inboxItems = [
  {
    icon: "☐",
    client: "ООО «СтройМатериалы Юг»",
    risk: "Высокая",
    riskClass: "tag--orange",
    status: "Новое",
    description: "Запрос расчёта упаковки для строительной смеси",
    owner: "Дмитрий Соколов",
  },
  {
    icon: "✉",
    client: "ИП Захарова Т.В.",
    risk: "Низкая",
    riskClass: "tag--gray",
    status: "Новое",
    description: "Нужны крафт-пакеты с логотипом, малый тираж",
    owner: "Екатерина Новикова",
  },
  {
    icon: "☎",
    client: "ОАО «Молокозавод Кубань»",
    risk: "Критическая",
    riskClass: "tag--critical",
    status: "Новое",
    description: "Срочный дозаказ — изменились характеристики продукта",
    owner: "Игорь Лебедев",
  },
];

const moodInsights = [
  {
    client: "ООО «ТехноПак Групп»",
    vip: true,
    from: "Нейтральный",
    fromClass: "tag--neutral",
    to: "Негативный",
    toClass: "tag--red",
    text: "Не отвечает на звонки и emails 14 дней, упомянул конкурента",
  },
  {
    client: "ГК «АгроСнаб»",
    vip: true,
    from: "Нейтральный",
    fromClass: "tag--neutral",
    to: "Позитивный",
    toClass: "tag--green",
    text: "Активно отвечает, запросил дополнительные образцы, расширяет объём",
  },
  {
    client: "АО «Продторг»",
    from: "Позитивный",
    fromClass: "tag--green",
    to: "Смешанный",
    toClass: "tag--mixed",
    text: "Упомянула альтернативное предложение конкурента на последнем звонке",
  },
];

const riskTabs = [
  ["all", "Все риски", 7],
  ["stalled", "Зависшие", 2],
  ["silent", "После КП молчание", 3],
  ["longcalc", "Долгий расчёт", 1],
  ["noanswer", "Без ответа", 1],
  ["churn", "Высокий риск ухода", 0],
];

const riskRows = [
  {
    client: "ООО «ЭкоПак Решения»",
    tabs: ["all", "stalled", "longcalc"],
    manager: "Павел Волков",
    stage: "Заморожена",
    silent: "21 дн. назад",
    silentClass: "var(--red)",
    reason: "Расчёт завис на 21 день. Клиент перестал отвечать...",
    risk: "Критический 88%",
    riskClass: "tag--critical",
    mood: "Негативный",
    moodClass: "tag--red",
    action: "Позвонить и выяснить причину блокировки....",
  },
  {
    client: "ООО «ТехноПак Групп»",
    tabs: ["all", "silent"],
    vip: true,
    manager: "Дмитрий Соколов",
    stage: "Переговоры",
    silent: "14 дней назад",
    silentClass: "var(--red)",
    reason: "14 дней без ответа на КП. Конкурент «ГофроМастер»...",
    risk: "Высокий 72%",
    riskClass: "tag--red",
    mood: "Негативный",
    moodClass: "tag--red",
    action: "Личный звонок + скидка 5% при подписании до...",
  },
  {
    client: "ООО «ПластикПро»",
    tabs: ["all", "silent"],
    manager: "Екатерина Новикова",
    stage: "КП отправлено",
    silent: "12 дней назад",
    silentClass: "var(--orange)",
    reason: "После отправки КП нет ответа 12 дней. Последни...",
    risk: "Высокий 65%",
    riskClass: "tag--red",
    mood: "Нейтральный",
    moodClass: "tag--neutral",
    action: "Отправить follow-up email со ссылкой на...",
    highlight: true,
  },
  {
    client: "ООО «АвтоПак»",
    tabs: ["all"],
    manager: "Дмитрий Соколов",
    stage: "Квалификация",
    silent: "18 дней назад",
    silentClass: "var(--red)",
    reason: "Расчёт ведётся уже 18 дней без результата. Клиент...",
    risk: "Высокий 60%",
    riskClass: "tag--red",
    mood: "Смешанный",
    moodClass: "tag--mixed",
    action: "Срочно ускорить расчёт. Сообщить клиенту...",
  },
  {
    client: "ООО «КондитерПак»",
    tabs: ["all", "noanswer"],
    manager: "Павел Волков",
    stage: "КП отправлено",
    silent: "9 дней назад",
    silentClass: "var(--orange)",
    reason: "Клиент не отвечает 9 дней. Последний звонок был...",
    risk: "Средний 55%",
    riskClass: "tag--orange",
    mood: "Негативный",
    moodClass: "tag--red",
    action: "Позвонить с альтернативным...",
  },
  {
    client: "АО «Продторг»",
    tabs: ["all"],
    manager: "Екатерина Новикова",
    stage: "КП отправлено",
    silent: "7 дней назад",
    silentClass: "var(--orange)",
    reason: "Конкурент предложил цену ниже на 8%. Клиент...",
    risk: "Средний 45%",
    riskClass: "tag--orange",
    mood: "Смешанный",
    moodClass: "tag--mixed",
    action: "Отправить кейсы клиентов + предложит...",
  },
  {
    client: "ООО «ФармаПак»",
    tabs: ["all", "stalled", "silent"],
    vip: true,
    manager: "Игорь Лебедев",
    stage: "Переговоры",
    silent: "5 дней назад",
    silentClass: "var(--text-muted)",
    reason: "Запрос тех. характеристик висит 5 дней. Клиент ждё...",
    risk: "Средний 38%",
    riskClass: "tag--orange",
    mood: "Нейтральный",
    moodClass: "tag--neutral",
    action: "Ускорить техкарту. Отправить...",
  },
];

const analyticsCards = [
  ["Выручка", "47.8 млн ₽", "is-green"],
  ["Всего сделок", "124", ""],
  ["Закрыто", "43", "is-green"],
  ["Потеряно", "28", "is-red"],
  ["Ср. цикл", "34 дн.", ""],
  ["Ср. ответ", "2ч 15м", ""],
  ["Кач. звонков", "76/100", "is-blue"],
];

const kpiRows = [
  ["ДС", "Дмитрий Соколов", "1ч 35м", "18", 24.5, 82, "91%", "28 дн.", "18.4 млн ₽", 84],
  ["ЕН", "Екатерина Новикова", "2ч 20м", "14", 19.2, 68, "78%", "38 дн.", "11.2 млн ₽", 72],
  ["ПВ", "Павел Волков", "3ч 0м", "11", 15.8, 55, "62%", "42 дн.", "7.8 млн ₽", 65],
  ["ИЛ", "Игорь Лебедев", "1ч 15м", "22", 28.1, 95, "95%", "25 дн.", "22.6 млн ₽", 88],
  ["АК", "Анна Козлова", "1ч 55м", "9", 17.4, 45, "84%", "35 дн.", "5.2 млн ₽", 78],
];

const qualityRows = [
  {
    name: "Дмитрий Соколов",
    score: 84,
    className: "is-green",
    calls: 47,
    metrics: [
      ["Выявление потребности", 82, "is-green"],
      ["Работа с возражениями", 78, "is-orange"],
      ["Фиксация следующего шага", 94, "is-green"],
      ["Удержание разговора", 80, "is-green"],
    ],
  },
  {
    name: "Екатерина Новикова",
    score: 74,
    className: "is-orange",
    calls: 38,
    metrics: [
      ["Выявление потребности", 74, "is-orange"],
      ["Работа с возражениями", 68, "is-orange"],
      ["Фиксация следующего шага", 81, "is-green"],
      ["Удержание разговора", 72, "is-orange"],
    ],
  },
  {
    name: "Павел Волков",
    score: 64,
    className: "is-red",
    calls: 29,
    metrics: [
      ["Выявление потребности", 62, "is-orange"],
      ["Работа с возражениями", 58, "is-orange"],
      ["Фиксация следующего шага", 70, "is-orange"],
      ["Удержание разговора", 64, "is-orange"],
    ],
  },
  {
    name: "Игорь Лебедев",
    score: 90,
    className: "is-green",
    calls: 52,
    metrics: [
      ["Выявление потребности", 91, "is-green"],
      ["Работа с возражениями", 87, "is-green"],
      ["Фиксация следующего шага", 95, "is-green"],
      ["Удержание разговора", 90, "is-green"],
    ],
  },
];

const renderNav = () => {
  const nav = document.querySelector("#sidebar-nav");
  nav.innerHTML = navItems
    .map(
      (item) => `
        <button class="sidebar-link ${state.page === item.id ? "is-active" : ""}" data-nav="${item.id}" type="button">
          <span class="sidebar-link__left">
            ${icon(item.icon, state.page === item.id, "sidebar-link__icon")}
            <span class="sidebar-link__label">${item.label}</span>
          </span>
          ${item.count ? `<span class="sidebar-link__count">${item.count}</span>` : ""}
        </button>
      `,
    )
    .join("");
};

const filteredRiskRows = () =>
  state.riskSubtab === "all" ? riskRows : riskRows.filter((row) => row.tabs.includes(state.riskSubtab));

const renderToday = () => `
  <section class="page today-page">
    <div class="today-layout">
      <section class="today-content">
        <section class="today-metrics">
          ${todayMetrics
            .map(
              ([title, value, iconName]) => `
                <article class="today-metric panel panel--soft">
                  <div class="today-metric__head">
                    <div class="today-metric__title">${title}</div>
                    <img class="today-metric__icon" src="/Users/vana/Documents/design-app/assets/symbols/${iconName}" alt="" />
                  </div>
                  <div class="today-metric__value">${value}</div>
                </article>
              `,
            )
            .join("")}
        </section>

        <section class="today-section">
          <h2 class="today-section__title">VIP Клиенты</h2>
          <div class="today-vip-stack">
            ${todayVipClients
              .map(
                (client) => `
                  <article class="today-vip-card panel panel--soft">
                    <div class="today-vip-card__inner">
                      <div>
                        <div class="today-vip-card__title-row">
                          <div class="today-vip-card__company">${client.company}</div>
                          <div class="today-risk-chip ${client.riskClass}">
                            <img class="today-risk-chip__icon" src="/Users/vana/Documents/design-app/assets/symbols/flag.svg" alt="" />
                            <span>${client.risk}</span>
                          </div>
                        </div>
                        <div class="today-vip-divider"></div>
                        <div class="today-vip-card__description">${client.description}</div>
                      </div>
                      <div>
                        <div class="today-vip-card__manager-label">Менеджер</div>
                        <div class="today-vip-divider"></div>
                        <div class="today-vip-card__manager-name">${client.manager}</div>
                      </div>
                    </div>
                    <button class="today-vip-button" type="button">Смотреть</button>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="today-section today-section--priority">
          <h2 class="today-section__title">Приоритетные сделки</h2>
          <div class="today-priority-blank panel panel--soft" aria-hidden="true"></div>
        </section>
      </section>
    </div>
  </section>
`;

const renderRisks = () => `
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Риски</h1>
        <div class="page-subtitle">Зависшие сделки и клиенты в зоне риска</div>
      </div>
      <div class="pill pill--danger">⚠ 7 активных рисков</div>
    </div>

    <div class="filters-row">
      <span class="meta-note">Фильтры:</span>
      <select class="select" aria-label="Менеджер">
        <option>Все менеджеры</option>
      </select>
      <span class="chip">VIP</span>
    </div>

    <section class="panel table-card risks-table">
      <div class="subtabs">
        ${riskTabs
          .map(
            ([id, label, count]) => `
              <button class="subtab ${state.riskSubtab === id ? "is-active" : ""}" data-risk-tab="${id}" type="button">
                ${label} <span class="badge">${count}</span>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="table-header">
        <div>Клиент</div>
        <div>Менеджер</div>
        <div>Стадия</div>
        <div>Без движения</div>
        <div>Причина риска</div>
        <div>Риск</div>
        <div>Настроение</div>
        <div>AI действие</div>
        <div></div>
      </div>

      ${filteredRiskRows()
        .map(
          (row) => `
            <div class="table-row ${row.highlight ? "is-highlighted" : ""}">
              <div class="table-main">
                <strong>${row.client}</strong>
                <div class="table-subtext">${row.vip ? `<span class="tag tag--vip">VIP</span>` : ""}</div>
              </div>
              <div class="table-main">${row.manager}</div>
              <div><span class="tag tag--stage">${row.stage}</span></div>
              <div class="table-main" style="color:${row.silentClass};">${row.silent}</div>
              <div class="table-subtext">${row.reason}</div>
              <div><span class="tag ${row.riskClass}">${row.risk}</span></div>
              <div><span class="tag ${row.moodClass}">${row.mood}</span></div>
              <div class="table-subtext"><span class="bolt">⚡</span> ${row.action}</div>
              <div>${row.highlight ? `<button class="secondary-button" type="button">Открыть</button>` : ""}</div>
            </div>
          `,
        )
        .join("")}
    </section>
  </section>
`;

const renderSearch = () => `
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI Поиск</h1>
        <div class="page-subtitle">Поиск по расчётам, КП, техдокументам и прошлым заказам</div>
      </div>
    </div>

    <section class="panel search-hero">
      <div class="search-bar">
        <input class="search-input" type="text" value="" placeholder="Найти расчёт, КП, техданные, прошлый заказ, шаблон..." />
        <button class="primary-button" type="button">✧ AI Поиск</button>
      </div>
      <div class="toolbar">
        <span class="filter-chip is-active">Все типы</span>
        <span class="filter-chip">Расчёты</span>
        <span class="filter-chip">Техдокументы</span>
        <span class="filter-chip">Прошлые заказы</span>
        <span class="filter-chip">Шаблоны</span>
        <span class="filter-chip">КП</span>
      </div>
    </section>

    <div class="search-grid">
      <section class="panel list-card">
        <h2 class="list-card__title">🕘 Часто используемые</h2>
        <div class="resource-list">
          ${[
            ["Прайс-лист 2026 (актуальный)", "15 янв. 2026 г."],
            ["Шаблон КП: Гофроупаковка", "20 нояб. 2025 г."],
            ["Технологическая карта флексопечати", "5 сент. 2025 г."],
            ["Условия работы с новыми клиентами", "10 февр. 2026 г."],
          ]
            .map(
              ([title, date]) => `
                <div class="resource-item">
                  <div class="resource-item__main">
                    <div class="meta-note">📄</div>
                    <div>
                      <div class="resource-item__title">${title}</div>
                      <div class="list-meta">${date}</div>
                    </div>
                  </div>
                  <div class="meta-note">↗</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="panel list-card">
        <h2 class="list-card__title">✧ Примеры запросов</h2>
        <div class="example-list">
          ${[
            "Расчёт гофроящика B2 для ТехноПак",
            "Прошлый заказ мешков 25кг",
            "Шаблон КП для производства",
            "Влагостойкий картон ГОСТ",
            "Флексопечать крафт пакеты",
          ]
            .map(
              (text) => `
                <div class="example-item">
                  <div class="example-item__main">
                    <div class="meta-note">⌕</div>
                    <a class="example-link" href="#">${text}</a>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>
    </div>
  </section>
`;

const renderLeads = () => `
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Lead Generator</h1>
        <div class="page-subtitle">Топ-5 компаний для холодного контакта сегодня</div>
      </div>
    </div>

    <div class="lead-toolbar">
      <div class="time-pill">◔ 9 апр., 14:39</div>
      <button class="small-button" type="button">⟳ Обновить</button>
    </div>

    <section class="empty-state">
      <div class="empty-state__inner">
        <div class="empty-icon">✧</div>
        <div class="empty-state__title">Нет сгенерированных лидов</div>
        <div class="empty-state__text">Нажмите «Обновить», чтобы запустить генерацию</div>
      </div>
    </section>
  </section>
`;

const lineChart = (color, points) => `
  <svg class="chart-svg" viewBox="0 0 560 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#E6EDF8" stroke-dasharray="4 4">
      <line x1="54" y1="34" x2="520" y2="34"/>
      <line x1="54" y1="86" x2="520" y2="86"/>
      <line x1="54" y1="138" x2="520" y2="138"/>
      <line x1="54" y1="190" x2="520" y2="190"/>
      <line x1="54" y1="242" x2="520" y2="242"/>
      <line x1="54" y1="34" x2="54" y2="242"/>
      <line x1="132" y1="34" x2="132" y2="242"/>
      <line x1="210" y1="34" x2="210" y2="242"/>
      <line x1="288" y1="34" x2="288" y2="242"/>
      <line x1="366" y1="34" x2="366" y2="242"/>
      <line x1="444" y1="34" x2="444" y2="242"/>
      <line x1="522" y1="34" x2="522" y2="242"/>
    </g>
    <path d="${points}" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${[
      [54, 116],
      [132, 96],
      [210, 88],
      [288, 104],
      [366, 76],
      [444, 58],
      [522, 66],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${color}" stroke-width="3"/>`)
      .join("")}
    <g fill="#90A0BE" font-size="11">
      <text x="24" y="244">0</text>
      <text x="22" y="192">6</text>
      <text x="18" y="140">12</text>
      <text x="18" y="88">18</text>
      <text x="12" y="38">24</text>
      <text x="36" y="264">Окт 2025</text>
      <text x="116" y="264">Ноя 2025</text>
      <text x="194" y="264">Дек 2025</text>
      <text x="270" y="264">Янв 2026</text>
      <text x="348" y="264">Фев 2026</text>
      <text x="426" y="264">Мар 2026</text>
      <text x="504" y="264">Апр 2026</text>
    </g>
  </svg>
`;

const renderAnalyticsKpi = () => `
  <div class="table-header kpi-table">
    <div>Менеджер</div>
    <div>Время ответа</div>
    <div>Активных сделок</div>
    <div>Конверсия</div>
    <div>Нагрузка</div>
    <div>Follow-up</div>
    <div>Цикл сделки</div>
    <div>Выручка</div>
    <div>AI score</div>
  </div>
  ${kpiRows
    .map(
      ([initials, name, response, deals, conversion, load, followup, cycle, revenue, score], index) => `
        <div class="table-row ${index === 0 ? "is-highlighted" : ""} kpi-table">
          <div class="table-main">
            <strong>${initials} ${name}</strong>
          </div>
          <div class="table-main" style="color:${response.includes("3ч") ? "var(--red)" : response.includes("2ч") ? "var(--orange)" : "var(--green)"};">${response}</div>
          <div class="table-main">${deals}</div>
          <div class="row-actions">
            <div class="progress"><span style="width:${conversion}%"></span></div>
            <div class="table-main">${conversion}%</div>
          </div>
          <div class="row-actions">
            <div class="progress ${load > 85 ? "is-red" : load > 60 ? "is-green" : "is-green"}"><span style="width:${load}%"></span></div>
            <div class="table-main">${load}%</div>
          </div>
          <div class="table-main" style="color:${followup.startsWith("9") ? "var(--green)" : followup.startsWith("6") ? "var(--red)" : "var(--orange)"};">${followup}</div>
          <div class="table-main">${cycle}</div>
          <div class="table-main"><strong>${revenue}</strong></div>
          <div><span class="score-badge ${score >= 80 ? "is-green" : score >= 70 ? "is-orange" : "is-red"}">${score}</span></div>
        </div>
      `,
    )
    .join("")}
`;

const renderAnalyticsDynamics = () => `
  <div class="chart-grid">
    <article class="chart-card">
      <h3 class="chart-card__title">Конверсия %</h3>
      ${lineChart("#2F6AF5", "M54 116C80 108 106 100 132 96C158 92 184 88 210 88C236 88 262 108 288 104C314 100 340 84 366 76C392 68 418 58 444 58C470 58 496 62 522 66")}
    </article>
    <article class="chart-card">
      <h3 class="chart-card__title">Время ответа (мин)</h3>
      ${lineChart("#7F4BFF", "M54 62C80 66 106 70 132 74C158 78 184 92 210 94C236 96 262 84 288 82C314 80 340 90 366 102C392 114 418 120 444 126C470 132 496 132 522 132")}
    </article>
    <article class="chart-card">
      <h3 class="chart-card__title">Сделки: закрыто / потеряно</h3>
      <svg class="chart-svg" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#E6EDF8" stroke-dasharray="4 4">
          <line x1="54" y1="34" x2="520" y2="34"/>
          <line x1="54" y1="86" x2="520" y2="86"/>
          <line x1="54" y1="138" x2="520" y2="138"/>
          <line x1="54" y1="190" x2="520" y2="190"/>
          <line x1="54" y1="242" x2="520" y2="242"/>
        </g>
        ${[
          [62, 160, 8, 12],
          [132, 144, 11, 10],
          [202, 126, 14, 9],
          [272, 152, 10, 11],
          [342, 118, 15, 8],
          [412, 88, 18, 6],
          [482, 126, 14, 7],
        ]
          .map(
            ([x, greenY, greenValue, redValue]) => `
              <rect x="${x}" y="${greenY}" width="28" height="${242 - greenY}" rx="4" fill="#1DAC4C"/>
              <rect x="${x + 32}" y="${242 - redValue * 9}" width="28" height="${redValue * 9}" rx="4" fill="#FF9EA0"/>
            `,
          )
          .join("")}
        <g fill="#90A0BE" font-size="11">
          <text x="32" y="264">Окт 2025</text>
          <text x="102" y="264">Ноя 2025</text>
          <text x="172" y="264">Дек 2025</text>
          <text x="242" y="264">Янв 2026</text>
          <text x="312" y="264">Фев 2026</text>
          <text x="382" y="264">Мар 2026</text>
          <text x="452" y="264">Апр 2026</text>
        </g>
      </svg>
    </article>
    <article class="chart-card">
      <h3 class="chart-card__title">Качество звонков</h3>
      ${lineChart("#E57900", "M54 176C80 174 106 170 132 168C158 166 184 160 210 160C236 160 262 170 288 172C314 174 340 154 366 148C392 142 418 138 444 134C470 130 496 126 522 124")}
    </article>
  </div>
`;

const renderAnalyticsQuality = () => `
  <div class="quality-layout">
    <div class="quality-stack">
      ${qualityRows
        .map(
          (row) => `
            <article class="quality-card">
              <div class="quality-card__head">
                <div class="quality-card__title">${row.name}</div>
                <span class="score-badge ${row.className}">${row.score}</span>
              </div>
              <div class="score-bars">
                ${row.metrics
                  .map(
                    ([label, value, className]) => `
                      <div class="score-row">
                        <div class="table-subtext">${label}</div>
                        <div class="row-actions" style="min-width:170px; justify-content:flex-end;">
                          <div class="progress ${className}" style="width:118px;"><span style="width:${value}%"></span></div>
                          <div class="table-main">${value}</div>
                        </div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
              <div class="table-subtext" style="margin-top:14px;">${row.calls} звонков проанализировано</div>
            </article>
          `,
        )
        .join("")}
    </div>

    <article class="radar-card">
      <h3 class="section-title" style="margin-bottom:20px;">Средний балл (радар)</h3>
      <svg class="chart-svg" viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(280 210)">
          <polygon points="0,-130 130,0 0,130 -130,0" fill="none" stroke="#E6EDF8"/>
          <polygon points="0,-100 100,0 0,100 -100,0" fill="none" stroke="#E6EDF8"/>
          <polygon points="0,-70 70,0 0,70 -70,0" fill="none" stroke="#E6EDF8"/>
          <polygon points="0,-40 40,0 0,40 -40,0" fill="none" stroke="#E6EDF8"/>
          <line x1="0" y1="-130" x2="0" y2="130" stroke="#E6EDF8"/>
          <line x1="-130" y1="0" x2="130" y2="0" stroke="#E6EDF8"/>
          <polygon points="0,-95 86,0 0,106 -90,0" fill="rgba(47,106,245,0.06)" stroke="#2F6AF5" stroke-width="2"/>
          <polygon points="0,-75 72,0 0,90 -78,0" fill="rgba(239,63,58,0.03)" stroke="#EF3F3A" stroke-width="2"/>
          <polygon points="0,-88 76,0 0,100 -84,0" fill="rgba(29,172,76,0.03)" stroke="#1DAC4C" stroke-width="2"/>
          <polygon points="0,-58 60,0 0,76 -66,0" fill="rgba(229,132,18,0.03)" stroke="#E58412" stroke-width="2"/>
          <text x="-70" y="-146" fill="#90A0BE" font-size="14">Выявление потребности</text>
          <text x="135" y="0" fill="#90A0BE" font-size="14">Работа с возражениями</text>
          <text x="-48" y="152" fill="#90A0BE" font-size="14">Фиксация шага</text>
          <text x="-210" y="0" fill="#90A0BE" font-size="14">Удержание разговора</text>
        </g>
      </svg>
    </article>
  </div>
`;

const renderAnalyticsLoss = () => `
  <div class="loss-layout">
    <article class="chart-card">
      <h3 class="section-title" style="margin-bottom:22px;">Потери по стадиям воронки</h3>
      <div class="score-bars">
        ${[
          ["Новая", 25, "#5A84E8", "3 сделок", "420 тыс ₽", "3"],
          ["Квалификация", 42, "#69C184", "5 сделок", "1.8 млн ₽", "5"],
          ["КП отправлено", 100, "#EAA35C", "12 сделок", "8.4 млн ₽", "12"],
          ["Переговоры", 67, "#EB6B67", "8 сделок", "14.2 млн ₽", "8"],
        ]
          .map(
            ([label, width, color, deals, money, count]) => `
              <div>
                <div class="loss-row">
                  <div class="table-main">${label}</div>
                  <div class="row-actions">
                    <span class="table-main" style="color:var(--red);">${deals}</span>
                    <span class="table-subtext">${money}</span>
                  </div>
                </div>
                <div class="progress" style="height:32px; margin-top:10px;">
                  <span style="width:${width}%; background:${color}; display:flex; align-items:center; justify-content:flex-end; padding-right:10px; color:#fff; font-size:12px;">${count}</span>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
    <article class="pie-card">
      <div>
        <h3 class="section-title" style="margin-bottom:18px;">Причины потерь</h3>
        <svg class="chart-svg" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
          <circle cx="140" cy="140" r="84" fill="#fff"/>
          <path d="M140 140L140 56A84 84 0 0 1 211 96Z" fill="#2F62DB"/>
          <path d="M140 140L211 96A84 84 0 0 1 224 157Z" fill="#4E86FF"/>
          <path d="M140 140L224 157A84 84 0 0 1 195 212Z" fill="#7F4BFF"/>
          <path d="M140 140L195 212A84 84 0 0 1 140 224Z" fill="#EF3F3A"/>
          <path d="M140 140L140 224A84 84 0 0 1 67 182Z" fill="#E58412"/>
          <path d="M140 140L67 182A84 84 0 0 1 104 64Z" fill="#1DAC4C"/>
          <g fill="#2F62DB" font-size="14"><text x="210" y="58">32%</text></g>
          <g fill="#4E86FF" font-size="14"><text x="238" y="148">4%</text></g>
          <g fill="#7F4BFF" font-size="14"><text x="228" y="184">7%</text></g>
          <g fill="#EF3F3A" font-size="14"><text x="180" y="236">14%</text></g>
          <g fill="#E58412" font-size="14"><text x="42" y="228">18%</text></g>
          <g fill="#1DAC4C" font-size="14"><text x="2" y="114">25%</text></g>
        </svg>
      </div>
      <div class="legend">
        ${[
          ["#2F62DB", "Долгий расчёт / потеря скорости", 9],
          ["#1DAC4C", "Цена выше конкурента", 7],
          ["#E58412", "Задержка ответа менеджера", 5],
          ["#EF3F3A", "Потеря контакта / клиент замолчал", 4],
          ["#7F4BFF", "Изменение потребности у клиента", 2],
          ["#4E86FF", "Прочие причины", 1],
        ]
          .map(
            ([color, label, value]) => `
              <div class="legend-item">
                <div class="legend-item__left">
                  <span class="legend-dot" style="background:${color};"></span>
                  <span>${label}</span>
                </div>
                <strong>${value}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
  </div>
  <div class="insights-box">
    <h3 class="subsection-title">AI Инсайты</h3>
    <p>. Главная причина потерь — долгий расчёт (32%). Введите KPI «расчёт за 48 часов» для снижения на ~15%</p>
    <p>. Большинство потерь происходит на стадии «КП отправлено». Рекомендуется автоматический follow-up через 5 дней</p>
    <p>. Павел Волков имеет самый длинный цикл ответа (180 мин) — рекомендуется коучинг по работе с входящими</p>
  </div>
`;

const renderAnalytics = () => `
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Аналитика</h1>
        <div class="page-subtitle">Executive Dashboard · Q1 2026</div>
      </div>
      <div class="segmented">
        <button class="segmented__button" type="button">Неделя</button>
        <button class="segmented__button" type="button">Месяц</button>
        <button class="segmented__button is-active" type="button">Квартал</button>
        <button class="segmented__button" type="button">Год</button>
      </div>
    </div>

    <div class="analytics-cards">
      ${analyticsCards
        .map(
          ([label, value, className]) => `
            <article class="analytics-card panel panel--soft">
              <div class="analytics-card__label">${label}</div>
              <div class="analytics-card__value ${className}">${value}</div>
            </article>
          `,
        )
        .join("")}
    </div>

    <section class="panel analytics-panel">
      <div class="subtabs">
        ${[
          ["kpi", "KPI сотрудников"],
          ["dynamics", "Динамика"],
          ["quality", "Качество коммуникаций"],
          ["loss", "Причины потерь"],
        ]
          .map(
            ([id, label]) => `
              <button class="subtab ${state.analyticsSubtab === id ? "is-active" : ""}" data-analytics-tab="${id}" type="button">${label}</button>
            `,
          )
          .join("")}
      </div>
      ${
        state.analyticsSubtab === "kpi"
          ? renderAnalyticsKpi()
          : state.analyticsSubtab === "dynamics"
            ? renderAnalyticsDynamics()
            : state.analyticsSubtab === "quality"
              ? renderAnalyticsQuality()
              : renderAnalyticsLoss()
      }
    </section>
  </section>
`;

const views = {
  today: renderToday,
  risks: renderRisks,
  search: renderSearch,
  leads: renderLeads,
  analytics: renderAnalytics,
};

const render = () => {
  renderNav();
  document.querySelector("#workspace").innerHTML = views[state.page]();

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.nav;
      render();
    });
  });

  document.querySelectorAll("[data-risk-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.riskSubtab = button.dataset.riskTab;
      render();
    });
  });

  document.querySelectorAll("[data-analytics-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.analyticsSubtab = button.dataset.analyticsTab;
      render();
    });
  });
};

render();
