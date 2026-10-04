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

menu?.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    closeMenu();
    const heading =
      target.querySelector(".section-heading, .oracle__intro, .event__heading, .join__intro, .statement__intro") ||
      target;
    heading.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    history.pushState(null, "", link.getAttribute("href"));
  });
});

if (heroVideo) {
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const nextSrc = isMobile ? heroVideo.dataset.mobileSrc : heroVideo.dataset.desktopSrc;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.playsInline = true;
  heroVideo.loop = true;
  heroVideo.autoplay = true;
  heroVideo.setAttribute("muted", "");
  heroVideo.setAttribute("playsinline", "");
  heroVideo.setAttribute("webkit-playsinline", "");
  heroVideo.poster = isMobile
    ? "media/video/hero-poster-mobile.jpg?v=20260919b"
    : "media/video/hero-poster.jpg?v=20260919b";
  if (heroVideo.getAttribute("src") !== nextSrc) {
    heroVideo.src = nextSrc;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.controls = true;
  } else {
    const tryPlay = () => {
      const play = heroVideo.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    };
    if (heroVideo.readyState >= 2) tryPlay();
    heroVideo.addEventListener("canplay", tryPlay);
    heroVideo.addEventListener("loadeddata", tryPlay);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
    window.addEventListener("pageshow", tryPlay);
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    document.addEventListener("click", tryPlay, { once: true });
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
  { threshold: 0.01, rootMargin: "80px 0px" }
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
  media: {
    kicker: "Информационная поддержка",
    title: "Связаться • СМИ",
    hint: "Расскажите о вашем издании, площадке или формате публикации.",
  },
  ambassador: {
    kicker: "Программа Амбассадор",
    title: "Связаться • Амбассадор",
    hint: "Оставьте контакты — расскажем об условиях программы.",
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
    document.body.style.overflow = on || (modal && !modal.hidden) ? "hidden" : "";
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

// ── Маркетинговая аналитика спектакля ──
// Фиксирует первый источник визита, просмотр и клики по всем ссылкам/кнопкам.
(() => {
  if (!API_BASE) return;

  const ATTR_KEY = "vinovnali_attribution";
  const DEVICE_KEY = "vinovnali_device_id";
  const PAGE_KEY = `vinovnali_page_view:${location.pathname}:${location.search}`;
  const params = new URLSearchParams(location.search);

  const clean = (value, max = 160) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  const hostOf = (value) => {
    try { return new URL(value).hostname.toLowerCase(); } catch { return ""; }
  };
  const sourceFromReferrer = (referrer) => {
    const host = hostOf(referrer);
    if (!host) return "direct";
    if (host.includes("kudago.com")) return "kudago_legacy";
    if (host === "vinovnali.ru" || host.endsWith(".vinovnali.ru")) return "legacy_site";
    if (host.includes("instagram.com")) return "instagram";
    if (host === "t.me" || host.endsWith(".telegram.org")) return "telegram";
    if (host === "vk.ru" || host.endsWith(".vk.com")) return "vk";
    if (host === "vc.ru" || host.endsWith(".vc.ru")) return "vc_ru";
    if (host.includes("google.")) return "google";
    if (host.includes("yandex.") || host === "ya.ru") return "yandex";
    if (host.includes("7sbocmxidei1bb9cwe")) return "shadow_championship";
    if (host === location.hostname.toLowerCase()) return "internal";
    return host.replace(/^www\./, "") || "referral";
  };
  const readStored = () => {
    try { return JSON.parse(sessionStorage.getItem(ATTR_KEY) || "null"); } catch { return null; }
  };

  const taggedSource = clean(params.get("utm_source"));
  const attribution = taggedSource
    ? {
        source: taggedSource,
        medium: clean(params.get("utm_medium")) || "referral",
        campaign: clean(params.get("utm_campaign")),
        content: clean(params.get("utm_content")),
      }
    : readStored() || {
        source: sourceFromReferrer(document.referrer),
        medium: document.referrer ? "referral" : "direct",
        campaign: "",
        content: "",
      };
  try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(attribution)); } catch {}

  let deviceId = "";
  try {
    deviceId = localStorage.getItem(DEVICE_KEY) || "";
    if (!deviceId) {
      deviceId = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `show-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
  } catch {
    deviceId = `show-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const track = (type, extra = {}) => {
    const body = JSON.stringify({
      type,
      deviceId,
      referrer: clean(document.referrer, 300),
      meta: {
        ...attribution,
        page: "vinovnalishow.ru",
        path: `${location.pathname}${location.search}`,
        ...extra,
      },
    });
    fetch(`${API_BASE}/api/events`, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      keepalive: true,
    }).catch(() => {});
  };

  try {
    if (!sessionStorage.getItem(PAGE_KEY)) {
      sessionStorage.setItem(PAGE_KEY, "1");
      track("page_view");
    }
  } catch {
    track("page_view");
  }

  // Передаём UTM в QTickets: это пригодится, если площадка отдаст отчёт с метками.
  document.querySelectorAll('a[href*="qtickets.ru"]').forEach((link) => {
    try {
      const url = new URL(link.href);
      if (attribution.source) url.searchParams.set("utm_source", attribution.source);
      if (attribution.medium) url.searchParams.set("utm_medium", attribution.medium);
      if (attribution.campaign) url.searchParams.set("utm_campaign", attribution.campaign);
      if (attribution.content) url.searchParams.set("utm_content", attribution.content);
      link.href = url.toString();
    } catch {}
  });

  document.addEventListener("click", (event) => {
    const control = event.target.closest("a, button");
    if (!control || control.disabled) return;
    const href = control.tagName === "A" ? control.href : "";
    const isTicket = control.classList.contains("ticket-link") || href.includes("qtickets.ru");
    track(isTicket ? "ticket_click" : "button_click", {
      label: clean(control.dataset.track || control.getAttribute("aria-label") || control.textContent || control.id || control.className),
      element: control.tagName.toLowerCase(),
      target: clean(href || control.dataset.lead || control.id, 500),
    });
  }, true);
})();
