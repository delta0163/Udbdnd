
"use strict";

const $ = id => document.getElementById(id);

const titleScreen = $("titleScreen");
const storyScreen = $("storyScreen");
const scene = $("scene");
const sceneName = $("sceneName");
const characters = $("characters");
const speaker = $("speaker");
const dialogue = $("dialogue");
const choices = $("choices");
const nextBtn = $("nextBtn");
const continueBtn = $("continueBtn");
const qteTimer = $("qteTimer");

const SAVE_KEY = "broken_destinies_save_v1";
const AGGRESSION_LIMIT = 3;

let state = {
  node: "prologue",
  aggression: 0,
  ended: false
};

let waiting = false;
let qteTimeout = null;
let qteInterval = null;
let qteActive = false;
let qteDeadline = 0;
let qteRemaining = 0;
let qteResolve = null;

const backgrounds = {
  black: ["#08080c", "ЧЁРНЫЙ ЭКРАН"],
  fire: ["#843522", "ПОЖАР"],
  burned_body: ["#171717", "НЕИЗВЕСТНОЕ МЕСТО"],
  laboratory: ["#343947", "ЛАБОРАТОРИЯ"],
  alley: ["#29252f", "ПЕРЕУЛОК"],
  home: ["#65584f", "ДОМ"],
  delta_room: ["#35343d", "КОМНАТА ДЕЛЬТЫ"],
  kitchen: ["#75685b", "КУХНЯ"],
  park: ["#416344", "ПАРК"],
  waterfront: ["#365a70", "НАБЕРЕЖНАЯ"],
  wrecked_home: ["#33272c", "РАЗГРОМЛЕННЫЙ ДОМ"],
  void: ["#090909", "ПУСТОТА"]
};

const spriteClasses = {
  "Дельта": "delta",
  "Зара": "zara",
  "Джин": "jin",
  "Немка": "nemka",
  "Адам": "adam",
  "Джейк": "jake",
  "Мафия": "mafia",
  "Незнакомец": "stranger"
};

