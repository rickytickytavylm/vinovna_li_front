(() => {
  const cards = window.SHOW_CARDS || [];
  if (!cards.length) return;

  const sizes = ["a", "c", "b", "b", "a", "c", "c", "b", "a"];

  function cardLink(card, i, { size, delay } = {}) {
    const sizeClass = size ? ` oracle-card--${size}` : "";
    return `
      <a class="oracle-card${sizeClass}" href="card.html?id=${encodeURIComponent(card.id)}" style="--delay:${delay || 0}ms" aria-label="Рассмотреть карту">
        <img src="${card.src}" alt="" width="900" height="1600" loading="lazy">
      </a>`;
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

  const rail = document.getElementById("oracle-rail");
  if (rail) {
    rail.innerHTML = cards.map((card, i) =>
      cardLink(card, i, { delay: i * 70 })
    ).join("");
    revealCards(rail);
  }

  const grid = document.getElementById("oracle-grid");
  if (grid) {
    const colCount = window.matchMedia("(max-width: 900px)").matches ? 2 : 3;
    const cols = Array.from({ length: colCount }, () => []);
    cards.forEach((card, i) => {
      const delay = (i % colCount) * 90 + Math.floor(i / colCount) * 160;
      cols[i % colCount].push(cardLink(card, i, {
        size: sizes[i % sizes.length],
        delay,
      }));
    });
    grid.innerHTML = cols.map((col) => `<div class="oracle__col">${col.join("")}</div>`).join("");
    revealCards(grid);

    const wanted = new URLSearchParams(location.search).get("card");
    if (wanted) location.replace(`card.html?id=${encodeURIComponent(wanted)}`);
  }
})();
