# Identidade visual · Cadê!?

## Paleta

- Azul profundo: `#172c40`, para marca, títulos e ações principais.
- Dourado: `#efba4b`, para o símbolo da marca e detalhes de destaque.
- Fundo de papel: `#f7f6f2`, com cartões brancos e bordas discretas.
- Texto de apoio: `#586a75`.

## Situações e ocorrências

| Texto | Fundo | Texto da etiqueta | Símbolo |
|---|---|---|---|
| Procurando | `#fff4d6` | `#795109` | ? |
| Aguardando retirada | `#eaf2ff` | `#24508c` | ↗ |
| Devolvido | `#e8f5ec` | `#226441` | ✓ |
| Objeto achado | Mesmo azul da retirada | Mesmo azul da retirada | ↗ |
| Devolução | Mesmo verde de devolvido | Mesmo verde de devolvido | ✓ |

O componente `frontend/src/componentes/Situacao.jsx` mantém o padrão em listas,
detalhes e ocorrências. O texto permanece visível para que a identificação não
dependa apenas da cor. Valores desconhecidos recebem etiqueta neutra.

## Tipografia

- Segoe UI, com Arial e sans serif como alternativas locais. Sem fontes externas.
- Títulos com peso forte e espaço suficiente entre os blocos.
- Texto de apoio em tom neutro e legível.

## Direções visuais

- A interface prioriza leitura simples, botões claros e contraste forte.
- O foco do visitante é o registro e o acompanhamento do aviso.
- O foco da gestão é a velocidade de leitura e a validação de ocorrências.
- Login com apresentação da marca e formulário separado no computador; uma coluna
  no celular. Navegação indica a tela atual com `aria-current`.
- Símbolo e nome usam texto nativo no componente `Marca.jsx`.
- Campos e botões mantêm foco visível para navegação por teclado.
