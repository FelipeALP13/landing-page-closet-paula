import Link from "next/link";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { isMasterEmail } from "../admin-auth";
import type { Metadata } from "next";
import { getStoreData } from "@/lib/store-data";
import { resolveStoreInfo, whatsappLink } from "@/lib/store-info";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Área da loja | Closet Paula Miranda", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await getChatGPTUser();
  const master = user ? isMasterEmail(user.email) : false;
  const storeInfo = resolveStoreInfo((await getStoreData()).content);
  return (
    <main className="login-page">
      <header><Link className="brand dark-brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></Link><div><a href={whatsappLink(storeInfo.whatsappNumber)}>{storeInfo.whatsappDisplay}</a><span>{storeInfo.hours[0]}</span></div></header>
      <section className="login-card">
        <span className="login-icon">○</span>
        <p className="eyebrow">Área administrativa</p>
        <h1>{user ? `Olá, ${user.displayName}` : "Faça seu login"}</h1>
        {!user ? <><p>Entre com a conta ChatGPT autorizada como master para editar fotos e frases do site.</p><a className="button login-button" href={chatGPTSignInPath("/conta")} target="_top">Entrar com ChatGPT</a><small>O login é protegido pela plataforma; nenhuma senha fica salva no site.</small></> : master ? <><p>Você está autenticado como administrador master.</p><Link className="button login-button" href="/admin">Abrir painel da loja</Link><a className="logout-link" href={chatGPTSignOutPath("/")} target="_top">Sair da conta</a></> : <><p>Esta conta não tem permissão para alterar a loja.</p><a className="logout-link" href={chatGPTSignOutPath("/conta")} target="_top">Entrar com outra conta</a></>}
      </section>
      <footer><span>{storeInfo.addressLine} — {storeInfo.cityLine}</span><span>{storeInfo.name}</span></footer>
    </main>
  );
}
