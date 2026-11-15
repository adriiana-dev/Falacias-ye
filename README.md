# Falácias Ye

Site que sorteia uma frase do Kanye West em inglês e mostra a tradução em português também dá para ouvir as frases, guardar as favoritas, sugerir uma tradução melhor e ver os assuntos da MyMemory.


## Como funciona

1. O site pede uma frase para o nosso servidor.
2. O servidor busca a frase na **Kanye REST**.
3. O site pede a tradução, e o servidor envia o texto para a **MyMemory Translation**.
4. A página mostra a frase e a tradução o botão "Ouvir" lê o texto com a voz do navegador.

O navegador nunca fala direto com as APIs ele chama o servidor (Node.js com Express), e o servidor chama as APIs usando `fetch`. Isso evita problemas de CORS e mantém a arquitetura REST organizada.

## Como rodar

É preciso ter o Node.js (versão 18 ou mais nova) e internet.

```
npm install
npm start
```

Depois abra http://localhost:3000

Nenhuma API precisa de chave.

## APIs e métodos

### Kanye REST

| Método | Endereço | Uso no projeto |
|--------|----------|----------------|
| GET | `https://api.kanye.rest` | Sorteia a frase (`/api/frase`) |

A documentação da Kanye REST só tem o método GET.

### MyMemory Translation

A documentação lista seis métodos:

| Método | Endereço | Uso no projeto |
|--------|----------|----------------|
| Get | `/get?q=TEXTO&langpair=en\|pt-BR` | Traduz a frase (`/api/traduzir`) |
| Set | `/set?seg=TEXTO&tra=TRADUCAO&langpair=en\|pt-BR` | Envia uma tradução melhor (`/api/contribuir`) |
| Subjects | `/subjects` | Lista os assuntos (`/api/assuntos`) |
| Keygen | `/keygen?user=...&pass=...` | Não usado |
| Import | `/v2/tmx/import` | Não usado |
| Status | `/v2/import/status?uuid=...` | Não usado |

Os três últimos não foram usados porque precisam de uma conta na MyMemory e de um arquivo TMX.

Observações:
- Sem chave, a MyMemory aceita cerca de 5.000 caracteres por dia passando disso, o site mostra a mensagem de erro da API.
- A tradução é automática, então algumas frases saem estranhas.
- O Set envia a tradução para a base pública da MyMemory, então qualquer pessoa pode ver a contribuição.
- O método Subjects está na documentação, mas pode não responder se isso acontecer, o site mostra a mensagem de erro.

## Rotas do servidor

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/frase` | Busca uma frase na Kanye REST |
| GET | `/api/traduzir?texto=...` | Traduz o texto (MyMemory Get) |
| POST | `/api/contribuir` | Envia uma tradução (MyMemory Set) |
| GET | `/api/assuntos` | Lista os assuntos (MyMemory Subjects) |
| GET | `/api/favoritos` | Lista os favoritos |
| POST | `/api/favoritos` | Salva um favorito |
| PUT | `/api/favoritos/:id` | Altera a nota de um favorito |
| DELETE | `/api/favoritos/:id` | Remove um favorito |

Exemplo de corpo para `POST /api/contribuir`:

```json
{
  "frase": "I feel like I'm too busy writing history to read it.",
  "traducao": "Sinto que estou ocupado demais escrevendo a história para lê-la."
}
```

As respostas usam JSON e códigos de status: 200 (ok), 201 (criado), 204 (sem conteúdo), 400 (pedido inválido), 404 (não encontrado), 500 (erro no servidor) e 502 (erro na API externa).

Os favoritos ficam na memória e somem quando o servidor é reiniciado.

## Partes do projeto

- **server.js:** cria o servidor Express, define as rotas e chama as APIs com `fetch` todas as instruções têm comentário.
- **public/index.html:** estrutura da página.
- **public/style.css:** o visual foi feito primeiro para celulares e sendo ajustado para telas maiores, o fundo é uma colagem de capas de álbuns com um degradê claro animado por cima.
- **public/script.js:** usa `fetch` para chamar o servidor e monta a tela pelo DOM (`createElement`, `textContent`, `appendChild`) também cuida da voz, dos favoritos, do envio de tradução e da lista de assuntos.
- **public/img/fundo.jpg:** imagem de fundo.

## Voz

O botão "Ouvir" usa a voz do navegador (`speechSynthesis`), em inglês (`en-US`) e português (`pt-BR`). O código procura uma voz "Natural" ou do Google quando existe no Edge e no Chrome o resultado costuma ser melhor.