const story = {
  prologue: {
    bg: "fire",
    text: "Вспышка огня.",
    next: "flash_body"
  },
  flash_body: {
    bg: "burned_body",
    text: "Обгоревшее тело. Невозможно понять, кому оно принадлежало.",
    next: "flash_lab"
  },
  flash_lab: {
    bg: "laboratory",
    text: "Лаборатория. Что-то пошло не так.",
    next: "alley_start"
  },
  alley_start: {
    bg: "alley",
    who: "Дельта",
    sprite: "neutral",
    text: "Дельта возвращался домой после тяжёлой ночной смены.",
    next: "mafia_1"
  },
  mafia_1: {
    bg: "alley",
    who: "Мафия",
    sprite: "neutral",
    text: "Стоять, ты кто такой?",
    next: "mafia_2"
  },
  mafia_2: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "Я тут уже пару лет живу, мужики. Давайте вот без этой херни.",
    next: "mafia_3"
  },
  mafia_3: {
    bg: "alley",
    who: "Мафия",
    text: "А ты нам не груби. Молоко на губах не обсохло. Документы покажи.",
    next: "mafia_4"
  },
  mafia_4: {
    bg: "alley",
    who: "Дельта",
    text: "Чуваки, можно как-то без них?",
    next: "mafia_choice"
  },
  mafia_choice: {
    bg: "alley",
    text: "Мафия перегородила дорогу.",
    choices: [
      {
        text: "Предложить 100 кредитов",
        action: () => {
          state.aggression++;
          go("mafia_bribe");
        }
      },
      {
        text: "Ударить первым",
        action: () => {
          state.aggression++;
          go("mafia_punch");
        }
      }
    ]
  },
  mafia_bribe: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "Давай я вам 100 кредитов, а вы отстанете от меня.",
    next: "mafia_bribe_2"
  },
  mafia_bribe_2: {
    bg: "alley",
    who: "Мафия",
    text: "Ты нам взятку предлагаешь?!",
    next: "mafia_punch"
  },
  mafia_punch: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "Да вы охренели?! Дельта ударил мафиози и бросился бежать.",
    next: "home_arrival"
  },
  home_arrival: {
    bg: "home",
    who: "Дельта",
    text: "Я дома!",
    next: "zara_greeting"
  },
  zara_greeting: {
    bg: "home",
    who: "Зара",
    sprite: "angry",
    text: "Явился. Ты где так долго шлялся, ебень?",
    next: "delta_reply"
  },
  delta_reply: {
    bg: "home",
    who: "Дельта",
    sprite: "angry",
    text: "Не твоё дело.",
    next: "jin_intervenes"
  },
  jin_intervenes: {
    bg: "home",
    who: "Джин",
    sprite: "sad",
    text: "Мама, дядя Дельта, не ссорьтесь, пожалуйста.",
    next: "zara_threat"
  },
  zara_threat: {
    bg: "home",
    who: "Зара",
    sprite: "angry",
    text: "Если бы не ребёнок, я бы тебя на месте убила.",
    next: "night"
  },
  night: {
    bg: "delta_room",
    who: "Дельта",
    text: "Дельта молча ушёл в свою комнату и лёг на кровать.",
    next: "nemka"
  },
  nemka: {
    bg: "void",
    who: "Немка",
    sprite: "silent",
    text: "...",
    next: "night_shot"
  },
  night_shot: {
    bg: "void",
    who: "Дельта",
    sprite: "scared",
    text: "БЛЯТЬ! Дельта резко вскочил и начал искать таблетки.",
    next: "pill_choice"
  },
  pill_choice: {
    bg: "delta_room",
    text: "Где искать таблетки?",
    choices: [
      { text: "Прикроватная тумбочка", action: () => go("pills_missing") },
      { text: "Стол", action: () => go("pills_missing") },
      { text: "Шкаф", action: () => go("pills_missing") },
      { text: "Ящики", action: () => go("pills_missing") }
    ]
  },
  pills_missing: {
    bg: "delta_room",
    text: "Таблеток нигде не оказалось.",
    next: "nemka_jump"
  },
  nemka_jump: {
    bg: "void",
    who: "Немка",
    sprite: "silent",
    text: "... Немка внезапно оказалась совсем рядом.",
    next: "sleep"
  },
  sleep: {
    bg: "black",
    text: "Дельта потерял равновесие. Позже он всё-таки уснул.",
    next: "morning"
  },
  morning: {
    bg: "delta_room",
    who: "Дельта",
    text: "Блять, сколько сейчас часов?",
    next: "jin_invites"
  },
  jin_invites: {
    bg: "delta_room",
    who: "Джин",
    sprite: "happy",
    text: "Дядя Дельта, идём гулять!",
    next: "morning_choice"
  },
  morning_choice: {
    bg: "delta_room",
    text: "Как ответить Джину?",
    choices: [
      {
        text: "Шлёпнуть его по затылку",
        action: () => {
          state.aggression++;
          go("jin_hit");
        }
      },
      {
        text: "Ответить спокойно",
        action: () => go("jin_kind")
      }
    ]
  },
  jin_hit: {
    bg: "kitchen",
    who: "Джин",
    sprite: "sad",
    text: "МАМА!",
    next: "zara_angry_morning"
  },
  zara_angry_morning: {
    bg: "kitchen",
    who: "Зара",
    sprite: "angry",
    text: "НАХУЙ ТЫ МОЕГО СЫНА УДАРИЛ?! В Дельту летит миска с хлопьями.",
    next: "delta_morning_angry"
  },
  delta_morning_angry: {
    bg: "kitchen",
    who: "Дельта",
    sprite: "angry",
    text: "Та не узнай приебаться ко мне с утра!",
    next: "laptop"
  },
  jin_kind: {
    bg: "kitchen",
    who: "Дельта",
    text: "Малой, иди к своей матери и дай я приведу себя в порядок. Потом поговорим.",
    next: "laptop"
  },
  laptop: {
    bg: "home",
    who: "Дельта",
    text: "На ноутбуке обнаружился архив материалов о мэре Адаме. На фотографиях его лицо скрывала маска.",
    next: "main_choice"
  },
  main_choice: {
    bg: "home",
    text: "Куда мне пойти?",
    choices: [
      { text: "Пойти в парк с Зарой и Джином", action: () => go("park_start") },
      { text: "Пойти на набережную с Джейком", action: () => go("waterfront_start") },
      { text: "Остаться дома", action: () => go("home_alone") }
    ]
  },

  // ПАРК
  park_start: {
    bg: "park",
    who: "Зара",
    sprite: "neutral",
    text: "Хоть раз в нормальное место привёл.",
    next: "park_delta"
  },
  park_delta: {
    bg: "park",
    who: "Дельта",
    sprite: "angry",
    text: "Боже, Зара, довольна? Ого.",
    next: "park_zara"
  },
  park_zara: {
    bg: "park",
    who: "Зара",
    sprite: "angry",
    text: "Заткнись.",
    next: "park_mafia"
  },
  park_mafia: {
    bg: "park",
    who: "Мафия",
    text: "Ну шо ты, кучерявый? Нашли мы тебя.",
    next: "park_choice"
  },
  park_choice: {
    bg: "park",
    who: "Дельта",
    sprite: "scared",
    text: "Боже...",
    choices: [
      {
        text: "Попытаться драться",
        action: () => {
          state.aggression++;
          go("park_fight");
        }
      },
      { text: "Схватить Зару и Джина и бежать", action: () => go("park_escape") }
    ]
  },
  park_fight: {
    bg: "park",
    who: "Дельта",
    sprite: "angry",
    text: "Дельта бросился на мафиози, но противников оказалось слишком много.",
    next: "park_death"
  },
  park_death: {
    bg: "black",
    text: "КОНЦОВКА: ПОБЕГ НЕ УДАЛСЯ.",
    next: "ending_check"
  },
  park_escape: {
    bg: "park",
    who: "Дельта",
    sprite: "hurt",
    text: "БЕЖИМ! Раздались выстрелы. Одна из пуль задела плечо Дельты.",
    next: "park_zara_question"
  },
  park_zara_question: {
    bg: "alley",
    who: "Зара",
    sprite: "angry",
    text: "КУДА ТЫ НАС ТАЩИШЬ?! КТО ЭТО ВООБЩЕ?!",
    next: "park_delta_shout"
  },
  park_delta_shout: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "ПОТОМ РАССКАЖУ!",
    next: "park_nemka_1"
  },
  park_nemka_1: {
    bg: "void",
    who: "Немка",
    sprite: "silent",
    text: "... Она преградила дорогу.",
    next: "park_qte_1"
  },
  park_qte_1: {
    bg: "alley",
    text: "Немка блокирует путь! Успей выбрать направление.",
    qte: true,
    choices: [
      { text: "НАЛЕВО", action: () => go("park_nemka_2") },
      { text: "НАПРАВО", action: () => go("park_death") }
    ]
  },
  park_nemka_2: {
    bg: "void",
    who: "Немка",
    sprite: "silent",
    text: "... Немка снова появилась перед Дельтой.",
    next: "park_qte_2"
  },
  park_qte_2: {
    bg: "alley",
    text: "Она перекрывает путь! Успей выбрать направление.",
    qte: true,
    choices: [
      { text: "НАЛЕВО", action: () => go("park_death") },
      { text: "НАПРАВО", action: () => go("park_aftermath") }
    ]
  },
  park_aftermath: {
    bg: "home",
    who: "Дельта",
    sprite: "hurt",
    text: "Дельта отправил Зару и Джина домой, а сам разобрался с двумя мафиози.",
    next: "park_computer"
  },
  park_computer: {
    bg: "wrecked_home",
    who: "Дельта",
    sprite: "angry",
    text: "Ноутбук разбит. Флешка с компроматом исчезла. Блять, блять, бля!",
    next: "park_jake"
  },
  park_jake: {
    bg: "wrecked_home",
    who: "Джейк",
    sprite: "worried",
    text: "Дельта... Джейк связан и избит.",
    next: "ending_check"
  },

  // НАБЕРЕЖНАЯ
  waterfront_start: {
    bg: "waterfront",
    who: "Дельта",
    text: "Джейк, а ты тоже заметил того парня? Он идёт за нами всё время?",
    next: "jake_answer"
  },
  jake_answer: {
    bg: "waterfront",
    who: "Джейк",
    sprite: "worried",
    text: "Да... Чёт стремный он.",
    next: "adam_shoots"
  },
  adam_shoots: {
    bg: "waterfront",
    who: "Адам",
    sprite: "masked",
    text: "Адам приблизился. Раздался выстрел, и пуля задела руку Дельты.",
    next: "waterfront_choice"
  },
  waterfront_choice: {
    bg: "waterfront",
    text: "Адам бросился бежать. Что делать?",
    choices: [
      { text: "Погнаться за Адамом", action: () => go("chase_adam") },
      { text: "Спрятаться вместе с Джейком", action: () => go("hide_adam") }
    ]
  },
  chase_adam: {
    bg: "waterfront",
    who: "Джейк",
    sprite: "worried",
    text: "ДЕЛЬТА, НЕ СТОИТ!",
    next: "delta_chases"
  },
  delta_chases: {
    bg: "waterfront",
    who: "Дельта",
    sprite: "angry",
    text: "Я его достану!",
    next: "jake_knocks"
  },
  jake_knocks: {
    bg: "black",
    who: "Джейк",
    text: "Джейк остановил Дельту ударом, чтобы тот не бросился под пулю.",
    next: "chase_aftermath"
  },
  chase_aftermath: {
    bg: "wrecked_home",
    who: "Дельта",
    sprite: "hurt",
    text: "Дельта пришёл в себя дома. Компьютер разбит, флешка пропала. Джейк рядом и не пострадал.",
    next: "ending_check"
  },
  hide_adam: {
    bg: "waterfront",
    who: "Незнакомец",
    sprite: "masked",
    text: "Адам встретился с незнакомцем. Тот показал фотографию изогнутого меча, хранящегося в музее.",
    next: "sword_talk"
  },
  sword_talk: {
    bg: "waterfront",
    who: "Джейк",
    sprite: "worried",
    text: "Что там на фото? Я ничего не вижу...",
    next: "delta_sword"
  },
  delta_sword: {
    bg: "waterfront",
    who: "Дельта",
    text: "Меч... Изогнутый?",
    next: "hide_aftermath"
  },
  hide_aftermath: {
    bg: "wrecked_home",
    who: "Дельта",
    sprite: "angry",
    text: "Дома разгром. Компьютер разбит, флешка исчезла. ЧЕРТ! ВСЁ ПРОПАЛО! Джейк не пострадал.",
    next: "ending_check"
  },

  // ОСТАТЬСЯ ДОМА
  home_alone: {
    bg: "home",
    text: "Зара и Джин ушли. Дельта остался дома один. В дверь постучали.",
    next: "adam_enters"
  },
  adam_enters: {
    bg: "home",
    who: "Дельта",
    sprite: "scared",
    text: "Ты кто, блять, такой?!",
    next: "adam_reveal"
  },
  adam_reveal: {
    bg: "home",
    who: "Адам",
    sprite: "masked",
    text: "Не узнаёшь меня, пернатый?",
    next: "nemka_appears"
  },
  nemka_appears: {
    bg: "void",
    who: "Немка",
    sprite: "silent",
    text: "...",
    next: "home_qte"
  },
  home_qte: {
    bg: "home",
    who: "Дельта",
    sprite: "hurt",
    text: "Адам ударил Дельту. Быстро нажми кнопку, чтобы ответить!",
    qte: true,
    choices: [
      {
        text: "УДАРИТЬ В ОТВЕТ",
        action: () => go("home_counter")
      },
      {
        text: "НЕ УСПЕТЬ",
        action: () => go("home_knocked")
      }
    ]
  },
  home_counter: {
    bg: "home",
    who: "Дельта",
    sprite: "angry",
    text: "Дельта сумел ответить ударом, но Адам всё равно одолел его.",
    next: "home_knocked"
  },
  home_knocked: {
    bg: "black",
    text: "Дельта потерял сознание. Адам забрал компромат и разгромил дом. Всё остальное осталось за кадром.",
    next: "home_returns"
  },
  home_returns: {
    bg: "wrecked_home",
    who: "Зара",
    sprite: "angry",
    text: "Что здесь произошло?! Зара и Джин вернулись и обнаружили Дельту без сознания.",
    next: "ending_check"
  },

  // КОНЦОВКИ
  ending_check: {
    bg: "black",
    text: "История подходит к концу...",
    next: () => {
      if (state.aggression >= AGGRESSION_LIMIT) {
        go("aggression_ending");
      } else {
        go("normal_ending");
      }
    }
  },
  normal_ending: {
    bg: "black",
    text: "BROKEN DESTINIES\n\nГЛАВА 1 — «КОМПРОМАТ»\n\nКОНЕЦ ГЛАВЫ",
    ending: true
  },
  aggression_ending: {
    bg: "alley",
    who: "Дельта",
    sprite: "hurt",
    text: "Дельта пришёл в себя и понял, что произошло. Он увидел Адама.",
    next: "aggression_outburst"
  },
  aggression_outburst: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "ТЫ... СУКА...",
    next: "aggression_fight"
  },
  aggression_fight: {
    bg: "alley",
    who: "Дельта",
    sprite: "angry",
    text: "Дельта набросился на Адама и избил его. Но за спиной появились мафиози.",
    next: "aggression_knock"
  },
  aggression_knock: {
    bg: "black",
    text: "Один из мафиози ударил Дельту сзади. Он снова потерял сознание.",
    next: "aggression_end"
  },
  aggression_end: {
    bg: "black",
    text: "BROKEN DESTINIES\n\nГЛАВА 1 — «АГРЕССИЯ»\n\nКОНЕЦ ГЛАВЫ",
    ending: true
  }
};


