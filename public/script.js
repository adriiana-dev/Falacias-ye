const fraseOriginal = document.getElementById('fraseOriginal');
const fraseTraduzida = document.getElementById('fraseTraduzida');
const mensagem = document.getElementById('mensagem');
const botaoNovaFrase = document.getElementById('botaoNovaFrase');
const botaoFavoritar = document.getElementById('botaoFavoritar');
const botaoOuvirIngles = document.getElementById('botaoOuvirIngles');
const botaoOuvirPortugues = document.getElementById('botaoOuvirPortugues');
const listaFavoritos = document.getElementById('listaFavoritos');
const listaVazia = document.getElementById('listaVazia');

let fraseAtual = '';
let traducaoAtual = '';

async function buscarFrase() {
  botaoNovaFrase.disabled = true;
  mensagem.textContent = 'Buscando frase...';

  try {
    const respostaFrase = await fetch('/api/frase');
    const dadosFrase = await respostaFrase.json();

    if (!respostaFrase.ok) {
      throw new Error(dadosFrase.erro);
    }

    fraseAtual = dadosFrase.frase;
    fraseOriginal.textContent = fraseAtual;
    fraseTraduzida.textContent = 'Traduzindo...';

    const respostaTraducao = await fetch('/api/traduzir?texto=' + encodeURIComponent(fraseAtual));
    const dadosTraducao = await respostaTraducao.json();

    if (!respostaTraducao.ok) {
      throw new Error(dadosTraducao.erro);
    }

    traducaoAtual = dadosTraducao.traducao;
    fraseTraduzida.textContent = traducaoAtual;
    mensagem.textContent = '';
  } catch (erro) {
    mensagem.textContent = 'Erro: ' + erro.message;
  }

  botaoNovaFrase.disabled = false;
}

function escolherVoz(idioma) {
  const vozes = window.speechSynthesis.getVoices().filter(function (voz) {
    return voz.lang.replace('_', '-').startsWith(idioma);
  });
  const melhor = vozes.find(function (voz) {
    return /natural|google/i.test(voz.name);
  });
  return melhor || vozes[0];
}

function ouvir(texto, idioma) {
  if (!texto) {
    mensagem.textContent = 'Sorteie uma frase primeiro.';
    return;
  }

  window.speechSynthesis.cancel();

  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = idioma;

  const voz = escolherVoz(idioma.slice(0, 2));
  if (voz) {
    fala.voice = voz;
  }

  window.speechSynthesis.speak(fala);
}

async function favoritar() {
  if (!fraseAtual || !traducaoAtual) {
    mensagem.textContent = 'Sorteie uma frase primeiro.';
    return;
  }

  const nota = prompt('Quer escrever uma nota sobre essa frase? (opcional)') || '';

  try {
    const resposta = await fetch('/api/favoritos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase: fraseAtual, traducao: traducaoAtual, nota: nota })
    });

    if (!resposta.ok) {
      throw new Error('Não foi possível salvar.');
    }

    mensagem.textContent = 'Frase salva nos favoritos!';
    carregarFavoritos();
  } catch (erro) {
    mensagem.textContent = 'Erro: ' + erro.message;
  }
}

async function carregarFavoritos() {
  const resposta = await fetch('/api/favoritos');
  const favoritos = await resposta.json();

  listaFavoritos.innerHTML = '';
  listaVazia.style.display = favoritos.length === 0 ? 'block' : 'none';

  favoritos.forEach(function (favorito) {
    const item = document.createElement('li');
    item.className = 'item-favorito';

    const original = document.createElement('p');
    original.className = 'original';
    original.textContent = favorito.frase;

    const traduzida = document.createElement('p');
    traduzida.className = 'traduzida';
    traduzida.textContent = favorito.traducao;

    const nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = favorito.nota ? 'Nota: ' + favorito.nota : '';

    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar nota';
    botaoEditar.addEventListener('click', function () {
      editarNota(favorito);
    });

    const botaoRemover = document.createElement('button');
    botaoRemover.textContent = 'Remover';
    botaoRemover.addEventListener('click', function () {
      removerFavorito(favorito.id);
    });

    item.append(original, traduzida, nota, botaoEditar, botaoRemover);
    listaFavoritos.appendChild(item);
  });
}

async function editarNota(favorito) {
  const novaNota = prompt('Digite a nova nota:', favorito.nota);

  if (novaNota === null) {
    return;
  }

  await fetch('/api/favoritos/' + favorito.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nota: novaNota })
  });

  carregarFavoritos();
}

async function removerFavorito(id) {
  await fetch('/api/favoritos/' + id, { method: 'DELETE' });
  carregarFavoritos();
}

async function sugerirTraducao() {
  if (!fraseAtual || !traducaoAtual) {
    mensagem.textContent = 'Sorteie uma frase primeiro.';
    return;
  }

  const sugestao = prompt('Digite uma tradução melhor para a frase:', traducaoAtual);

  if (!sugestao) {
    return;
  }

  try {
    const resposta = await fetch('/api/contribuir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase: fraseAtual, traducao: sugestao })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro);
    }

    traducaoAtual = sugestao;
    fraseTraduzida.textContent = sugestao;
    mensagem.textContent = dados.mensagem;
  } catch (erro) {
    mensagem.textContent = 'Erro: ' + erro.message;
  }
}

async function verAssuntos() {
  resultadoAssuntos.textContent = 'Buscando assuntos...';

  try {
    const resposta = await fetch('/api/assuntos');
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro);
    }

    const lista = Array.isArray(dados) ? dados : Object.values(dados);
    const nomes = lista.map(function (item) {
      return typeof item === 'string' ? item : item.name || item.subject || JSON.stringify(item);
    });

    resultadoAssuntos.textContent = nomes.join(', ');
  } catch (erro) {
    resultadoAssuntos.textContent = 'Erro: ' + erro.message;
  }
}

const botaoSugerir = document.createElement('button');
botaoSugerir.className = 'botao-secundario';
botaoSugerir.textContent = 'Sugerir tradução melhor';
botaoSugerir.addEventListener('click', sugerirTraducao);
document.querySelector('.acoes').appendChild(botaoSugerir);

const secaoAssuntos = document.createElement('section');
const tituloAssuntos = document.createElement('h2');
tituloAssuntos.textContent = 'Assuntos da MyMemory';
const botaoAssuntos = document.createElement('button');
botaoAssuntos.className = 'botao-secundario';
botaoAssuntos.textContent = 'Ver assuntos';
botaoAssuntos.addEventListener('click', verAssuntos);
const resultadoAssuntos = document.createElement('p');
resultadoAssuntos.className = 'mensagem';
secaoAssuntos.append(tituloAssuntos, botaoAssuntos, resultadoAssuntos);
document.querySelector('main').appendChild(secaoAssuntos);

botaoNovaFrase.addEventListener('click', buscarFrase);
botaoFavoritar.addEventListener('click', favoritar);
botaoOuvirIngles.addEventListener('click', function () {
  ouvir(fraseAtual, 'en-US');
});
botaoOuvirPortugues.addEventListener('click', function () {
  ouvir(traducaoAtual, 'pt-BR');
});

window.speechSynthesis.getVoices();
carregarFavoritos();
buscarFrase();