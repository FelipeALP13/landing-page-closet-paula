const phone = "5512997196086";
const products = [
  { id: "cacau", name: "Cacau & Areia", image: "./assets/look-01.jpg", category: ["encontro", "dia"], mood: ["classica", "marcante"], tag: "Look completo" },
  { id: "rosa", name: "Rosa & Denim", image: "./assets/look-03.jpg", category: ["dia", "verao"], mood: ["leve", "marcante"], tag: "Fresh" },
  { id: "azul", name: "Azul Claro", image: "./assets/look-04.jpg", category: ["dia", "verao"], mood: ["leve", "classica"], tag: "Versátil" },
  { id: "preto", name: "Essencial Preto", image: "./assets/look-05.jpg", category: ["trabalho", "encontro"], mood: ["classica", "marcante"], tag: "Best match" },
  { id: "solar", name: "Amarelo Solar", image: "./assets/look-06.jpg", category: ["encontro", "verao"], mood: ["leve", "marcante"], tag: "Destaque" },
  { id: "leve", name: "Branco Leve", image: "./assets/look-07.jpg", category: ["dia", "verao"], mood: ["leve"], tag: "Novo" },
  { id: "marinho", name: "Marinho & Areia", image: "./assets/look-08.jpg", category: ["trabalho", "encontro"], mood: ["classica"], tag: "Elegante" },
  { id: "denim", name: "Denim Atual", image: "./assets/look-09.jpg", category: ["trabalho", "dia"], mood: ["classica", "marcante"], tag: "Curadoria CPM" },
  { id: "chocolate", name: "Camadas de Chocolate", image: "./assets/look-10.jpg", category: ["encontro", "dia"], mood: ["marcante", "classica"], tag: "Editorial" },
  { id: "laise", name: "Laise Azul Céu", image: "./assets/look-12.jpg", category: ["dia", "verao"], mood: ["leve"], tag: "Detalhe" }
];

const state = {
  selected: new Set(JSON.parse(localStorage.getItem("cpm-selection") || "[]")),
  size: localStorage.getItem("cpm-size") || "",
  filter: "todos",
  quiz: { occasion: "", vibe: "", size: "" },
  recommendations: []
};

const grid = document.querySelector("[data-product-grid]");
const drawer = document.querySelector("[data-selection-drawer]");
const drawerItems = document.querySelector("[data-selection-items]");
const drawerEmpty = document.querySelector("[data-selection-empty]");
const drawerFooter = document.querySelector("[data-selection-footer]");
const checkout = document.querySelector("[data-checkout]");
const toast = document.querySelector("[data-toast]");
let toastTimer;

document.querySelector("[data-year]").textContent = new Date().getFullYear();
const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: .1 });
document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => observer.observe(element));

