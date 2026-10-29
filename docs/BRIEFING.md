# Briefing do projeto

## Objetivo
Este projeto resolve a gestão de objetos perdidos em um festival grande de outubro, com três pavilhões e muitas visitas por noite. A pessoa registra uma perda e a equipe do balcão cruza a informação com objetos achados para avisar se pode buscar.

## Perfil visitante
- Nome: Lúcia
- Dispositivo: celular
- Ações: registrar perda, visualizar avisos e ler ocorrências.
- Requisito: a tela informa o visitante_id na requisição para o back.

## Perfil da gestão
- Nome: Rodrigo
- Dispositivo: computador
- Ações: ver avisos por pavilhão, abrir um aviso e registrar ocorrência.
- Requisito: os filtros por pavilhão agilizam a conferência.

## Regras de negócio
- Aviso novo inicia em procurando.
- Ocorrência de tipo objeto achado muda para aguardando retirada.
- Ocorrência de tipo devolucao muda para devolvido.
- Não pode haver nova ocorrência num aviso já devolvido.

## O que mudou

O projeto passou a persistir os dados no MySQL e possui migrations do Alembic.
Essa mudança foi provavelmente uma exigência da aula `?`.

O backend passou a ter autenticação com login, senha e token JWT, além dos grupos
`visitante` e `equipe`. Essa mudança atende à exigência da aula e aumenta a
segurança do projeto.

O dono do aviso não deve mais ser confiado ao `visitante_id` enviado no corpo da
requisição. O backend identifica o usuário pelo token, evitando que uma pessoa
crie ou consulte registros em nome de outro visitante.

A API passou a usar paginação para a listagem de avisos, conforme a exigência da
aula. O filtro por pavilhão continua disponível para a equipe.

As regras de acesso atuais são:

- o visitante cria avisos e consulta somente os próprios;
- a equipe consulta os avisos e registra ocorrências;
- avisos devolvidos não aceitam novas ocorrências.

O backend já possui as rotas de login, usuários, avisos e ocorrências. A tela
`O balcão` lista avisos, e a tela `A ocorrência` registra achados e devoluções.

A integração do login com o frontend ainda está pendente. Atualmente, o backend
exige autenticação, mas as telas ainda usam a seleção de perfil e não enviam o
token nas chamadas da API.

## Funcionalidade planejada com IA

A funcionalidade está planejada e ainda não foi implementada.

### Perfil e problema

Rodrigo, da equipe do balcão, usará a funcionalidade na tela `O balcão` ou no
fluxo da tela `A ocorrência`. O problema é comparar manualmente um objeto achado
com os avisos de perda existentes.

### Funcionamento

Rodrigo informará, em campos separados: categoria, cor, marca, modelo,
características distintivas, pavilhão, turno e data.

As cinco primeiras informações são características do objeto. Para uma
correspondência ser apresentada, pelo menos três delas precisam ser compatíveis.
Pavilhão, turno e data não contam para esse mínimo. Eles servem para priorizar a
análise.

O backend consultará os avisos e enviará os dados ao agente de comparação. O
agente analisará todos os avisos com pelo menos três características compatíveis,
priorizará avisos com situação `procurando`, retornará pontuação de 0 a 10,
explicará as características compatíveis e mostrará avisos `devolvido` como
bloqueados para nova ocorrência.

### Agente, dados e ferramentas

Será usado um único agente de comparação. Ele receberá os campos do objeto
achado, a lista de avisos, o id e a situação de cada aviso.

Ele não terá acesso direto ao banco e não usará ferramentas externas. Não poderá
criar ocorrências, alterar situações, gravar dados ou decidir a correspondência
final. Rodrigo deverá conferir a sugestão antes de registrar a ocorrência.

### Continuidade quando a IA falhar

Se Rodrigo preencher menos de três características do objeto, a IA deverá pedir
mais informações. Se a IA não encontrar correspondências, errar ou não responder,
Rodrigo continuará pelo fluxo manual, usando os filtros e registrando a ocorrência
diretamente.

A regra de negócio continuará no serviço do backend. A IA nunca decidirá sozinha
a devolução nem gravará uma ocorrência.

### Provedor e integração

O provedor proposto para o MVP é a API da OpenAI `?`. Essa escolha ainda não foi
aprovada. Claude, Gemini ou outro provedor continuam como alternativas `?`.

A integração deverá ficar isolada em uma camada própria, para permitir trocar o
provedor sem alterar as rotas ou a regra do serviço.

A proposta atual é usar uma chamada ao modelo e nenhum agente adicional. Um agente
com ferramentas de leitura só será considerado se o volume de avisos exigir
consultas em etapas `?`.

A funcionalidade permanece planejada. Ainda não existe rota, serviço, tela,
chamada de API ou integração com provedor.

Os testes manuais registrados em `.docs/ia.md` cobriram uma entrada normal, uma
entrada com menos de três características e uma entrada fora do assunto. Os
resultados confirmaram o formato JSON, a recusa de entradas insuficientes e a
recusa de assuntos fora do escopo. Esses testes avaliaram apenas o prompt manual,
não a integração via API.
