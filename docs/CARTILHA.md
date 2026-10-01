# Cartilha 5 · Cadê, achados e perdidos de evento

**Esta cartilha foi sorteada para dois alunos.** Vocês receberam o mesmo problema e vão entregar
soluções diferentes. Não combinem marca, paleta, telas nem nomes de rota. Na apresentação, cada
um explica as escolhas que fez e por que não fez as do colega.

## O negócio

A organização de uma festa grande de outubro, com três pavilhões e milhares de visitantes por noite.
Todo dia chegam dezenas de objetos perdidos ao balcão. Hoje o visitante descreve o que perdeu num
papel, e ninguém cruza o papel com a caixa de achados.

## Perfil A · Lúcia, a visitante. Usa no celular.

Lúcia tem 52 anos e perdeu os óculos de grau num dos pavilhões. Quer registrar a perda na hora,
pelo celular, e saber se acharam sem precisar voltar ao balcão.

O que ela faz:

1. Registra o que perdeu, com a descrição, o pavilhão e a noite.
2. Vê os avisos dela e a situação de cada um.
3. Abre um aviso e lê as ocorrências: o que foi achado, e se já pode buscar.

## Perfil B · Rodrigo, da equipe do balcão. Usa no computador.

Rodrigo recebe os objetos que a limpeza e os seguranças trazem. Precisa cruzar cada objeto com os
avisos abertos, rápido, antes de a caixa encher.

O que ele faz:

1. Vê os avisos, filtrados por pavilhão.
2. Abre um aviso e registra uma ocorrência: um objeto achado que parece ser aquele, ou a devolução.
3. Confere que o aviso mudou de situação.

## As três entidades

- **O usuário.** Quem entra no sistema. Tem um tipo: visitante ou equipe.
- **O aviso de perda.** Pertence a um visitante. Guarda a descrição, o pavilhão, a noite e a situação.
- **A ocorrência.** Pertence a um aviso. Guarda o tipo, a descrição e a data.

## As quatro telas

Da pessoa, pensadas para o celular:

1. **Registrar perda.** O formulário que a Lúcia preenche assim que dá falta do objeto.
2. **Meus avisos.** Os avisos dela, com a situação, e as ocorrências de cada um.

Da gestão, pensadas para o computador:

3. **O balcão.** Todos os avisos, com o filtro por pavilhão.
4. **A ocorrência.** O formulário que registra uma ocorrência num aviso.

Todas as telas funcionam nos dois tamanhos. O aparelho de cada perfil diz onde a tela precisa
estar impecável.

## O que o back precisa oferecer

1. Listar os avisos, com filtro por pavilhão e por visitante.
2. Mostrar um aviso.
3. Registrar um aviso novo.
4. Listar as ocorrências de um aviso.
5. Registrar uma ocorrência num aviso, aplicando a regra abaixo.

Os caminhos, os métodos, os nomes e os status são decisão sua. A régua é o REST da aula 2, e na
apresentação você defende cada escolha.

## A regra que o serviço cuida

O aviso novo começa como **procurando**. Uma ocorrência de objeto achado muda a situação para
**aguardando retirada**. Uma ocorrência de devolução muda para **devolvido**, e o serviço recusa
qualquer ocorrência nova num aviso já devolvido.

## Antes do login

Enquanto o login não chega, o front deixa escolher o perfil numa lista, sem senha. A tela da
pessoa pede ao back só o que é dela, informando quem ela é na própria requisição.

## O que não faz parte

Foto do objeto, recompensa, busca por texto e aviso por mensagem.

## O que vem depois

No ciclo 2 esses dados saem da memória e vão para o MySQL. No ciclo 4 o usuário ganha senha, e
Lúcia passa a ver só os avisos dela, porque o back confere quem está pedindo. No ciclo 5
entra um trecho de IA. A cartilha foi desenhada para aguentar as três coisas: não troque de ideia
no meio do caminho.
