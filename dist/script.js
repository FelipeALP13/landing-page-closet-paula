const phone = "5512997196086";
const whatsappBase = `https://wa.me/${phone}`;
const allowedSizes = new Set(["PP", "P", "M", "G", "GG"]);
const largeImages = new Set(["look-02", "look-03", "look-05", "look-08", "look-09", "look-12"]);

const products = [
  { id: "cacau", sku: "CPM-01", name: "Conjunto Cacau & Areia", image: "look-01", category: "conjuntos", occasions: ["dia", "especial"], tag: "Look completo", keywords: "marrom bege saia conjunto" },
  { id: "rosa", sku: "CPM-02", name: "Cropped Rosa Halter", image: "look-03", category: "croppeds", occasions: ["dia", "especial"], tag: "Novidade", keywords: "rosa top cropped jeans" },
  { id: "preto", sku: "CPM-04", name: "Blusa Essential Preta", image: "look-05", category: "blusas", occasions: ["trabalho", "especial"], tag: "Mais escolhido", keywords: "preto blusa basica calca" },
  { id: "solar", sku: "CPM-05", name: "Vestido Amarelo Solar", image: "look-06", category: "vestidos", occasions: ["especial"], tag: "Destaque", keywords: "vestido longo amarelo festa" },
  { id: "marinho", sku: "CPM-07", name: "Blusa Laço Marinho", image: "look-08", category: "blusas", occasions: ["trabalho", "especial"], tag: "Elegante", keywords: "azul marinho blusa laco" },
  { id: "denim", sku: "CPM-08", name: "Jeans Azul Atual", image: "look-09", category: "jeans", occasions: ["dia", "trabalho"], tag: "Curadoria CPM", keywords: "calca jeans azul denim" },
  { id: "laise", sku: "CPM-10", name: "Blusa Laise Azul Céu", image: "look-12", category: "blusas", occasions: ["dia", "especial"], tag: "Detalhes", keywords: "azul claro laise bordado blusa" }
];

const categoryLabels = {
  todos: "Novidades",
  vestidos: "Vestidos",
  croppeds: "Croppeds",
  blusas: "Blusas",
  jeans: "Jeans & calças",
  conjuntos: "Conjuntos"
};

const quizCategoryLabels = {
  vestidos: "Vestidos",
  tops: "Croppeds e blusas",
  jeans: "Jeans e calças",
  conjuntos: "Look completo"
};

const quizOccasionLabels = {
  dia: "Dia a dia",
  trabalho: "Trabalho",
  especial: "Sair ou ocasião especial"
};

const state = {
  category: "todos",
  search: "",
  selected: new Set(readStoredArray("cpm-selection").filter(id => products.some(product => product.id === id))),
  size: readStoredSize(),
  activeProduct: "",
  quiz: { category: "", occasion: "", size: "" },
  recommendations: []
};

const grid = document.querySelector("[data-product-grid]");
const emptyState = document.querySelector("[data-empty-state]");
const resultsCopy = document.querySelector("[data-results-copy]");
const searchInput = document.querySelector("[data-search]");
const drawer = document.querySelector("[data-selection-drawer]");
const drawerBackdrop = document.querySelector(".drawer-backdrop");
const drawerItems = document.querySelector("[data-selection-items]");
const drawerEmpty = document.querySelector("[data-selection-empty]");
const drawerFooter = document.querySelector("[data-selection-footer]");
const checkout = document.querySelector("[data-checkout]");
const productDialog = document.querySelector("[data-product-dialog]");
const toast = document.querySelector("[data-toast]");
const categoryNav = document.querySelector("[data-category-nav]");
const menuButton = document.querySelector("[data-menu-toggle]");
let toastTimer;
let lastFocus;

document.querySelector("[data-year]").textContent = new Date().getFullYear();

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
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