// ============================================================
// ОТРИСОВКА
// ============================================================

function renderScene(node) {
  const bg = backgrounds[node.bg || "black"] || backgrounds.black;

  scene.style.background =
    `linear-gradient(180deg, ${bg[0]}, #09090c)`;

  sceneName.textContent = bg[1];
  characters.innerHTML = "";

  if (node.who) {
    const character = document.createElement("div");
    const role = spriteClasses[node.who] || "delta";

    character.className = `character ${role}`;
    character.textContent =
      node.who.toUpperCase() +
      (node.sprite ? "\n" + node.sprite.toUpperCase() : "");

    characters.appendChild(character);
  }

  speaker.textContent = node.who || "";
  dialogue.textContent = node.text || "";

  choices.innerHTML = "";
  nextBtn.classList.toggle("hidden", !!node.choices);

  if (node.choices) {
    nextBtn.classList.add("hidden");

    node.choices.forEach(option => {
      const button = document.createElement("button");
      button.textContent = option.text;

      button.addEventListener("click", () => {
        if (waiting) return;
        option.action();
      });

      choices.appendChild(button);
    });
  }

  if (node.ending) {
    nextBtn.textContent = "В ГЛАВНОЕ МЕНЮ";
    nextBtn.classList.remove("hidden");
  } else {
    nextBtn.textContent = "ДАЛЬШЕ ▶";
  }
}


