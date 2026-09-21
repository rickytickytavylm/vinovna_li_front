["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
});
document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });

const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector(".desktop-nav");
const heroVideo = document.querySelector(".hero__video");

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menu.classList.toggle("is-open", !isOpen);
});

if (heroVideo) {
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  heroVideo.src = isMobile
    ? heroVideo.dataset.mobileSrc
    : heroVideo.dataset.desktopSrc;
  heroVideo.poster = isMobile
    ? "media/video/hero-poster-mobile.jpg?v=20260919b"
    : "media/video/hero-poster.jpg?v=20260919b";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.controls = true;
  } else {
    heroVideo.load();
    heroVideo.play().catch(() => {});
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const LEAD_COPY = {
  collaboration: {
    kicker: "Партнёрство",
    title: "Предложить коллаборацию",
    hint: "Оставьте контакты — мы вернёмся с форматами интеграции.",
  },
  coproduction: {
    kicker: "Сопродюсирование",
    title: "Обсудить сопродюсирование",
    hint: "Расскажите коротко о запросе — свяжемся с моделью сотрудничества.",
  },
  contact: {
    kicker: "Связаться",
    title: "Связаться",
    hint: "Напишите, чем хотите помочь проекту.",
  },
  info: {
    kicker: "Информационная поддержка",
    title: "Связаться",
    hint: "Расскажите, чем можете помочь с публикациями и распространением.",
  },
  vip: {
    kicker: "VIP-ложа",
    title: "Запрос на VIP-ложу",
    hint: "До 12 гостей. Мы направим предложение по билетам или выкупу пространства.",
  },
  gift: {
    kicker: "Подарочное оформление",
    title: "Билет уже куплен",
    hint: "Напишите почту, телефон, повод, имя и пол человека, кому адресован билет. Варианты оформления пришлём на почту.",
  },
};

const modal = document.getElementById("lead-modal");
const form = document.getElementById("lead-form");
const kindInput = document.getElementById("lead-kind");
const amountInput = document.getElementById("lead-amount");
const amountNote = document.getElementById("lead-amount-note");
const statusEl = document.getElementById("lead-status");
const submitBtn = document.getElementById("lead-submit");
const otherAmount = document.getElementById("support-other");
const supportPicked = document.getElementById("support-picked");
const supportEmail = document.getElementById("support-email");
const supportPayBtn = document.getElementById("support-pay");
const supportStatus = document.getElementById("support-status");
const supportTerms = document.getElementById("support-terms-consent");
const supportPdn = document.getElementById("support-pdn-consent");
const API_BASE = (window.SHADOW_CONFIG && window.SHADOW_CONFIG.API_BASE) || "";

function selectedSupportAmount() {
  const custom = Number(otherAmount?.value);
  if (custom >= 500) return Math.round(custom);
  const active = document.querySelector(".amount-chip.is-active");
  return Number(active?.dataset.amount) || 2000;
}

function syncAmountChips(value) {
  document.querySelectorAll(".amount-chip").forEach((chip) => {
    chip.classList.toggle("is-active", Number(chip.dataset.amount) === Number(value));
  });
}

function refreshSupportAmount() {
  const amt = selectedSupportAmount();
  if (supportPicked) {
    supportPicked.textContent = `Сумма поддержки: ${amt.toLocaleString("ru-RU")} ₽`;
  }
  return amt;
}

document.querySelectorAll(".amount-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    if (otherAmount) {
      otherAmount.value = String(chip.dataset.amount || "");
      otherAmount.dispatchEvent(new Event("input", { bubbles: true }));
    }
    syncAmountChips(chip.dataset.amount);
    refreshSupportAmount();
  });
});
otherAmount?.addEventListener("input", () => {
  syncAmountChips(otherAmount.value);
  refreshSupportAmount();
});
if (otherAmount && !otherAmount.value) {
  const active = document.querySelector(".amount-chip.is-active");
  otherAmount.value = active?.dataset.amount || "2000";
}
refreshSupportAmount();

function setSupportStatus(ok, text) {
  if (!supportStatus) return;
  supportStatus.hidden = false;
  supportStatus.className = ok ? "lead-status is-ok" : "lead-status is-err";
  supportStatus.textContent = text;
}