function persist() {
  try {
    localStorage.setItem("cpm-selection", JSON.stringify([...state.selected]));
    if (state.size) localStorage.setItem("cpm-size", state.size);
    else localStorage.removeItem("cpm-size");
  } catch {
    // A vitrine continua funcionando quando o armazenamento local está bloqueado.
  }
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function imagePath(product, width = 480) {
  return `./assets/${product.image}-${width}.webp`;
}

function imageSet(product) {
  const base = `${imagePath(product, 480)} 480w, ${imagePath(product, 960)} 960w`;
  return largeImages.has(product.image) ? `${base}, ${imagePath(product, 1440)} 1440w` : base;
}

function whatsappUrl(message) {
  return `${whatsappBase}?text=${encodeURIComponent(message)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function visibleProducts() {
  const query = normalize(state.search.trim());
  return products.filter(product => {
    const categoryMatch = state.category === "todos" || product.category === state.category;
    const haystack = normalize(`${product.name} ${product.keywords} ${categoryLabels[product.category]}`);
    return categoryMatch && (!query || haystack.includes(query));
  });
}

function renderProducts() {
  const visible = visibleProducts();
  grid.innerHTML = visible.map(product => `
    <article class="product-card reveal is-visible" data-product-id="${product.id}">
      <div class="product-media">
        <button class="product-image-button" type="button" data-open-product="${product.id}" aria-label="Ver detalhes de ${product.name}">
          <img src="${imagePath(product)}" srcset="${imageSet(product)}" sizes="(max-width: 760px) 50vw, (max-width: 1050px) 33vw, 25vw" alt="${product.name} da Closet Paula Miranda" loading="lazy" decoding="async" width="480" height="640" />
        </button>
        <span class="product-tag">${product.tag}</span>
        <button class="save-button ${state.selected.has(product.id) ? "selected" : ""}" type="button" data-toggle-product="${product.id}" aria-label="${state.selected.has(product.id) ? "Remover" : "Adicionar"} ${product.name} da seleção" aria-pressed="${state.selected.has(product.id)}">${state.selected.has(product.id) ? "♥" : "♡"}</button>
      </div>
      <div class="product-info"><small>${categoryLabels[product.category]}</small><h3><button type="button" data-open-product="${product.id}">${product.name}</button></h3><p>Valor sob consulta</p></div>
    </article>`).join("");

  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  const category = categoryLabels[state.category];
  resultsCopy.textContent = state.search
    ? `${visible.length} resultado${visible.length === 1 ? "" : "s"} para “${state.search}”.`
    : state.category === "todos"
      ? "Peças escolhidas para deixar o seu closet ainda mais você."
      : `${visible.length} ${visible.length === 1 ? "peça" : "peças"} em ${category}.`;

  grid.querySelectorAll("[data-open-product]").forEach(button => button.addEventListener("click", () => openProduct(button.dataset.openProduct)));
  grid.querySelectorAll("[data-toggle-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.toggleProduct)));
}

function setCategory(category, scroll = true) {
  if (!Object.hasOwn(categoryLabels, category)) return;
  state.category = category;
  document.querySelectorAll("[data-category]").forEach(button => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#collection-title").textContent = categoryLabels[category];
  renderProducts();
  categoryNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  if (scroll) document.querySelector("#colecao").scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearFilters() {
  state.search = "";
  searchInput.value = "";
  setCategory("todos");
}

document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => setCategory(button.dataset.category)));
document.querySelectorAll("[data-jump-category]").forEach(button => button.addEventListener("click", () => setCategory(button.dataset.jumpCategory)));
document.querySelector("[data-clear-filters]").addEventListener("click", clearFilters);
searchInput.addEventListener("input", () => {
  state.search = searchInput.value.trim();
  renderProducts();
  if (state.search) document.querySelector("#colecao").scrollIntoView({ behavior: "smooth", block: "start" });
});

menuButton.addEventListener("click", () => {
  const open = categoryNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

categoryNav.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", () => {
  categoryNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
}));

function toggleProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const removing = state.selected.has(id);
  if (removing) state.selected.delete(id);
  else state.selected.add(id);
  persist();
  renderProducts();
  renderSelection();
  updateProductDialog();
  showToast(`${product.name} ${removing ? "foi removido" : "entrou"} da sua seleção`);
}

function setSize(size) {
  if (!allowedSizes.has(size)) return;
  state.size = state.size === size ? "" : size;
  persist();
  renderSelection();
  updateProductDialog();
  showToast(state.size ? `Tamanho ${state.size} selecionado` : "Tamanho removido");
}

function renderSelection() {
  const selected = [...state.selected].map(id => products.find(product => product.id === id)).filter(Boolean);
  document.querySelectorAll("[data-selection-count]").forEach(node => node.textContent = selected.length);
  drawerEmpty.hidden = selected.length > 0;
  drawerFooter.hidden = selected.length === 0;
  drawerItems.innerHTML = selected.map(product => `
    <article class="drawer-item"><img src="${imagePath(product)}" alt="" width="78" height="98" /><div><strong>${product.name}</strong><span>${product.sku} • ${categoryLabels[product.category]}</span></div><button type="button" data-remove-product="${product.id}" aria-label="Remover ${product.name}">×</button></article>`).join("");
  drawerItems.querySelectorAll("[data-remove-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.removeProduct)));
  document.querySelectorAll("[data-size]").forEach(button => {
    const selectedSize = button.dataset.size === state.size;
    button.classList.toggle("selected", selectedSize);
    button.setAttribute("aria-pressed", String(selectedSize));
  });

  if (selected.length && state.size) {
    const list = selected.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n");
    const quizContext = state.quiz.category && state.quiz.occasion
      ? `\nPedido na Curadoria CPM: ${quizCategoryLabels[state.quiz.category]} para ${quizOccasionLabels[state.quiz.occasion].toLowerCase()}.`
      : "";
    checkout.href = whatsappUrl(`Olá! Montei esta seleção no site da Closet Paula Miranda:\n${list}\n\nMeu tamanho mais comum é ${state.size}.${quizContext}\nGostaria de confirmar valores, medidas, disponibilidade e entrega ou retirada.`);
    checkout.textContent = "Consultar seleção no WhatsApp ↗";
    checkout.setAttribute("aria-disabled", "false");
  } else {
    checkout.href = "#";
    checkout.textContent = "Selecione o tamanho";
    checkout.setAttribute("aria-disabled", "true");
  }
}

document.querySelectorAll("[data-size]").forEach(button => button.addEventListener("click", () => setSize(button.dataset.size)));

function setPageInert(value) {
  [document.querySelector(".announcement"), document.querySelector(".site-header"), document.querySelector("main"), document.querySelector("footer")].forEach(element => {
    if (element) element.inert = value;
  });
}

function openDrawer() {
  if (productDialog.open) productDialog.close();
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
  setPageInert(true);
  requestAnimationFrame(() => drawer.querySelector("[data-close-selection]").focus());
}

function closeDrawer() {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
  setPageInert(false);
  if (lastFocus instanceof HTMLElement) lastFocus.focus();
}

document.querySelectorAll("[data-open-selection]").forEach(button => button.addEventListener("click", openDrawer));
document.querySelectorAll("[data-close-selection]").forEach(button => button.addEventListener("click", closeDrawer));
checkout.addEventListener("click", event => {
  if (checkout.getAttribute("aria-disabled") === "true") event.preventDefault();
});

function openProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  state.activeProduct = id;
  const image = productDialog.querySelector("[data-product-image]");
  image.src = imagePath(product, 960);
  image.srcset = imageSet(product);
  image.sizes = "(max-width: 760px) 100vw, 50vw";
  image.alt = `${product.name} da Closet Paula Miranda`;
  productDialog.querySelector("[data-product-tag]").textContent = product.tag;
  productDialog.querySelector("[data-product-category]").textContent = `${categoryLabels[product.category]} • ${product.sku}`;
  productDialog.querySelector("[data-product-title]").textContent = product.name;
  productDialog.querySelector("[data-product-description]").textContent = "Uma peça da curadoria Closet Paula Miranda para compor produções atuais e femininas. A equipe confirma modelagem, medidas e disponibilidade no atendimento.";
  updateProductDialog();
  productDialog.showModal();
}

function updateProductDialog() {
  const product = products.find(item => item.id === state.activeProduct);
  if (!product) return;
  const selected = state.selected.has(product.id);
  productDialog.querySelector("[data-product-toggle]").textContent = selected ? "Remover da seleção" : "Adicionar à seleção";
  const sizeText = state.size ? ` Meu tamanho mais comum é ${state.size}.` : "";
  productDialog.querySelector("[data-product-whatsapp]").href = whatsappUrl(`Olá! Vi ${product.name} (${product.sku}) no site da Closet Paula Miranda.${sizeText} Gostaria de confirmar valor, medidas, disponibilidade e entrega ou retirada.`);
  productDialog.querySelectorAll("[data-size]").forEach(button => {
    const active = button.dataset.size === state.size;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

productDialog.querySelector("[data-product-toggle]").addEventListener("click", () => toggleProduct(state.activeProduct));
document.querySelectorAll("[data-close-product]").forEach(button => button.addEventListener("click", () => productDialog.close()));
productDialog.addEventListener("click", event => {
  if (event.target === productDialog) productDialog.close();
});

const quizSteps = [...document.querySelectorAll("[data-quiz-step]")];
const quizProgress = document.querySelector("[data-quiz-progress]");
const quizResult = document.querySelector("[data-quiz-result]");
const quizResultProducts = document.querySelector("[data-quiz-result-products]");

function showQuizStep(index) {
  quizSteps.forEach((step, stepIndex) => {
    step.hidden = stepIndex !== index;
    step.classList.toggle("active", stepIndex === index);
  });
  quizResult.hidden = true;
  quizProgress.textContent = `0${index + 1} / 03`;
}

function quizCategoryMatch(product, answer) {
  if (answer === "tops") return product.category === "croppeds" || product.category === "blusas";
  return product.category === answer;
}

function finishQuiz() {
  quizSteps.forEach(step => { step.hidden = true; });
  quizResult.hidden = false;
  quizProgress.textContent = "RECOMENDAÇÃO PRONTA";
  state.size = state.quiz.size;
  state.recommendations = products
    .map((product, index) => ({
      product,
      index,
      score: (quizCategoryMatch(product, state.quiz.category) ? 8 : 0) + (product.occasions.includes(state.quiz.occasion) ? 4 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(item => item.product.id);

  const recommended = state.recommendations.map(id => products.find(product => product.id === id)).filter(Boolean);
  const titles = {
    vestidos: "Presença pronta para acontecer",
    tops: "Novas combinações para o seu closet",
    jeans: "Bases que multiplicam seus looks",
    conjuntos: "Um look completo, do seu jeito"
  };
  document.querySelector("[data-quiz-result-title]").textContent = titles[state.quiz.category];
  document.querySelector("[data-quiz-result-copy]").textContent = `Selecionamos três opções para ${quizOccasionLabels[state.quiz.occasion].toLowerCase()}, priorizando ${quizCategoryLabels[state.quiz.category].toLowerCase()}. O tamanho ${state.quiz.size} será usado como referência no atendimento.`;
  quizResultProducts.innerHTML = recommended.map(product => `
    <button class="quiz-result-product" type="button" data-open-quiz-product="${product.id}" aria-label="Ver ${product.name}">
      <img src="${imagePath(product)}" alt="" width="480" height="640" loading="lazy" />
      <span>${product.name}</span>
    </button>`).join("");
  quizResultProducts.querySelectorAll("[data-open-quiz-product]").forEach(button => button.addEventListener("click", () => openProduct(button.dataset.openQuizProduct)));

  const list = recommended.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n");
  document.querySelector("[data-quiz-whatsapp]").href = whatsappUrl(`Olá! Fiz a Curadoria CPM no site e recebi estas recomendações:\n${list}\n\nEu procuro ${quizCategoryLabels[state.quiz.category].toLowerCase()} para ${quizOccasionLabels[state.quiz.occasion].toLowerCase()}. Meu tamanho mais comum é ${state.quiz.size}. Gostaria de confirmar valores, medidas, disponibilidade e opções de entrega ou retirada.`);
  persist();
  renderSelection();
}

quizSteps.forEach((step, index) => {
  step.querySelectorAll("[data-quiz-answer]").forEach(button => button.addEventListener("click", () => {
    state.quiz[step.dataset.quizStep] = button.dataset.quizAnswer;
    if (index < quizSteps.length - 1) showQuizStep(index + 1);
    else finishQuiz();
  }));
});

document.querySelector("[data-add-recommendations]").addEventListener("click", () => {
  state.recommendations.forEach(id => state.selected.add(id));
  persist();
  renderProducts();
  renderSelection();
  showToast("As recomendações entraram na sua seleção");
  openDrawer();
});

document.querySelector("[data-quiz-restart]").addEventListener("click", () => {
  state.quiz = { category: "", occasion: "", size: "" };
  state.recommendations = [];
  showQuizStep(0);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeDrawer();
});

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");
const themeColor = document.querySelector('meta[name="theme-color"]');

function storedTheme() {
  try {
    const value = localStorage.getItem("cpm-theme");
    return value === "light" || value === "dark" ? value : "";
  } catch {
    return "";
  }
}

function applyTheme(theme, save = false) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
  themeToggle.title = dark ? "Ativar modo claro" : "Ativar modo escuro";
  themeIcon.textContent = dark ? "☀" : "☾";
  themeColor.content = "#11100f";
  if (save) {
    try { localStorage.setItem("cpm-theme", dark ? "dark" : "light"); } catch {}
  }
}

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
applyTheme(storedTheme() || (systemTheme.matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach(element => element.classList.add("is-visible"));
}

renderProducts();
renderSelection();