// ============================================================
// ПЕРЕХОДЫ
// ============================================================

function go(id) {
  if (typeof id === "function") {
    id();
    return;
  }

  state.node = id;
  waiting = false;

  const node = story[id];

  if (!node) {
    dialogue.textContent = "Ошибка: сцена не найдена — " + id;
    nextBtn.classList.add("hidden");
    return;
  }

  renderScene(node);
  saveGame(false);

  if (node.qte) {
    startQTE(node);
  }
}

function advance() {
  if (waiting) return;

  const node = story[state.node];
  if (!node) return;

  if (node.ending) {
    showTitle();
    return;
  }

  if (node.choices) return;

  if (typeof node.next === "function") {
    node.next();
  } else if (node.next) {
    go(node.next);
  }
}

nextBtn.addEventListener("click", advance);


// ============================================================
// QTE — ТАЙМЕР И УПРАВЛЕНИЕ
// ============================================================

function startQTE(node) {
  waiting = true;
  qteActive = true;
  qteRemaining = 3.0;
  qteDeadline = Date.now() + 3000;

  qteTimer.classList.remove("hidden");

  const buttons = [...choices.querySelectorAll("button")];

  buttons.forEach(button => {
    button.disabled = false;
  });

  function updateTimer() {
    if (!qteActive) return;

    qteRemaining = Math.max(
      0,
      (qteDeadline - Date.now()) / 1000
    );

    qteTimer.textContent = qteRemaining.toFixed(1);

    if (qteRemaining <= 0) {
      finishQTE(node, false);
    }
  }

  qteInterval = setInterval(updateTimer, 50);
  qteTimeout = setTimeout(() => finishQTE(node, false), 3000);

  // Для QTE с ударом первый вариант — успешная реакция.
  // Для направлений первый вариант — налево.
  // Игрок должен нажать вариант до окончания таймера.
}

