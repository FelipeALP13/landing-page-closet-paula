import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { isMasterEmail } from "../admin-auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getChatGPTUser();
  const master = user ? isMasterEmail(user.email) : false;
  return (
    <main className="login-page">
      <header><a className="brand dark-brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></a><div><a href="https://wa.me/5512997196086">(12) 99719-6086</a><span>Seg a sex: 09h às 18h</span></div></header>
      <section className="login-card">
        <span className="login-icon">○</span>
        <p className="eyebrow">Área administrativa</p>
        <h1>{user ? `Olá, ${user.displayName}` : "Faça seu login"}</h1>
        {!user ? <><p>Entre com a conta ChatGPT autorizada como master para editar fotos e frases do site.</p><a className="button login-button" href={chatGPTSignInPath("/conta")} target="_top">Entrar com ChatGPT</a><small>O login é protegido pela plataforma; nenhuma senha fica salva no site.</small></> : master ? <><p>Você está autenticado como administrador master.</p><a className="button login-button" href="/admin">Abrir painel da loja</a><a className="logout-link" href={chatGPTSignOutPath("/")} target="_top">Sair da conta</a></> : <><p>Esta conta não tem permissão para alterar a loja.</p><a className="logout-link" href={chatGPTSignOutPath("/conta")} target="_top">Entrar com outra conta</a></>}
      </section>
      <footer><span>Rua Planura, 204 — São José dos Campos / SP</span><span>Closet Paula Miranda</span></footer>
    </main>
  );
}