if (new URLSearchParams(location.search).get("support") === "ok") {
  setSupportStatus(true, "Если оплата прошла, спасибо за поддержку проекта.");
}

supportPayBtn?.addEventListener("click", async () => {
  const amount = refreshSupportAmount();
  const email = (supportEmail?.value || "").trim();
  if (amount < 500) {
    setSupportStatus(false, "Сумма поддержки — от 500 ₽.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setSupportStatus(false, "Укажите почту для чека.");
    return;
  }
  if (!supportTerms?.checked) {
    setSupportStatus(false, "Подтвердите согласие с условиями финансовой поддержки.");
    return;
  }
  if (!supportPdn?.checked) {
    setSupportStatus(false, "Подтвердите согласие на обработку персональных данных.");
    return;
  }
  supportPayBtn.disabled = true;
  setSupportStatus(true, "Открываем оплату…");
  try {
    const returnUrl = new URL(location.href);
    returnUrl.searchParams.set("support", "ok");
    returnUrl.hash = "partners";
    const res = await fetch(`${API_BASE}/api/show-support/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount,
        termsConsent: true,
        privacyConsent: true,
        returnUrl: returnUrl.toString(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Не удалось создать платёж");
    if (!data.confirmationUrl) throw new Error("ЮKassa не вернула ссылку на оплату");
    location.href = data.confirmationUrl;
  } catch (err) {
    setSupportStatus(false, err.message || "Не удалось открыть оплату. Попробуйте позже.");
    supportPayBtn.disabled = false;
  }
});

function openLead(kind) {
  const copy = LEAD_COPY[kind] || LEAD_COPY.contact;
  kindInput.value = kind;
  document.getElementById("lead-kicker").textContent = copy.kicker;
  document.getElementById("lead-title").textContent = copy.title;
  document.getElementById("lead-hint").textContent = copy.hint;
  const comment = form?.comment;
  const commentLabel = document.getElementById("lead-comment-label");
  if (kind === "vip") {
    if (comment) comment.required = true;
    if (comment) comment.placeholder = "Количество гостей, даты, пожелания";
    if (commentLabel) commentLabel.textContent = "Комментарий";
  } else if (kind === "gift") {
    if (comment) comment.required = true;
    if (comment) comment.placeholder = "Повод, имя и пол человека. Если есть — номер билета";
    if (commentLabel) commentLabel.textContent = "Повод и кому адресован билет";
  } else {
    if (comment) comment.required = false;
    if (comment) comment.placeholder = "Коротко о запросе";
    if (commentLabel) commentLabel.textContent = "Комментарий";
  }
  amountInput.value = "";
  amountNote.hidden = true;
  statusEl.hidden = true;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLead() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

function closeMenu() {
  if (!menuButton || !menu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menu.classList.remove("is-open");
}

document.querySelectorAll("[data-lead]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeMenu();
    openLead(btn.dataset.lead);
  });
});
menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});
document.getElementById("lead-close")?.addEventListener("click", closeLead);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeLead(); });
document.addEventListener("keydown", (e) => {
  const box = document.getElementById("lightbox");
  if (box && !box.hidden) return;
  if (e.key === "Escape" && modal && !modal.hidden) closeLead();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    kind: kindInput.value,
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    telegram: form.telegram.value.trim(),
    comment: form.comment.value.trim(),
    website: form.website.value,
    privacyConsent: Boolean(form.privacyConsent?.checked),
  };
  if (!payload.fullName || !payload.email || !payload.phone || !payload.telegram) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Заполните имя, почту, телефон и Telegram.";
    return;
  }
  if (!payload.privacyConsent) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Нужно согласие на обработку персональных данных.";
    return;
  }
  if (payload.kind === "vip" && !payload.comment) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Для VIP-ложи напишите комментарий: гости, формат, пожелания.";
    return;
  }
  if (payload.kind === "gift" && !payload.comment) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Напишите повод, имя и пол человека, кому адресован билет.";
    return;
  }
  submitBtn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/api/show-leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Не удалось отправить");
    form.reset();
    statusEl.hidden = false;
    statusEl.className = "lead-status is-ok";
    statusEl.textContent = "Заявка отправлена. Мы свяжемся с вами.";
  } catch (err) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = err.message || "Не удалось отправить. Попробуйте позже.";
  } finally {
    submitBtn.disabled = false;
  }
});

(function initOracle() {
  const cards = window.SHOW_CARDS || [];
  const grid = document.getElementById("oracle-grid");
  const sheet = document.getElementById("oracle-sheet");
  const imgEl = document.getElementById("oracle-img");
  const qEl = document.getElementById("oracle-question");
  const bodyEl = document.getElementById("oracle-body");
  if (!grid || !sheet || !cards.length) return;

  grid.innerHTML = cards.map((card, i) => `
    <button type="button" class="oracle-card" data-card="${card.id}" aria-label="Открыть карту ${i + 1}">
      <img src="${card.src}" alt="${card.alt}" width="900" height="1600" loading="lazy">
    </button>
  `).join("");

  function lockPage(on) {
    const galleryOpen = document.getElementById("lightbox") && !document.getElementById("lightbox").hidden;
    document.body.style.overflow = on || galleryOpen || (modal && !modal.hidden) ? "hidden" : "";
  }

  function openCard(id) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    imgEl.src = card.src;
    imgEl.alt = card.alt;
    qEl.textContent = card.question;
    bodyEl.innerHTML = card.html;
    sheet.hidden = false;
    sheet.scrollTop = 0;
    lockPage(true);
  }

  function closeCard() {
    sheet.hidden = true;
    imgEl.removeAttribute("src");
    lockPage(false);
  }

  grid.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-card]");
    if (btn) openCard(btn.dataset.card);
  });
  document.getElementById("oracle-close")?.addEventListener("click", closeCard);
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) closeCard();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !sheet.hidden) closeCard();
  });
})();

(function initGallery() {
  const rail = document.getElementById("gallery-rail");
  const shots = [...document.querySelectorAll(".gallery__shot")];
  const box = document.getElementById("lightbox");
  const imgEl = document.getElementById("lightbox-img");
  const capEl = document.getElementById("lightbox-cap");
  const thumbs = document.getElementById("lightbox-thumbs");
  if (!rail || !shots.length || !box || !imgEl || !thumbs) return;

  let index = 0;
  thumbs.innerHTML = shots.map((shot, i) => {
    const src = shot.querySelector("img")?.getAttribute("src") || "";
    return `<button type="button" class="lightbox__thumb" data-index="${i}" aria-label="Кадр ${i + 1}"><img src="${src}" alt=""></button>`;
  }).join("");

  function lockPage(on) {
    const oracleOpen = document.getElementById("oracle-sheet") && !document.getElementById("oracle-sheet").hidden;
    document.body.style.overflow = on || oracleOpen || (modal && !modal.hidden) ? "hidden" : "";
  }

  function render(i) {
    index = (i + shots.length) % shots.length;
    const img = shots[index].querySelector("img");
    imgEl.src = img?.src || "";
    imgEl.alt = img?.alt || "";
    if (capEl) capEl.textContent = `${index + 1} / ${shots.length}`;
    thumbs.querySelectorAll(".lightbox__thumb").forEach((thumb, n) => {
      thumb.classList.toggle("is-active", n === index);
    });
    thumbs.querySelector(".is-active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function open(i) {
    render(i);
    box.hidden = false;
    lockPage(true);
  }

  function close() {
    box.hidden = true;
    imgEl.removeAttribute("src");
    lockPage(false);
  }

  shots.forEach((shot, i) => shot.addEventListener("click", () => open(i)));
  document.getElementById("lightbox-close")?.addEventListener("click", close);
  document.getElementById("lightbox-prev")?.addEventListener("click", () => render(index - 1));
  document.getElementById("lightbox-next")?.addEventListener("click", () => render(index + 1));
  thumbs.addEventListener("click", (e) => {
    const thumb = e.target.closest(".lightbox__thumb");
    if (thumb) render(Number(thumb.dataset.index));
  });

  document.querySelectorAll("[data-gallery-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rail.scrollBy({ left: Number(btn.dataset.galleryDir) * Math.round(rail.clientWidth * 0.78), behavior: "smooth" });
    });
  });

  rail.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    rail.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") render(index - 1);
    if (e.key === "ArrowRight") render(index + 1);
  });

  let touchX = 0;
  box.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  box.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) render(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
