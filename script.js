const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector(".desktop-nav");
const heroVideo = document.querySelector(".hero__video");

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menu.classList.toggle("is-open", !isOpen);
});

if (heroVideo) {
  const isMobile = window.matchMedia("(max-width: 740px)").matches;
  heroVideo.src = isMobile
    ? heroVideo.dataset.mobileSrc
    : heroVideo.dataset.desktopSrc;
  heroVideo.poster = isMobile
    ? "hero-poster-mobile.jpg"
    : "hero-poster.jpg";

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
    title: "Есть идея?",
    hint: "Напишите, что хотите сделать вместе.",
  },
  support: {
    kicker: "Поддержать проект",
    title: "Поддержать «Виновна ли?»",
    hint: "Это заявка, не мгновенная оплата. Мы свяжемся и направим способ перевода.",
  },
  vip: {
    kicker: "VIP-ложа",
    title: "Запрос на VIP-ложу",
    hint: "До 12 гостей. Мы направим предложение по билетам или выкупу пространства.",
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
const API_BASE = (window.SHADOW_CONFIG && window.SHADOW_CONFIG.API_BASE) || "";

function selectedSupportAmount() {
  const custom = Number(otherAmount?.value);
  if (custom >= 500) return Math.round(custom);
  const active = document.querySelector(".amount-chip.is-active");
  return Number(active?.dataset.amount) || 2000;
}

document.querySelectorAll(".amount-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".amount-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    if (otherAmount) otherAmount.value = "";
  });
});
otherAmount?.addEventListener("input", () => {
  if (Number(otherAmount.value) >= 500) {
    document.querySelectorAll(".amount-chip").forEach((c) => c.classList.remove("is-active"));
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
  } else {
    if (comment) comment.required = false;
    if (comment) comment.placeholder = "Коротко о запросе";
    if (commentLabel) commentLabel.textContent = "Комментарий";
  }
  if (kind === "support") {
    const amt = selectedSupportAmount();
    amountInput.value = String(amt);
    amountNote.hidden = false;
    amountNote.textContent = `Сумма поддержки: ${amt.toLocaleString("ru-RU")} ₽`;
  } else {
    amountInput.value = "";
    amountNote.hidden = true;
  }
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
    amount: kindInput.value === "support" ? selectedSupportAmount() : 0,
    website: form.website.value,
  };
  if (!payload.fullName || !payload.email || !payload.phone || !payload.telegram) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Заполните имя, почту, телефон и Telegram.";
    return;
  }
  if (payload.kind === "vip" && !payload.comment) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Для VIP-ложи напишите комментарий: гости, формат, пожелания.";
    return;
  }
  if (payload.kind === "support" && payload.amount < 500) {
    statusEl.hidden = false;
    statusEl.className = "lead-status is-err";
    statusEl.textContent = "Сумма поддержки — от 500 ₽.";
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
