// Avisa o servidor que um botão de WhatsApp foi tocado, sem atrasar a abertura do WhatsApp.
export function trackWhatsAppClick(productId = "") {
  try {
    const body = JSON.stringify({ productId });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/clicks", blob)) return;
    void fetch("/api/clicks", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  } catch {}
}
