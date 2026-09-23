(() => {
  const cards = window.SHOW_CARDS || [];
  if (!cards.length) return;

  const sizes = ["a", "c", "b", "b", "a", "c", "c", "b", "a"];

  function cardButton(card, i, { size, delay, showMeta = true } = {}) {
    const num = String(i + 1).padStart(2, "0");
    const label = card.label || `Карта ${num}`;
    const sizeClass = size ? ` oracle-card--${size}` : "";
    const meta = showMeta
      ? `<span class="oracle-card__meta"><span class="oracle-card__num">${num}</span><span class="oracle-card__title">${label}</span></span>`
      : "";
    return `
      <button type="button" class="oracle-card${sizeClass}" data-card="${card.id}" style="--delay:${delay || 0}ms" aria-label="${label}">
        <img src="${card.src}" alt="${card.alt}" width="900" height="1600" loading="lazy">
        ${meta}
      </button>`;
  }

  function bindSheet() {
    const sheet = document.getElementById("oracle-sheet");
    const imgEl = document.getElementById("oracle-img");
    const qEl = document.getElementById("oracle-question");
    const bodyEl = document.getElementById("oracle-body");
    if (!sheet || !imgEl || !qEl || !bodyEl) return null;

    function lockPage(on) {
      const galleryOpen = document.getElementById("lightbox") && !document.getElementById("lightbox").hidden;
      const modal = document.getElementById("lead-modal");
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

    document.getElementById("oracle-close")?.addEventListener("click", closeCard);
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) closeCard();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !sheet.hidden) closeCard();
    });

    return { openCard, closeCard, sheet };
  }

  function revealCards(root) {
    const nodes = root.querySelectorAll(".oracle-card");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playIn = () => nodes.forEach((card) => card.classList.add("is-in"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      playIn();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      playIn();
      io.disconnect();
    }, { threshold: 0.05, rootMargin: "40px 0px" });
    io.observe(root);
  }

  const sheetApi = bindSheet();

  function onCardClick(event) {
    const btn = event.target.closest("[data-card]");
    if (!btn || !sheetApi) return;
    sheetApi.openCard(btn.dataset.card);
  }

  const rail = document.getElementById("oracle-rail");
  if (rail) {
    rail.innerHTML = cards.map((card, i) =>
      cardButton(card, i, { delay: i * 70, showMeta: true })
    ).join("");
    rail.addEventListener("click", onCardClick);
    revealCards(rail);
  }

  const grid = document.getElementById("oracle-grid");
  if (grid) {
    const colCount = window.matchMedia("(max-width: 900px)").matches ? 2 : 3;
    const cols = Array.from({ length: colCount }, () => []);
    cards.forEach((card, i) => {
      const delay = (i % colCount) * 90 + Math.floor(i / colCount) * 160;
      cols[i % colCount].push(cardButton(card, i, {
        size: sizes[i % sizes.length],
        delay,
        showMeta: true,
      }));
    });
    grid.innerHTML = cols.map((col) => `<div class="oracle__col">${col.join("")}</div>`).join("");
    grid.addEventListener("click", onCardClick);
    revealCards(grid);

    const wanted = new URLSearchParams(location.search).get("card");
    if (wanted && sheetApi) {
      requestAnimationFrame(() => sheetApi.openCard(wanted));
    }
  }
})();
