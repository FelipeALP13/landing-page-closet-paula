# Checklist para abertura pública

O site deve permanecer privado até que os dados abaixo sejam confirmados pelo responsável da loja.

## Dados obrigatórios

- Razão social ou nome completo do fornecedor
- CPF ou CNPJ
- E-mail comercial para atendimento e exercício de direitos
- Preço de cada look e eventuais despesas adicionais (podem ficar "sob consulta" no site e ser informados pelo WhatsApp)
- Composição, itens incluídos, cuidados e disponibilidade de cada produto
- Condições de pagamento, retirada, envio e prazo de entrega

## Imagens a substituir

Enviar fotografias originais com pelo menos 1200 px de largura para:

- Azul Claro (`look-04`)
- Branco Leve (`look-07`)
- Camadas de Chocolate (`look-10`)

Esses três looks foram retirados temporariamente da vitrine porque os arquivos disponíveis têm apenas 360 × 640 px. Os originais recebidos foram preservados em `source-assets/low-resolution/`.

## Publicação (desenvolvedor)

- Fazer o merge da branch `melhorias-lancamento` na `main`
- Configurar a variável `ADMIN_EMAIL` na hospedagem com o e-mail da conta ChatGPT da dona (só esse e-mail acessa `/admin`)
- Confirmar que as migrações foram aplicadas no banco de produção:
  - `drizzle/0001_stiff_vision.sql` (`product_details`): salvar uma peça no painel não deve mostrar o aviso sobre `product_details`
  - `drizzle/0002_magenta_ares.sql` (`whatsapp_clicks`): a aba Resumo do painel não deve mostrar o aviso de contagem inativa
  - `drizzle/0003_magenta_anita_blake.sql` (`product_status`): marcar uma peça como "Esgotada" deve mostrar o selo na vitrine
- Configurar domínio próprio, se disponível
- Testar o site publicado no celular e no computador: painel, nova peça, troca de foto, botão de WhatsApp

## No painel (dona da loja)

- Aba **Loja**: razão social, CPF/CNPJ e e-mail (obrigatórios); conferir WhatsApp, endereço, horário e redes sociais
- Aba **Loja**: tabela de medidas (opcional; só aparece no site quando preenchida)
- Aba **Peças**: fotos, tamanhos, detalhes, esgotado/promoção de cada peça; cadastrar as peças de "Shorts & Saias", hoje vazia
- Aba **Página inicial**: fotos de clientes em "Elas usam" (só com autorização delas)
- Revisar os textos de compra, trocas e privacidade em `/informacoes` (comparar com o destaque "Trocas" do Instagram)
- Validar descrições com o estoque real
- Trocar o link da bio do Instagram pelo endereço do site

## Decisões

- Revisar a política comercial com o responsável da loja
- Decidir se haverá métricas de acesso além da contagem anônima de toques no WhatsApp; se houver, atualizar a política de privacidade antes

Não tornar o site público sem uma solicitação expressa do proprietário.
