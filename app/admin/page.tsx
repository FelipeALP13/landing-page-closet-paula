import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { isMasterEmail } from "../admin-auth";
import { getStoreData } from "@/lib/store-data";
import { AdminPanel } from "@/components/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isMasterEmail(user.email)) return <main className="admin-denied"><h1>Acesso restrito</h1><p>Esta conta não é o usuário master da loja.</p><a href={chatGPTSignOutPath("/conta")} target="_top">Entrar com outra conta</a></main>;
  const data = await getStoreData();
  return <AdminPanel {...data} userName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
