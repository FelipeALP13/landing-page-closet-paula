const themeStorageKey = "cpm-theme";
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeIcon = document.querySelector("[data-theme-icon]");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function readStoredTheme() {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === "light" || value === "dark" ? value : "";
  } catch {
    return "";
  }
}

function applyTheme(theme, persistPreference = false) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
  themeToggle.title = dark ? "Ativar modo claro" : "Ativar modo escuro";
  themeLabel.textContent = dark ? "Claro" : "Escuro";
  themeIcon.textContent = dark ? "☀" : "☾";
  themeColor.content = dark ? "#1b1517" : "#7d3049";
  if (persistPreference) {
    try { localStorage.setItem(themeStorageKey, dark ? "dark" : "light"); } catch {}
  }
}

applyTheme(readStoredTheme() || (systemTheme.matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));
systemTheme.addEventListener("change", event => {
  if (!readStoredTheme()) applyTheme(event.matches ? "dark" : "light");
});

const phone = "5512997196086";
const whatsappBase = `https://wa.me/${phone}`;
const allowedSizes = new Set(["PP", "P", "M", "G", "GG"]);
const largeImageNames = new Set(["look-02", "look-03", "look-05", "look-08", "look-09", "look-12"]);

const products = [
  { id: "cacau", sku: "CPM-01", name: "Cacau & Areia", image: "look-01", category: ["encontro", "dia"], mood: ["classica", "marcante"], tag: "Look completo" },
  { id: "rosa", sku: "CPM-02", name: "Rosa & Denim", image: "look-03", category: ["dia", "verao"], mood: ["leve", "marcante"], tag: "Leve" },
  { id: "preto", sku: "CPM-04", name: "Essencial Preto", image: "look-05", category: ["trabalho", "encontro"], mood: ["classica", "marcante"], tag: "Mais escolhido" },
  { id: "solar", sku: "CPM-05", name: "Amarelo Solar", image: "look-06", category: ["encontro", "verao"], mood: ["leve", "marcante"], tag: "Destaque" },
  { id: "marinho", sku: "CPM-07", name: "Marinho & Areia", image: "look-08", category: ["trabalho", "encontro"], mood: ["classica"], tag: "Elegante" },
  { id: "denim", sku: "CPM-08", name: "Denim Atual", image: "look-09", category: ["trabalho", "dia"], mood: ["classica", "marcante"], tag: "Curadoria CPM" },
  { id: "laise", sku: "CPM-10", name: "Laise Azul Céu", image: "look-12", category: ["dia", "verao"], mood: ["leve"], tag: "Detalhe" }
];

const labels = {
  dia: "Dia a dia",
  trabalho: "Trabalho",
  encontro: "Encontro",
  verao: "Verão",
  leve: "Leve e natural",
  classica: "Clássica atual",
  marcante: "Marcante e feminina"
};

function readStoredSelection() {
  try {
    const value = JSON.parse(localStorage.getItem("cpm-selection") || "[]");
    return Array.isArray(value) ? value.filter(id => products.some(product => product.id === id)) : [];
  } catch {
    return [];
  }
}

function readStoredSize() {
  try {
    const value = localStorage.getItem("cpm-size") || "";
    return allowedSizes.has(value) ? value : "";
  } catch {
    return "";
  }
}

const state = {
  selected: new Set(readStoredSelection()),
  size: readStoredSize(),
  filter: "todos",
  quiz: { occasion: "", vibe: "", size: "" },
  recommendations: [],
  activeProductId: ""
};

const grid = document.querySelector("[data-product-grid]");
const drawer = document.querySelector("[data-selection-drawer]");
const drawerItems = document.querySelector("[data-selection-items]");
const drawerEmpty = document.querySelector("[data-selection-empty]");
const drawerFooter = document.querySelector("[data-selection-footer]");
const checkout = document.querySelector("[data-checkout]");
const mobileSelection = document.querySelector(".mobile-selection");
const toast = document.querySelector("[data-toast]");
const productDialog = document.querySelector("[data-product-dialog]");
const legalDialog = document.querySelector("[data-legal-dialog]");
let toastTimer;
let lastFocusedElement = null;

document.querySelector("[data-year]").textContent = new Date().getFullYear();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.1 });
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach(element => element.classList.add("is-visible"));
}

