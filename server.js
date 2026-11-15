// importa o express para criar o servidor e as rotas
const express = require('express');
// importa o path para montar o caminho da pasta public
const path = require('path');

// cria a aplicação
const app = express();
// porta onde o servidor vai rodar
const PORTA = 3000;

// faz o servidor entender JSON no corpo das requisições
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// lista de favoritos, fica na memória enquanto o servidor estiver ligado
let favoritos = [];
// número usado como id do próximo favorito
let proximoId = 1;

// GET /api/frase: busca uma frase aleatória na Kanye REST
app.get('/api/frase', async (req, res) => {
  // tenta fazer a busca
  try {
    // chama a Kanye REST com fetch
    const resposta = await fetch('https://api.kanye.rest');
    // transforma a resposta em objeto
    const dados = await resposta.json();
    // devolve só a frase para o site
    res.json({ frase: dados.quote });
  // se der erro na busca
  } catch (erro) {
    // responde com status 500 e uma mensagem
    res.status(500).json({ erro: 'Não foi possível buscar a frase.' });
  }
});

// GET /api/traduzir: traduz um texto de inglês para português na MyMemory
app.get('/api/traduzir', async (req, res) => {
  // pega o texto que veio na url (?texto=...)
  const texto = req.query.texto;

  // se não veio texto
  if (!texto) {
    // responde com status pedido inválido (400)
    return res.status(400).json({ erro: 'Envie o texto para traduzir.' });
  }

  // tenta fazer a tradução
  try {
    // monta a url do método get da MyMemory
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(texto) + '&langpair=en|pt-BR';
    // chama a MyMemory com fetch
    const resposta = await fetch(url);
    // transforma a resposta em objeto
    const dados = await resposta.json();

    // a MyMemory avisa no responseStatus quando algo dá errado 
    if (Number(dados.responseStatus) !== 200) {
      // responde com status 502 e a mensagem da própria API
      return res.status(502).json({ erro: dados.responseDetails || 'Erro na tradução.' });
    }

    // devolve só o texto traduzido
    res.json({ traducao: dados.responseData.translatedText });
  // se der erro na busca
  } catch (erro) {
    // responde com status 500 e uma mensagem
    res.status(500).json({ erro: 'Não foi possível traduzir.' });
  }
});

// POST /api/contribuir: envia uma tradução melhor para a MyMemory (método set)
app.post('/api/contribuir', async (req, res) => {
  // pega a frase em inglês e a tradução enviadas pelo site
  const { frase, traducao } = req.body;

  // se faltar alguma das duas
  if (!frase || !traducao) {
    // responde com status pedido inválido (400)
    return res.status(400).json({ erro: 'Envie a frase e a tradução.' });
  }

  // tenta enviar a contribuição
  try {
    // monta a url do método set com a frase, a tradução e o par de idiomas
    const url = 'https://api.mymemory.translated.net/set?seg=' + encodeURIComponent(frase) + '&tra=' + encodeURIComponent(traducao) + '&langpair=en|pt-BR';
    // chama a MyMemory com fetch
    const resposta = await fetch(url);
    // transforma a resposta em objeto
    const dados = await resposta.json();

    // se a API recusou a contribuição
    if (!resposta.ok || (dados.responseStatus && Number(dados.responseStatus) !== 200)) {
      // responde com status 502 e a mensagem da API
      return res.status(502).json({ erro: dados.responseDetails || 'A MyMemory recusou a tradução.' });
    }

    // avisa o site que deu certo
    res.json({ mensagem: 'Tradução enviada para a MyMemory.' });
  // se der erro no envio
  } catch (erro) {
    // responde com status 500 e uma mensagem
    res.status(500).json({ erro: 'Não foi possível enviar a tradução.' });
  }
});

// GET /api/assuntos: lista os assuntos da MyMemory (método subjects)
app.get('/api/assuntos', async (req, res) => {
  // tenta fazer a busca
  try {
    // chama a MyMemory com fetch
    const resposta = await fetch('https://api.mymemory.translated.net/subjects');

    // se a API não respondeu direito
    if (!resposta.ok) {
      // responde com status 502 e uma mensagem
      return res.status(502).json({ erro: 'A MyMemory não devolveu a lista de assuntos.' });
    }

    // transforma a resposta em objeto
    const dados = await resposta.json();
    // devolve a lista para o site
    res.json(dados);
  // se der erro na busca
  } catch (erro) {
    // responde com status 500 e uma mensagem
    res.status(500).json({ erro: 'Não foi possível buscar os assuntos.' });
  }
});

// GET /api/favoritos: lista os favoritos
app.get('/api/favoritos', (req, res) => {
  // devolve a lista inteira
  res.json(favoritos);
});

// POST /api/favoritos: salva um favorito novo
app.post('/api/favoritos', (req, res) => {
  // pega a frase, a tradução e a nota enviadas pelo site
  const { frase, traducao, nota } = req.body;

  // se faltar a frase ou a tradução
  if (!frase || !traducao) {
    // responde com status pedido inválido (400)
    return res.status(400).json({ erro: 'Frase e tradução são obrigatórias.' });
  }

  // monta o favorito com um id novo
  const novoFavorito = { id: proximoId, frase: frase, traducao: traducao, nota: nota || '' };
  // aumenta o id para o próximo favorito
  proximoId++;
  // guarda o favorito na lista
  favoritos.push(novoFavorito);
  // responde com status criado (201) e o favorito salvo
  res.status(201).json(novoFavorito);
});

// PUT /api/favoritos/:id: altera a nota de um favorito
app.put('/api/favoritos/:id', (req, res) => {
  // pega o id da url e transforma em número
  const id = Number(req.params.id);
  // procura o favorito na lista
  const favorito = favoritos.find((item) => item.id === id);

  // se não achou
  if (!favorito) {
    // responde com status não encontrado (404)
    return res.status(404).json({ erro: 'Favorito não encontrado.' });
  }

  // troca a nota pelo valor enviado
  favorito.nota = req.body.nota || '';
  // devolve o favorito atualizado
  res.json(favorito);
});

// DELETE /api/favoritos/:id: remove um favorito
app.delete('/api/favoritos/:id', (req, res) => {
  // pega o id da url e transforma em número
  const id = Number(req.params.id);
  // procura a posição do favorito na lista
  const posicao = favoritos.findIndex((item) => item.id === id);

  // se não achou
  if (posicao === -1) {
    // responde com status  não encontrado (404)
    return res.status(404).json({ erro: 'Favorito não encontrado.' });
  }

  // tira o favorito da lista
  favoritos.splice(posicao, 1);
  // responde com status sem conteúdo (204)
  res.status(204).send();
});

// liga o servidor na porta definida
app.listen(PORTA, () => {
  // mostra o endereço no terminal
  console.log('Servidor rodando em http://localhost:' + PORTA);
});