function finishQTE(node, success) {
  if (!qteActive) return;

  qteActive = false;
  waiting = false;

  clearInterval(qteInterval);
  clearTimeout(qteTimeout);

  qteTimer.classList.add("hidden");

  const buttons = [...choices.querySelectorAll("button")];

  if (!success) {
    if (state.node === "home_qte") {
      go("home_knocked");
    } else if (state.node === "park_qte_1" ||
               state.node === "park_qte_2") {
      go("park_death");
    }
  }
}


// Перехватываем выбор в QTE, чтобы он успел сработать
document.addEventListener("click", event => {
  const button = event.target.closest("#choices button");
  if (!button || !qteActive) return;

  finishQTE(story[state.node], true);
}, true);

document.addEventListener("keydown", event => {
  if (!qteActive) return;

  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    finishQTE(story[state.node], true);
  }
});


// ============================================================
// СОХРАНЕНИЕ
// ============================================================

function saveGame(showMessage = true) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));

    if (showMessage) {
      const oldText = $("saveBtn").textContent;
      $("saveBtn").textContent = "СОХРАНЕНО";

      setTimeout(() => {
        $("saveBtn").textContent = oldText;
      }, 1200);
    }
  } catch (error) {
    if (showMessage) {
      alert("Не удалось сохранить игру в этом браузере.");
    }
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;

    const data = JSON.parse(saved);

    if (!data || !story[data.node]) return false;

    state = data;
    return true;
  } catch (error) {
    return false;
  }
}


// ============================================================
// МЕНЮ
// ============================================================

function showTitle() {
  if (qteActive) {
    qteActive = false;
    clearInterval(qteInterval);
    clearTimeout(qteTimeout);
  }

  waiting = false;
  storyScreen.classList.add("hidden");
  titleScreen.classList.remove("hidden");

  continueBtn.disabled = !localStorage.getItem(SAVE_KEY);
}

function startGame() {
  state = {
    node: "prologue",
    aggression: 0,
    ended: false
  };

  titleScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");

  go("prologue");
}

$("startBtn").addEventListener("click", startGame);

continueBtn.addEventListener("click", () => {
  if (!loadGame()) {
    startGame();
    return;
  }

  titleScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");
  go(state.node);
});

$("saveBtn").addEventListener("click", () => saveGame(true));

$("menuBtn").addEventListener("click", () => {
  if (confirm("Вернуться в меню? Текущий прогресс будет сохранён.")) {
    saveGame(false);
    showTitle();
  }
});

continueBtn.disabled = !localStorage.getItem(SAVE_KEY);
