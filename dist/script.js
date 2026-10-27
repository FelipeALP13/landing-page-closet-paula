const phone = "5512997196086";
const header = document.querySelector("[data-header]");
const modal = document.querySelector("[data-modal]");
const modalImage = document.querySelector("[data-modal-image]");
const modalTitle = document.querySelector("[data-modal-title]");
const whatsappButton = document.querySelector("[data-whatsapp]");
const sizeButtons = [...document.querySelectorAll("[data-size]")];
let activeProduct = "";
let lastTrigger = null;

document.querySelector("[data-year]").textContent = new Date().getFullYear();

const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 40);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observer.observe(el));

function openProduct(card, trigger) {
  activeProduct = card.dataset.product;
  lastTrigger = trigger;
  modalTitle.textContent = activeProduct;
  modalImage.src = card.dataset.image;
  modalImage.alt = activeProduct;
  sizeButtons.forEach((button) => button.classList.remove("selected"));
  whatsappButton.classList.add("is-disabled");
  whatsappButton.setAttribute("aria-disabled", "true");
  whatsappButton.textContent = "Escolha um tamanho";
  whatsappButton.href = "#";
  modal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => document.querySelector(".modal-close").focus());
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastTrigger) lastTrigger.focus();
}

document.querySelectorAll(".product-card").forEach((card) => {
  const trigger = card.querySelector(".product-image");
  trigger.addEventListener("click", () => openProduct(card, trigger));
});

document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeModal));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sizeButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    const size = button.dataset.size;
    const message = `Olá! Vim pelo site da Closet Paula Miranda e gostei do ${activeProduct}. Gostaria de consultar o tamanho ${size}, valor, disponibilidade e opções de entrega/frete.`;
    whatsappButton.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    whatsappButton.textContent = "Consultar no WhatsApp ↗";
    whatsappButton.classList.remove("is-disabled");
    whatsappButton.removeAttribute("aria-disabled");
  });
});