function persist() {
  localStorage.setItem("cpm-selection", JSON.stringify([...state.selected]));
  if (state.size) localStorage.setItem("cpm-size", state.size);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

const productById = id => products.find(product => product.id === id);

function renderProducts() {
  const visible = state.filter === "todos" ? products : products.filter(product => product.category.includes(state.filter));
  grid.innerHTML = visible.map(product => `
    <article class="product-card reveal is-visible" data-product-id="${product.id}">
      <div class="product-media">
        <img src="${product.image}" alt="${product.name} da Closet Paula Miranda" loading="lazy" />
        <span class="product-tag">${product.tag}</span>
        <button class="save-button ${state.selected.has(product.id) ? "selected" : ""}" type="button" data-toggle-product="${product.id}" aria-label="${state.selected.has(product.id) ? "Remover" : "Adicionar"} ${product.name} da seleção" aria-pressed="${state.selected.has(product.id)}">${state.selected.has(product.id) ? "♥" : "♡"}</button>
      </div>
      <div class="product-details"><span>${product.category.map(value => value === "dia" ? "Dia a dia" : value).join(" • ")}</span><h3>${product.name}</h3><p>Consulte valor</p></div>
    </article>`).join("");
  document.querySelectorAll("[data-toggle-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.toggleProduct)));
}

function toggleProduct(id, quiet = false) {
  const product = productById(id);
  if (!product) return;
  if (state.selected.has(id)) {
    state.selected.delete(id);
    if (!quiet) showToast(`${product.name} removido da seleção`);
  } else {
    state.selected.add(id);
    if (!quiet) showToast(`${product.name} entrou na sua seleção`);
  }
  persist();
  renderProducts();
  renderSelection();
}

function updateCheckout() {
  const chosen = [...state.selected].map(productById).filter(Boolean);
  const ready = chosen.length > 0 && Boolean(state.size);
  checkout.classList.toggle("is-disabled", !ready);
  checkout.setAttribute("aria-disabled", String(!ready));
  checkout.textContent = ready ? "Consultar seleção no WhatsApp ↗" : "Selecione o tamanho";
  if (!ready) { checkout.href = "#"; return; }
  const list = chosen.map((product, index) => `${index + 1}. ${product.name}`).join("\n");
  const quizContext = state.quiz.occasion ? `\nMeu perfil no Provador CPM: ${state.quiz.occasion} / ${state.quiz.vibe}.` : "";
  const message = `Olá! Montei uma seleção no site da Closet Paula Miranda:\n${list}\n\nTamanho para consulta: ${state.size}.${quizContext}\nGostaria de confirmar valores, disponibilidade e opções de entrega/frete.`;
  checkout.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function renderSelection() {
  const chosen = [...state.selected].map(productById).filter(Boolean);
  document.querySelectorAll("[data-selection-count]").forEach(node => node.textContent = chosen.length);
  drawerEmpty.hidden = chosen.length > 0;
  drawerFooter.hidden = chosen.length === 0;
  drawerItems.innerHTML = chosen.map(product => `<article class="drawer-item"><img src="${product.image}" alt="" /><div><strong>${product.name}</strong><span>Consulte valor e disponibilidade</span></div><button type="button" data-remove-product="${product.id}" aria-label="Remover ${product.name}">×</button></article>`).join("");
  drawerItems.querySelectorAll("[data-remove-product]").forEach(button => button.addEventListener("click", () => toggleProduct(button.dataset.removeProduct)));
  document.querySelectorAll("[data-drawer-size], [data-global-size]").forEach(button => button.classList.toggle("selected", button.dataset.drawerSize === state.size || button.dataset.globalSize === state.size));
  updateCheckout();
}

function openDrawer() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  setTimeout(() => drawer.querySelector("[data-close-selection]").focus(), 100);
}
function closeDrawer() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
}

document.querySelectorAll("[data-open-selection]").forEach(button => button.addEventListener("click", openDrawer));
document.querySelectorAll("[data-close-selection]").forEach(button => button.addEventListener("click", closeDrawer));
document.addEventListener("keydown", event => event.key === "Escape" && closeDrawer());
document.querySelectorAll("[data-global-size], [data-drawer-size]").forEach(button => button.addEventListener("click", () => {
  state.size = button.dataset.globalSize || button.dataset.drawerSize;
  persist(); renderSelection(); showToast(`Tamanho ${state.size} selecionado`);
}));
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
  renderProducts();
}));
document.querySelectorAll("[data-quick-add]").forEach(button => button.addEventListener("click", () => {
  const id = button.dataset.quickAdd;
  if (!state.selected.has(id)) toggleProduct(id); else showToast(`${productById(id).name} já está na sua seleção`);
}));

const quizSteps = [...document.querySelectorAll(".quiz-step")];
const progress = document.querySelector("[data-quiz-progress]");
const result = document.querySelector("[data-quiz-result]");

function showQuizStep(index) {
  quizSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== index; step.classList.toggle("active", stepIndex === index); });
  result.hidden = true;
  progress.textContent = `0${index + 1} — 03`;
}

function finishQuiz() {
  quizSteps.forEach(step => step.hidden = true);
  progress.textContent = "SEU RESULTADO";
  result.hidden = false;
  state.size = state.quiz.size;
  persist();
  const matches = products.map(product => ({ product, score: (product.category.includes(state.quiz.occasion) ? 2 : 0) + (product.mood.includes(state.quiz.vibe) ? 2 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.product);
  state.recommendations = matches.map(product => product.id);
  const titles = { leve: "Leve com intenção", classica: "Clássica, nunca óbvia", marcante: "Presença que chega primeiro" };
  document.querySelector("[data-result-title]").textContent = titles[state.quiz.vibe];
  document.querySelector("[data-result-copy]").textContent = `Selecionamos três produções para ${state.quiz.occasion === "dia" ? "o dia a dia" : state.quiz.occasion}, com a energia ${state.quiz.vibe} que você escolheu. Tamanho ${state.quiz.size} será consultado com a equipe.`;
  document.querySelector("[data-result-looks]").innerHTML = matches.map(product => `<div class="result-look"><img src="${product.image}" alt="${product.name}" /><span>${product.name}</span></div>`).join("");
  renderSelection();
}

quizSteps.forEach((step, index) => step.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => {
  state.quiz[step.dataset.step] = button.dataset.answer;
  if (index < quizSteps.length - 1) showQuizStep(index + 1); else finishQuiz();
})));
document.querySelector("[data-add-recommendations]").addEventListener("click", () => {
  state.recommendations.forEach(id => state.selected.add(id)); persist(); renderProducts(); renderSelection(); showToast("Seus 3 matches foram adicionados"); openDrawer();
});
document.querySelector("[data-restart-quiz]").addEventListener("click", () => { state.quiz = { occasion: "", vibe: "", size: "" }; state.recommendations = []; showQuizStep(0); });
document.querySelectorAll(".hotspot").forEach(button => button.addEventListener("click", () => button.focus()));

renderProducts();
renderSelection();
