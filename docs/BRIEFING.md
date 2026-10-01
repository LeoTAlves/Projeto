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