function track(name, parameters = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: `cpm_${name}`, ...parameters });
  document.dispatchEvent(new CustomEvent("cpm:analytics", { detail: { name, ...parameters } }));
}

function persist() {
  try {
    localStorage.setItem("cpm-selection", JSON.stringify([...state.selected]));
    if (state.size) localStorage.setItem("cpm-size", state.size);
    else localStorage.removeItem("cpm-size");
  } catch {
    // A experiência continua funcionando quando o navegador bloqueia armazenamento local.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

const productById = id => products.find(product => product.id === id);
const productImage = (product, width = 480) => `./assets/${product.image}-${width}.webp`;
const productImageSet = product => largeImageNames.has(product.image)
  ? `${productImage(product, 480)} 480w, ${productImage(product, 960)} 960w, ${productImage(product, 1440)} 1440w`
  : `${productImage(product, 480)} 480w, ${productImage(product, 960)} 960w`;
const productCategories = product => product.category.map(value => labels[value]).join(" • ");
const productMood = product => product.mood.map(value => labels[value]).join(" • ");
const productDescription = product => `Uma proposta ${labels[product.mood[0]].toLowerCase()} para ${labels[product.category[0]].toLowerCase()}, selecionada pela curadoria da Closet Paula Miranda.`;
const productAbout = product => `${product.name} faz parte da curadoria CPM e pode reunir mais de uma peça. A equipe informa exatamente os itens incluídos, a modelagem e as combinações disponíveis no momento do atendimento.`;
const whatsappUrl = message => `${whatsappBase}?text=${encodeURIComponent(message)}`;

function setSize(size, notify = true) {
  if (!allowedSizes.has(size)) return;
  const clearing = state.size === size;
  state.size = clearing ? "" : size;
  persist();
  renderSelection();
  updateProductDialog();
  if (notify) showToast(clearing ? "Tamanho removido" : `Tamanho ${state.size} selecionado`);
}

function renderProducts() {
  const visible = state.filter === "todos" ? products : products.filter(product => product.category.includes(state.filter));
  grid.innerHTML = visible.map(product => `
    <article class="product-card reveal is-visible" id="look-${product.id}" data-product-id="${product.id}">
      <div class="product-media">
        <button class="product-image-button" type="button" data-open-product="${product.id}" aria-label="Ver detalhes de ${product.name}">
          <img src="${productImage(product)}" srcset="${productImageSet(product)}" sizes="(max-width: 720px) 50vw, (max-width: 1000px) 50vw, 25vw" alt="${product.name} da Closet Paula Miranda" loading="lazy" decoding="async" width="640" height="864" />
        </button>
        <span class="product-tag">${product.tag}</span>
        <button class="save-button ${state.selected.has(product.id) ? "selected" : ""}" type="button" data-toggle-product="${product.id}" aria-label="${state.selected.has(product.id) ? "Remover" : "Adicionar"} ${product.name} da seleção" aria-pressed="${state.selected.has(product.id)}">${state.selected.has(product.id) ? "♥" : "♡"}</button>
      </div>
      <div class="product-details"><span>${productCategories(product)}</span><h3><button type="button" data-open-product="${product.id}">${product.name}</button></h3><p>Valor sob consulta</p><button class="product-detail-link" type="button" data-open-product="${product.id}">Ver detalhes</button></div>
    </article>`).join("");

  grid.querySelectorAll("[data-toggle-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.toggleProduct)));
  grid.querySelectorAll("[data-open-product]").forEach(button => button.addEventListener("click", () => openProductDialog(button.dataset.openProduct)));
}

function toggleProduct(id, quiet = false) {
  const product = productById(id);
  if (!product) return;
  const removing = state.selected.has(id);
  if (removing) {
    state.selected.delete(id);
    if (!quiet) showToast(`${product.name} removido da seleção`);
  } else {
    state.selected.add(id);
    if (!quiet) showToast(`${product.name} entrou na sua seleção`);
  }
  persist();
  renderProducts();
  renderSelection();
  updateProductDialog();
  track(removing ? "remove_selection" : "add_selection", { item_id: product.sku, item_name: product.name, selected_count: state.selected.size });
}

function updateCheckout() {
  const chosen = [...state.selected].map(productById).filter(Boolean);
  const ready = chosen.length > 0 && Boolean(state.size);
  checkout.classList.toggle("is-disabled", !ready);
  checkout.setAttribute("aria-disabled", String(!ready));
  checkout.textContent = ready ? "Consultar seleção no WhatsApp ↗" : "Selecione o tamanho";
  if (!ready) {
    checkout.href = "#";
    return;
  }
  const list = chosen.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n");
  const quizContext = state.quiz.occasion ? `\nMeu perfil no Provador CPM: ${labels[state.quiz.occasion]} / ${labels[state.quiz.vibe]}.` : "";
  const message = `Olá! Montei uma seleção no site da Closet Paula Miranda:\n${list}\n\nTamanho mais comum: ${state.size}.${quizContext}\nGostaria de confirmar valores, medidas, disponibilidade, pagamento e opções de entrega ou retirada.`;
  checkout.href = whatsappUrl(message);
}

function renderSelection() {
  const chosen = [...state.selected].map(productById).filter(Boolean);
  document.querySelectorAll("[data-selection-count]").forEach(node => node.textContent = chosen.length);
  drawerEmpty.hidden = chosen.length > 0;
  drawerFooter.hidden = chosen.length === 0;
  mobileSelection.hidden = chosen.length === 0;
  drawerItems.innerHTML = chosen.map(product => `<article class="drawer-item"><img src="${productImage(product)}" alt="" loading="lazy" decoding="async" width="86" height="108" /><div><strong>${product.name}</strong><span>${product.sku} • valor sob consulta</span></div><button type="button" data-remove-product="${product.id}" aria-label="Remover ${product.name}">×</button></article>`).join("");
  drawerItems.querySelectorAll("[data-remove-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.removeProduct)));
  document.querySelectorAll("[data-drawer-size], [data-global-size], [data-product-size]").forEach(button => {
    const value = button.dataset.drawerSize || button.dataset.globalSize || button.dataset.productSize;
    const selected = value === state.size;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  updateCheckout();
}

const inertRegions = [document.querySelector(".announcement"), document.querySelector(".site-header"), document.querySelector("main"), document.querySelector("footer"), mobileSelection].filter(Boolean);

function setPageInert(value) {
  inertRegions.forEach(region => { region.inert = value; });
}

function openDrawer() {
  if (productDialog.open) productDialog.close();
  lastFocusedElement = document.activeElement;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  setPageInert(true);
  requestAnimationFrame(() => drawer.querySelector("[data-close-selection]").focus());
  track("open_selection", { selected_count: state.selected.size });
}

function closeDrawer() {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
  setPageInert(false);
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

drawer.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;
  const focusable = [...drawer.querySelectorAll('button:not([disabled]), a[href]:not([aria-disabled="true"])')].filter(element => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

document.querySelectorAll("[data-open-selection]").forEach(button => button.addEventListener("click", openDrawer));
document.querySelectorAll("[data-close-selection]").forEach(button => button.addEventListener("click", closeDrawer));
document.addEventListener("keydown", event => event.key === "Escape" && closeDrawer());

document.querySelectorAll("[data-global-size], [data-drawer-size], [data-product-size]").forEach(button => button.addEventListener("click", () => {
  setSize(button.dataset.globalSize || button.dataset.drawerSize || button.dataset.productSize);
}));

document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderProducts();
  track("filter", { filter: state.filter });
}));

document.querySelectorAll("[data-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.classList.contains("active"))));

document.querySelectorAll("[data-quick-add]").forEach(button => button.addEventListener("click", () => {
  const id = button.dataset.quickAdd;
  if (!state.selected.has(id)) toggleProduct(id); else showToast(`${productById(id).name} já está na sua seleção`);
}));

function openProductDialog(id) {
  const product = productById(id);
  if (!product) return;
  state.activeProductId = id;
  const image = productDialog.querySelector("[data-product-dialog-image]");
  image.src = productImage(product, 960);
  image.srcset = productImageSet(product);
  image.sizes = "(max-width: 720px) 100vw, 46vw";
  image.decoding = "async";
  image.alt = `${product.name} da Closet Paula Miranda`;
  productDialog.querySelector("[data-product-dialog-code]").textContent = `${product.sku} • ${product.tag}`;
  productDialog.querySelector("[data-product-dialog-title]").textContent = product.name;
  productDialog.querySelector("[data-product-dialog-occasion]").textContent = productCategories(product);
  productDialog.querySelector("[data-product-dialog-description]").textContent = productDescription(product);
  productDialog.querySelector("[data-product-dialog-about]").textContent = productAbout(product);
  productDialog.querySelector("[data-product-dialog-categories]").textContent = productCategories(product);
  productDialog.querySelector("[data-product-dialog-mood]").textContent = productMood(product);
  image.classList.remove("is-detail");
  productDialog.querySelector("[data-product-gallery-note]").textContent = "Imagem completa disponível deste look";
  productDialog.querySelectorAll("[data-product-view]").forEach(button => {
    const active = button.dataset.productView === "full";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  productDialog.querySelectorAll("details").forEach(detail => { detail.open = false; });
  updateProductDialog();
  productDialog.showModal();
  track("view_item", { item_id: product.sku, item_name: product.name });
}

function updateProductDialog() {
  const product = productById(state.activeProductId);
  if (!product) return;
  const selected = state.selected.has(product.id);
  productDialog.querySelector("[data-product-dialog-add]").textContent = selected ? "Remover da seleção" : "Adicionar à seleção";
  productDialog.querySelectorAll("[data-product-size]").forEach(button => {
    const active = button.dataset.productSize === state.size;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const sizeLine = state.size ? ` Meu tamanho mais comum é ${state.size}.` : "";
  const message = `Olá! Vi o look ${product.name} (${product.sku}) no site da Closet Paula Miranda.${sizeLine}\nGostaria de confirmar valor, composição, medidas, modelagem, disponibilidade e entrega ou retirada.`;
  productDialog.querySelector("[data-product-dialog-whatsapp]").href = whatsappUrl(message);
  const sizeReference = state.size ? ` Meu tamanho mais comum é ${state.size}.` : " Ainda não tenho certeza do tamanho.";
  const sizeMessage = `Olá! Preciso de ajuda com o tamanho do look ${product.name} (${product.sku}).${sizeReference}\nPosso enviar minhas medidas de busto, cintura e quadril para vocês me orientarem sobre o caimento?`;
  productDialog.querySelector("[data-size-help-whatsapp]").href = whatsappUrl(sizeMessage);
}

productDialog.querySelectorAll("[data-product-view]").forEach(button => button.addEventListener("click", () => {
  const detailView = button.dataset.productView === "detail";
  productDialog.querySelector("[data-product-dialog-image]").classList.toggle("is-detail", detailView);
  productDialog.querySelector("[data-product-gallery-note]").textContent = detailView ? "Recorte ampliado da fotografia disponível" : "Imagem completa disponível deste look";
  productDialog.querySelectorAll("[data-product-view]").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  track("product_image_view", { item_id: productById(state.activeProductId)?.sku || "", view: button.dataset.productView });
}));

document.querySelector("[data-product-dialog-add]").addEventListener("click", () => toggleProduct(state.activeProductId));
document.querySelector("[data-product-dialog-whatsapp]").addEventListener("click", () => {
  const product = productById(state.activeProductId);
  if (product) track("click_whatsapp", { source: "product", item_id: product.sku, item_name: product.name });
});
document.querySelector("[data-size-help-whatsapp]").addEventListener("click", () => {
  const product = productById(state.activeProductId);
  if (product) track("click_whatsapp", { source: "size_help", item_id: product.sku, item_name: product.name, size: state.size });
});
document.querySelectorAll("[data-close-product]").forEach(button => button.addEventListener("click", () => productDialog.close()));
productDialog.addEventListener("click", event => event.target === productDialog && productDialog.close());

const directMessage = "Olá! Vim pelo site da Closet Paula Miranda e gostaria de ajuda para escolher um look.";
document.querySelectorAll("[data-direct-whatsapp]").forEach(link => {
  link.href = whatsappUrl(directMessage);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.addEventListener("click", () => track("click_whatsapp", { source: "hero" }));
});
document.querySelectorAll("[data-fitting-whatsapp]").forEach(link => {
  link.href = whatsappUrl("Olá! Vim pelo site da Closet Paula Miranda e gostaria de combinar um horário para conhecer a loja e provar algumas peças.");
  link.addEventListener("click", () => track("click_whatsapp", { source: "store_fitting" }));
});
checkout.addEventListener("click", event => {
  if (checkout.getAttribute("aria-disabled") === "true") { event.preventDefault(); return; }
  track("click_whatsapp", { source: "selection", selected_count: state.selected.size, size: state.size });
});

const quizSteps = [...document.querySelectorAll(".quiz-step")];
const progress = document.querySelector("[data-quiz-progress]");
const result = document.querySelector("[data-quiz-result]");

function showQuizStep(index) {
  quizSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== index; step.classList.toggle("active", stepIndex === index); });
  result.hidden = true;
  progress.textContent = `0${index + 1} — 03`;
}

function finishQuiz() {
  quizSteps.forEach(step => { step.hidden = true; });
  progress.textContent = "SEU RESULTADO";
  result.hidden = false;
  state.size = state.quiz.size;
  persist();
  const matches = products
    .map((product, index) => ({ product, index, score: (product.category.includes(state.quiz.occasion) ? 5 : 0) + (product.mood.includes(state.quiz.vibe) ? 3 : 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(item => item.product);
  state.recommendations = matches.map(product => product.id);
  const titles = { leve: "Leve com intenção", classica: "Clássica, nunca óbvia", marcante: "Presença que chega primeiro" };
  document.querySelector("[data-result-title]").textContent = titles[state.quiz.vibe];
  document.querySelector("[data-result-copy]").textContent = `Selecionamos três produções para ${labels[state.quiz.occasion].toLowerCase()}, com uma proposta ${labels[state.quiz.vibe].toLowerCase()}. O tamanho ${state.quiz.size} será usado como referência na consulta.`;
  document.querySelector("[data-result-looks]").innerHTML = matches.map(product => `<button class="result-look" type="button" data-open-product="${product.id}"><img src="${productImage(product)}" alt="" loading="lazy" decoding="async" width="320" height="426" /><span>${product.name}</span></button>`).join("");
  document.querySelectorAll("[data-result-looks] [data-open-product]").forEach(button => button.addEventListener("click", () => openProductDialog(button.dataset.openProduct)));
  renderSelection();
  track("quiz_complete", { occasion: state.quiz.occasion, vibe: state.quiz.vibe, size: state.quiz.size });
}

quizSteps.forEach((step, index) => step.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => {
  state.quiz[step.dataset.step] = button.dataset.answer;
  track("quiz_answer", { step: step.dataset.step, answer: button.dataset.answer });
  if (index < quizSteps.length - 1) showQuizStep(index + 1); else finishQuiz();
})));

document.querySelector("[data-add-recommendations]").addEventListener("click", () => {
  state.recommendations.forEach(id => state.selected.add(id));
  persist();
  renderProducts();
  renderSelection();
  showToast("Seus 3 matches foram adicionados");
  track("add_quiz_matches", { selected_count: state.selected.size });
  openDrawer();
});
document.querySelector("[data-restart-quiz]").addEventListener("click", () => {
  state.quiz = { occasion: "", vibe: "", size: "" };
  state.recommendations = [];
  showQuizStep(0);
  track("quiz_restart");
});

function openLegal(section) {
  if (productDialog.open) productDialog.close();
  legalDialog.showModal();
  const target = legalDialog.querySelector(`#${section}`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}

document.querySelectorAll("[data-open-legal]").forEach(button => button.addEventListener("click", () => openLegal(button.dataset.openLegal)));
document.querySelectorAll("[data-close-legal]").forEach(button => button.addEventListener("click", () => legalDialog.close()));
legalDialog.addEventListener("click", event => event.target === legalDialog && legalDialog.close());

document.querySelectorAll("[data-clear-local-data]").forEach(button => button.addEventListener("click", () => {
  state.selected.clear();
  state.size = "";
  state.quiz = { occasion: "", vibe: "", size: "" };
  state.recommendations = [];
  try {
    localStorage.removeItem("cpm-selection");
    localStorage.removeItem("cpm-size");
  } catch {
    // A interface continua utilizável quando o navegador bloqueia o armazenamento local.
  }
  renderProducts();
  renderSelection();
  showQuizStep(0);
  showToast("Seleção e tamanho apagados deste navegador");
  track("clear_local_data");
}));

renderProducts();
renderSelection();
