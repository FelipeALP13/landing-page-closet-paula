"use client";

import type { ReactNode } from "react";

type GuideTab = "pecas" | "inicio" | "avisos" | "loja" | "resumo";

type Topic = { id: string; title: string; tab?: GuideTab; tabLabel?: string; body: ReactNode };

// Guia de uso do painel para a dona da loja. Texto simples, passo a passo, pensado para o celular.
const topics: Topic[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    tab: "loja",
    tabLabel: "Ir para Loja",
    body: (
      <>
        <p>Antes de divulgar o site, preencha a aba <b>Loja</b>:</p>
        <ol>
          <li>Razão social (ou nome completo), CPF/CNPJ e e-mail de atendimento. São obrigatórios por lei para vender pela internet.</li>
          <li>Confira o WhatsApp, o endereço, os horários e os links do Instagram e do Facebook.</li>
          <li>Clique em <b>Salvar dados da loja</b>.</li>
        </ol>
        <p>Enquanto faltar algum dado obrigatório, a aba Loja mostra um <b>!</b> vermelho.</p>
      </>
    ),
  },
  {
    id: "nova-peca",
    title: "Cadastrar uma peça nova",
    tab: "pecas",
    tabLabel: "Ir para Peças",
    body: (
      <ol>
        <li>Na aba <b>Peças</b>, toque em <b>+ Nova peça</b>. Um cartão novo aparece no topo da lista.</li>
        <li>Em <b>Foto principal</b>, escolha a foto (pode ser direto da galeria do celular).</li>
        <li>Preencha o nome, a categoria, os tamanhos disponíveis e uma descrição curta.</li>
        <li>Toque em <b>Salvar peça</b>. Ela já aparece no site, em primeiro lugar.</li>
      </ol>
    ),
  },
  {
    id: "fotos",
    title: "Trocar ou acrescentar fotos",
    tab: "pecas",
    tabLabel: "Ir para Peças",
    body: (
      <>
        <ul>
          <li><b>Foto de uma peça:</b> no cartão da peça, use <b>Foto principal</b>. A foto troca no site na hora.</li>
          <li><b>Mais fotos da peça:</b> use <b>Fotos extras</b> (até 8). Para tirar uma, toque no <b>×</b> e depois em <b>Salvar alterações</b>.</li>
          <li><b>Foto principal do site, das categorias e da loja:</b> aba <b>Página inicial</b>, em “Fotos”.</li>
        </ul>
        <p><b>Dicas:</b> prefira fotos em pé (retrato), com boa luz. Pode enviar a foto grande do celular: o painel diminui o tamanho sozinho. Se uma foto de iPhone der erro, tire um print dela e envie o print.</p>
      </>
    ),
  },
  {
    id: "elas-usam",
    title: "Fotos de clientes (Elas usam)",
    tab: "inicio",
    tabLabel: "Ir para Página inicial",
    body: (
      <>
        <ol>
          <li>Na aba <b>Página inicial</b>, em “Elas usam”, toque em <b>Adicionar foto</b> e escolha a foto. Ela já aparece no site.</li>
          <li>Se quiser, escreva uma legenda (ex.: o @ da cliente) e toque em <b>Salvar fotos e legendas</b>.</li>
          <li>Para tirar uma foto, toque no <b>×</b> e salve.</li>
        </ol>
        <p><b>Importante:</b> use só fotos de clientes que autorizaram aparecer no site. A seção some sozinha quando não tem nenhuma foto.</p>
      </>
    ),
  },
  {
    id: "ordem",
    title: "Mudar a ordem e os destaques",
    tab: "pecas",
    tabLabel: "Ir para Peças",
    body: (
      <>
        <p>A ordem da lista de peças é a ordem da vitrine. Use as setas <b>↑</b> e <b>↓</b> em cada peça.</p>
        <p>As <b>4 primeiras</b> peças visíveis aparecem em “Destaques” na página inicial. O selo no topo de cada cartão mostra a posição (ex.: “Destaque #1”).</p>
      </>
    ),
  },
  {
    id: "esgotado",
    title: "Peça esgotada, promoção e esconder peça",
    tab: "pecas",
    tabLabel: "Ir para Peças",
    body: (
      <ul>
        <li><b>Esgotada:</b> marque “Esgotada” e salve. A peça continua no site com o selo “Esgotado” e o botão vira “Avise-me quando voltar”.</li>
        <li><b>Promoção:</b> marque “Em promoção” e salve. Aparece o selo “Promoção” e a mensagem do WhatsApp já pergunta o valor promocional.</li>
        <li><b>Esconder sem apagar:</b> desmarque “Peça visível na loja” e salve. Ela some do site, mas continua no painel.</li>
        <li><b>Excluir de vez:</b> botão <b>Excluir</b>. Não dá para desfazer.</li>
      </ul>
    ),
  },
  {
    id: "medidas",
    title: "Tabela de medidas",
    tab: "loja",
    tabLabel: "Ir para Loja",
    body: (
      <>
        <ol>
          <li>Na aba <b>Loja</b>, em “Tabela de medidas”, preencha busto, cintura e quadril de cada tamanho, em centímetros (ex.: 84 a 88).</li>
          <li>Se quiser, escreva uma observação (ex.: “Em dúvida entre dois tamanhos, escolha o maior”).</li>
          <li>Toque em <b>Salvar tabela de medidas</b>.</li>
        </ol>
        <p>A tabela aparece na página de cada peça, no rodapé e no endereço <code>/medidas</code>, que você pode mandar para as clientes pelo WhatsApp. Enquanto estiver vazia, não aparece no site.</p>
      </>
    ),
  },
  {
    id: "precos",
    title: "Preços",
    tab: "pecas",
    tabLabel: "Ir para Peças",
    body: (
      <>
        <p>Com <b>Mostrar preços no site</b> desligado (como está), todas as peças mostram “Valor sob consulta” e o valor é passado pelo WhatsApp. Você pode anotar os preços no painel para controle; eles não aparecem para as clientes.</p>
        <p>Se um dia quiser mostrar os preços, é só ligar essa opção no topo da aba Peças.</p>
      </>
    ),
  },
  {
    id: "avisos",
    title: "Avisos da faixa do topo",
    tab: "avisos",
    tabLabel: "Ir para Avisos",
    body: (
      <ol>
        <li>Na aba <b>Avisos</b>, escreva até 6 avisos curtos (ex.: “Frete grátis em São José dos Campos”).</li>
        <li>Se quiser, coloque um link: uma página do site (ex.: <code>/categoria/vestidos</code>) ou um endereço que comece com <code>https://</code>.</li>
        <li>Toque em <b>Salvar avisos</b>. Eles passam um por vez na faixa rosa do topo.</li>
      </ol>
    ),
  },
  {
    id: "campanha",
    title: "Banner de campanha (Black Friday, coleção nova…)",
    tab: "avisos",
    tabLabel: "Ir para Avisos",
    body: (
      <ol>
        <li>Na aba <b>Avisos</b>, em “Banner de campanha”, escolha a foto e escreva o título, o texto e o botão.</li>
        <li>Se quiser que ela entre e saia sozinha, preencha as datas de início e fim.</li>
        <li>Marque <b>Mostrar campanha no site</b> e toque em <b>Salvar campanha</b>.</li>
      </ol>
    ),
  },
  {
    id: "resumo",
    title: "Ver quais peças chamam mais atenção",
    tab: "resumo",
    tabLabel: "Ir para Resumo",
    body: (
      <p>A aba <b>Resumo</b> mostra quantas vezes as clientes tocaram nos botões de WhatsApp nos últimos 30 dias e quais peças foram mais procuradas. A contagem é anônima: não mostra quem tocou.</p>
    ),
  },
  {
    id: "salvar",
    title: "Importante: salvar e o que não muda",
    body: (
      <ul>
        <li>Fotos são publicadas assim que terminam de enviar. Textos e opções só mudam no site depois de tocar no botão <b>Salvar</b> da seção.</li>
        <li>Cada botão Salvar grava só a sua seção. O que você estiver editando em outra aba não vai junto.</li>
        <li>O nome da loja e os créditos de quem fez o site são fixos e não aparecem no painel.</li>
        <li>Para ver como ficou, use <b>Ver loja</b>, no topo do painel.</li>
      </ul>
    ),
  },
];

export function AdminGuide({ onOpenTab }: { onOpenTab: (tab: GuideTab) => void }) {
  return (
    <section className="admin-section admin-guide">
      <div>
        <p className="eyebrow">Ajuda / Guia de uso</p><h2>Como usar o painel</h2>
        <p className="admin-help">Toque num assunto para abrir o passo a passo.</p>
      </div>
      <div className="guide-topics">
        {topics.map((topic, index) => (
          <details key={topic.id} open={index === 0}>
            <summary>{topic.title}</summary>
            <div className="guide-body">
              {topic.body}
              {topic.tab && <button type="button" className="button outline" onClick={() => onOpenTab(topic.tab!)}>{topic.tabLabel} →</button>}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
