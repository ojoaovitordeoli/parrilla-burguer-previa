/* Tela da vitrine. Regras de conta ficam em loja.js; aqui só desenha e reage. */
(function () {
  'use strict';
  const L = window.Loja;
  const loja = window.LOJA;
  if (!loja || !loja.marca) {
    document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">Configuração da loja não encontrada (config.js).</p>';
    return;
  }
  const orcamento = loja.modo === 'orcamento';
  const $ = (s) => document.querySelector(s);

  /* ---------- utilidades ---------- */
  function el(tag, attrs, ...filhos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'html') n.innerHTML = v; // só para ícones fixos deste arquivo
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat()) if (f != null && f !== false) n.append(f.nodeType ? f : String(f));
    return n;
  }
  /** replaceChildren que ignora null/false (partes opcionais da tela). */
  function preencher(no, ...filhos) {
    no.replaceChildren(...filhos.flat(Infinity).filter((f) => f != null && f !== false));
  }
  const guardar = {
    ler(k, padrao) { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } },
    gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* aba anônima */ } },
  };
  /** Só aceita link http(s) vindo da configuração. */
  const linkSeguro = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
  const chaveLoja = 'vitrine:' + (loja.marca.nome || 'loja');
  const precoTexto = (p, centavos) => (orcamento || p.preco == null || p.preco === '' ? 'Consultar' : L.reais(centavos));
  let toastTimer;
  function aviso(texto) {
    const t = $('#toast');
    t.textContent = texto;
    t.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('mostrar'), 2600);
  }
  function abrir(dlg) {
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add('travado');
  }
  function fechar(dlg) {
    if (dlg.open) dlg.close();
  }
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('travado');
    });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  const ICONE_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>';
  const botaoFechar = (dlg) => el('button', { type: 'button', class: 'fechar', 'aria-label': 'Fechar', html: ICONE_X, onclick: () => fechar(dlg) });

  /* ---------- tema pela cor da marca ---------- */
  function luminancia(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const cor = /^#[0-9a-f]{6}$/i.test(loja.marca.cor) ? loja.marca.cor : '#1F7A4D';
  const raiz = document.documentElement.style;
  raiz.setProperty('--marca', cor);
  raiz.setProperty('--sobre-marca', luminancia(cor) > 0.42 ? '#141414' : '#ffffff');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', cor);

  /* ---------- topo ---------- */
  document.title = loja.marca.nome + (orcamento ? ' — Catálogo' : ' — Cardápio e pedidos');
  $('#nome-loja').textContent = loja.marca.nome;
  $('#slogan').textContent = loja.marca.slogan || '';
  if (!loja.marca.capa) $('#capa').classList.add('sem-foto');
  if (loja.marca.capa) $('#capa').style.backgroundImage = `url("${encodeURI(loja.marca.capa)}")`;
  const logo = $('#logo');
  if (loja.marca.logo) logo.append(el('img', { src: loja.marca.logo, alt: '' }));
  else logo.textContent = loja.marca.nome.split(/\s+/).filter((w) => /\w/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (loja.aviso) { $('#aviso').textContent = loja.aviso; $('#aviso').hidden = false; }
  if (loja.demonstracao) {
    $('#demo').hidden = false;
    $('#demo').textContent = 'Loja de demonstração: os produtos e o WhatsApp são de exemplo.';
  }

  function desenharInfo() {
    const info = $('#info');
    info.replaceChildren();
    const st = L.statusHorario(loja);
    if (!st.semHorario) info.append(el('span', { class: 'status ' + (st.aberto ? 'aberto' : 'fechado') }, st.texto));
    const e = loja.entrega || {};
    if (!orcamento && e.delivery && e.tempo) info.append(el('span', {}, 'Entrega ' + e.tempo));
    if (!orcamento && e.pedidoMinimo) info.append(el('span', {}, 'Mínimo ' + L.reais(L.centavos(e.pedidoMinimo))));
    return st;
  }
  let status = desenharInfo();
  setInterval(() => { status = desenharInfo(); atualizarBarra(); }, 60000);

  const rod = $('#rodape');
  const c = loja.contato || {};
  if (c.endereco) rod.append(el('p', {}, linkSeguro(c.mapa) ? el('a', { href: linkSeguro(c.mapa), target: '_blank', rel: 'noopener' }, c.endereco) : c.endereco));
  const links = el('p', { class: 'links' });
  if (c.whatsapp) links.append(el('a', { href: L.linkWhatsApp(c.whatsapp, 'Olá!'), target: '_blank', rel: 'noopener' }, 'WhatsApp'));
  if (c.instagram) links.append(el('a', { href: 'https://instagram.com/' + String(c.instagram).replace(/^@/, ''), target: '_blank', rel: 'noopener' }, 'Instagram'));
  if (links.childNodes.length) rod.append(links);
  if (loja.rodape && loja.rodape.credito) {
    rod.append(el('p', { class: 'credito' }, linkSeguro(loja.rodape.link) ? el('a', { href: linkSeguro(loja.rodape.link), target: '_blank', rel: 'noopener' }, loja.rodape.credito) : loja.rodape.credito));
  }

  /* ---------- cardápio ---------- */
  const categorias = (loja.categorias || []).filter((cat) => loja.produtos.some((p) => p.categoria === cat.id));
  const destaques = loja.produtos.filter((p) => p.destaque && !p.esgotado);

  function cartaoProduto(p) {
    const unit = L.centavos(p.preco);
    const temOpcaoPaga = (p.opcoes || []).some((g) => g.obrigatorio && g.itens.some((i) => Number(i.preco) > 0));
    return el('button', {
      type: 'button', class: 'produto' + (p.esgotado ? ' esgotado' : ''), 'data-nome': (p.nome + ' ' + (p.descricao || '')).toLowerCase(),
      disabled: p.esgotado, onclick: () => abrirProduto(p),
    },
    el('span', { class: 'produto-texto' },
      el('span', { class: 'produto-nome' }, p.nome),
      p.descricao ? el('span', { class: 'produto-desc' }, p.descricao) : null,
      el('span', { class: 'produto-preco' }, p.esgotado ? 'Esgotado' : (temOpcaoPaga && !orcamento ? 'A partir de ' : '') + precoTexto(p, unit))),
    p.foto ? el('img', { class: 'produto-foto', src: p.foto, alt: '', loading: 'lazy', decoding: 'async' }) : null);
  }

  const lista = $('#lista');
  const abas = $('#abas');
  if (destaques.length && !orcamento) {
    lista.append(el('section', { class: 'secao', id: 'sec-destaques' },
      el('h2', {}, 'Mais pedidos'),
      el('div', { class: 'grade' }, destaques.map(cartaoProduto))));
  }
  categorias.forEach((cat) => {
    lista.append(el('section', { class: 'secao', id: 'sec-' + cat.id, 'data-cat': cat.id },
      el('h2', {}, cat.nome),
      el('div', { class: 'grade' }, loja.produtos.filter((p) => p.categoria === cat.id).map(cartaoProduto))));
    abas.append(el('a', { href: '#sec-' + cat.id, 'data-cat': cat.id }, cat.nome));
  });
  if (categorias.length < 2) abas.hidden = true;

  // aba ativa conforme a rolagem
  const observador = 'IntersectionObserver' in window && new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      abas.querySelectorAll('a').forEach((a) => a.classList.toggle('ativa', a.dataset.cat === en.target.dataset.cat));
      const ativa = abas.querySelector('a.ativa');
      if (ativa) abas.scrollTo({ left: ativa.offsetLeft - 16, behavior: 'smooth' });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  if (observador) lista.querySelectorAll('section[data-cat]').forEach((s) => observador.observe(s));

  $('#busca').addEventListener('input', (e) => {
    const termo = e.target.value.trim().toLowerCase();
    let algum = false;
    lista.querySelectorAll('.secao').forEach((sec) => {
      if (sec.id === 'sec-destaques') { sec.hidden = !!termo; return; }
      let visiveis = 0;
      sec.querySelectorAll('.produto').forEach((b) => {
        const ok = !termo || b.dataset.nome.includes(termo);
        b.hidden = !ok;
        if (ok) visiveis++;
      });
      sec.hidden = visiveis === 0;
      if (visiveis) algum = true;
    });
    $('#vazio-busca').hidden = algum;
  });

  /* ---------- carrinho ---------- */
  let carrinho = L.limparCarrinho(loja, guardar.ler(chaveLoja + ':carrinho', []));
  const salvarCarrinho = () => guardar.gravar(chaveLoja + ':carrinho', carrinho);

  function adicionar(produto, escolhas, qtd, obs) {
    const chave = L.chaveItem(produto.id, escolhas, obs);
    const existente = carrinho.find((i) => L.chaveItem(i.produtoId, i.escolhas, i.obs) === chave);
    if (existente) existente.qtd += qtd;
    else carrinho.push({ produtoId: produto.id, escolhas, qtd, obs: obs.trim() });
    salvarCarrinho();
    atualizarBarra();
  }

  function atualizarBarra() {
    const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
    $('#barra').hidden = qtd === 0;
    document.body.classList.toggle('com-barra', qtd > 0);
    $('#barra-qtd').textContent = qtd;
    $('#barra-rotulo').textContent = orcamento ? 'Ver lista' : 'Ver pedido';
    $('#barra-total').textContent = orcamento ? '' : L.reais(L.subtotal(loja, carrinho));
  }
  $('#abrir-carrinho').addEventListener('click', abrirCarrinho);

  /* ---------- folha do produto ---------- */
  const dlgProd = $('#dlg-produto');
  function abrirProduto(p) {
    const escolhas = {};
    let qtd = 1;
    const obs = el('textarea', { id: 'prod-obs', rows: 2, maxlength: 140, placeholder: 'Ex.: sem cebola' });
    const botao = el('button', { type: 'button', class: 'botao-principal largo' });
    const erro = el('p', { class: 'erro', role: 'alert' });
    const qtdTexto = el('span', { class: 'qtd-num', 'aria-live': 'polite' }, '1');

    function atualizar() {
      qtdTexto.textContent = qtd;
      const unit = L.precoUnitario(p, escolhas);
      botao.textContent = orcamento ? 'Adicionar à lista' : `Adicionar · ${precoTexto(p, unit * qtd)}`;
    }

    const grupos = (p.opcoes || []).map((g, gi) => {
      const tipo = g.tipo === 'uma' ? 'radio' : 'checkbox';
      const regra = g.tipo === 'uma' ? 'Escolha 1' : g.max ? `Até ${g.max}` : 'Opcional';
      return el('fieldset', { class: 'grupo' },
        el('legend', {}, el('span', {}, g.nome), el('small', { class: g.obrigatorio ? 'obrig' : '' }, g.obrigatorio ? 'Obrigatório · ' + regra : regra)),
        g.itens.map((it, ii) => {
          const input = el('input', {
            type: tipo, name: `g${gi}`, value: ii,
            onchange: (e) => {
              const marcadas = [...dlgProd.querySelectorAll(`input[name="g${gi}"]:checked`)].map((x) => Number(x.value));
              if (g.max && marcadas.length > g.max) {
                e.target.checked = false;
                aviso(`Máximo de ${g.max} em ${g.nome.toLowerCase()}.`);
                return;
              }
              escolhas[gi] = marcadas;
              atualizar();
            },
          });
          return el('label', { class: 'opcao' }, input, el('span', {}, it.nome),
            Number(it.preco) > 0 && !orcamento ? el('span', { class: 'mais' }, '+ ' + L.reais(L.centavos(it.preco))) : null);
        }));
    });

    preencher(dlgProd, 
      el('div', { class: 'folha-corpo' },
        botaoFechar(dlgProd),
        p.foto ? el('img', { class: 'prod-foto', src: p.foto, alt: '' }) : null,
        el('h2', { id: 'prod-nome' }, p.nome),
        p.descricao ? el('p', { class: 'prod-desc' }, p.descricao) : null,
        el('p', { class: 'prod-preco' }, precoTexto(p, L.centavos(p.preco))),
        grupos,
        el('label', { class: 'campo', for: 'prod-obs' }, el('span', {}, 'Alguma observação?'), obs)),
      el('div', { class: 'folha-acoes' },
        erro,
        el('div', { class: 'linha' },
          el('div', { class: 'qtd' },
            el('button', { type: 'button', 'aria-label': 'Diminuir', onclick: () => { if (qtd > 1) { qtd--; atualizar(); } } }, '−'),
            qtdTexto,
            el('button', { type: 'button', 'aria-label': 'Aumentar', onclick: () => { if (qtd < 50) { qtd++; atualizar(); } } }, '+')),
          botao)));

    botao.addEventListener('click', () => {
      const erros = L.validarEscolhas(p, escolhas);
      if (erros.length) { erro.textContent = erros[0]; return; }
      adicionar(p, JSON.parse(JSON.stringify(escolhas)), qtd, obs.value);
      fechar(dlgProd);
      aviso(`${qtd}x ${p.nome} adicionado`);
    });
    atualizar();
    abrir(dlgProd);
    dlgProd.querySelector('.folha-corpo').scrollTop = 0;
  }

  /* ---------- carrinho + dados do cliente ---------- */
  const dlgCar = $('#dlg-carrinho');
  const cliente = guardar.ler(chaveLoja + ':cliente', {});
  const e = loja.entrega || {};
  const pg = loja.pagamento || {};
  const formasPag = orcamento ? [] : [
    pg.pix && pg.pix.ativo && pg.pix.chave ? ['pix', 'Pix'] : null,
    pg.cartao ? ['cartao', 'Cartão na entrega'] : null,
    pg.dinheiro ? ['dinheiro', 'Dinheiro'] : null,
  ].filter(Boolean);
  const formasEntrega = orcamento ? [] : [e.delivery ? ['entrega', 'Entrega'] : null, e.retirada ? ['retirada', 'Retirar no local'] : null].filter(Boolean);

  function abrirCarrinho() {
    carrinho = L.limparCarrinho(loja, carrinho);
    const estado = {
      nome: cliente.nome || '', endereco: cliente.endereco || '', bairro: cliente.bairro || '',
      forma: formasEntrega.length === 1 ? formasEntrega[0][0] : cliente.forma || '',
      pagamento: formasPag.length === 1 ? formasPag[0][0] : '',
      troco: '', observacao: '', lembrar: cliente.lembrar !== false,
    };
    if (!formasEntrega.some(([v]) => v === estado.forma)) estado.forma = formasEntrega.length === 1 ? formasEntrega[0][0] : '';

    const corpo = el('div', { class: 'folha-corpo' });
    const acoes = el('div', { class: 'folha-acoes' });
    dlgCar.replaceChildren(corpo, acoes);

    function desenhar() {
      const t = L.totais(loja, { ...estado, itens: carrinho });
      preencher(corpo, 
        botaoFechar(dlgCar),
        el('h2', { id: 'carrinho-titulo' }, orcamento ? 'Sua lista' : 'Seu pedido'),
        carrinho.length === 0 ? el('p', { class: 'vazio' }, 'Nada por aqui ainda.') : null,
        el('ul', { class: 'itens' }, carrinho.map((it, idx) => {
          const p = L.acharProduto(loja, it.produtoId);
          const unit = L.precoUnitario(p, it.escolhas);
          return el('li', {},
            el('div', { class: 'item-texto' },
              el('strong', {}, p.nome),
              L.descreverEscolhas(p, it.escolhas).map((d) => el('small', {}, d)),
              it.obs ? el('small', {}, 'Obs.: ' + it.obs) : null,
              orcamento ? null : el('span', { class: 'item-preco' }, precoTexto(p, unit * it.qtd))),
            el('div', { class: 'qtd pequena' },
              el('button', { type: 'button', 'aria-label': it.qtd === 1 ? 'Remover ' + p.nome : 'Diminuir', onclick: () => { it.qtd--; if (it.qtd <= 0) carrinho.splice(idx, 1); salvarCarrinho(); atualizarBarra(); desenhar(); } }, it.qtd === 1 ? '×' : '−'),
              el('span', { class: 'qtd-num' }, it.qtd),
              el('button', { type: 'button', 'aria-label': 'Aumentar', onclick: () => { it.qtd++; salvarCarrinho(); atualizarBarra(); desenhar(); } }, '+')));
        })),
        carrinho.length ? formulario(t) : null);

      acoes.replaceChildren();
      if (!carrinho.length) {
        acoes.append(el('button', { type: 'button', class: 'botao-principal largo', onclick: () => fechar(dlgCar) }, 'Voltar ao cardápio'));
        return;
      }
      const erro = el('p', { class: 'erro', role: 'alert' });
      if (!orcamento) {
        acoes.append(el('div', { class: 'totais' },
          el('div', {}, el('span', {}, 'Subtotal'), el('span', {}, L.reais(t.subtotal))),
          estado.forma === 'entrega' ? el('div', {}, el('span', {}, 'Entrega'), el('span', {}, t.taxa == null ? (e.tipo === 'bairros' && !estado.bairro ? 'escolha o bairro' : 'a combinar') : L.reais(t.taxa))) : null,
          el('div', { class: 'total' }, el('span', {}, 'Total'), el('span', {}, L.reais(t.total)))));
      }
      if (!status.aberto && !orcamento && !(loja.horarios && loja.horarios.aceitarFechado)) {
        acoes.append(el('p', { class: 'erro' }, `${status.texto}. Monte seu pedido e envie quando abrir.`));
      }
      acoes.append(erro, el('button', {
        type: 'button', class: 'botao-principal largo', onclick: () => {
          const pedido = { ...estado, itens: carrinho };
          const erros = L.validarPedido(loja, pedido);
          if (erros.length) {
            erro.textContent = erros[0];
            const alvo = corpo.querySelector('[aria-invalid="true"], input:invalid');
            if (alvo) alvo.focus();
            return;
          }
          guardar.gravar(chaveLoja + ':cliente', estado.lembrar
            ? { nome: estado.nome, endereco: estado.endereco, bairro: estado.bairro, forma: estado.forma, lembrar: true }
            : { lembrar: false });
          Object.assign(cliente, guardar.ler(chaveLoja + ':cliente', {}));
          finalizar(pedido);
        },
      }, orcamento ? 'Continuar' : 'Continuar · ' + L.reais(t.total)));
    }

    function campoTexto(rotulo, chave, attrs) {
      const id = 'f-' + chave;
      return el('label', { class: 'campo', for: id }, el('span', {}, rotulo),
        el('input', { id, value: estado[chave], ...attrs, oninput: (ev) => { estado[chave] = ev.target.value; if (attrs && attrs.redesenhar) desenhar(); } }));
    }
    function escolha(rotulo, chave, opcoes) {
      return el('fieldset', { class: 'escolha' }, el('legend', {}, rotulo),
        el('div', { class: 'pilulas' }, opcoes.map(([v, txt]) => el('label', {},
          el('input', { type: 'radio', name: 'f-' + chave, value: v, checked: estado[chave] === v, onchange: () => { estado[chave] = v; desenhar(); } }),
          el('span', {}, txt)))));
    }

    function formulario(t) {
      const f = el('div', { class: 'form' }, el('h3', {}, orcamento ? 'Seus dados' : 'Entrega e pagamento'));
      f.append(campoTexto('Seu nome', 'nome', { autocomplete: 'name', required: true, maxlength: 60 }));
      if (!orcamento) {
        if (formasEntrega.length > 1) f.append(escolha('Como prefere receber?', 'forma', formasEntrega));
        if (estado.forma === 'entrega') {
          if (e.tipo === 'bairros') {
            const sel = el('select', { id: 'f-bairro', onchange: (ev) => { estado.bairro = ev.target.value; desenhar(); } },
              el('option', { value: '' }, 'Selecione'),
              (e.bairros || []).map((b) => el('option', { value: b.nome, selected: estado.bairro === b.nome }, `${b.nome} — ${L.reais(L.centavos(b.taxa))}`)));
            f.append(el('label', { class: 'campo', for: 'f-bairro' }, el('span', {}, 'Bairro'), sel));
            f.append(el('p', { class: 'dica' }, 'Seu bairro não está na lista? Fale com a loja pelo WhatsApp.'));
          }
          f.append(campoTexto('Endereço (rua, número, complemento)', 'endereco', { autocomplete: 'street-address', maxlength: 140 }));
        } else if (estado.forma === 'retirada' && c.endereco) {
          f.append(el('p', { class: 'dica' }, 'Retirada em: ' + c.endereco));
        }
        if (formasPag.length) f.append(escolha('Pagamento', 'pagamento', formasPag));
        if (estado.pagamento === 'dinheiro') f.append(campoTexto('Troco para quanto? (deixe vazio se não precisar)', 'troco', { inputmode: 'decimal', placeholder: 'Ex.: 100' }));
        if (estado.pagamento === 'pix') f.append(el('p', { class: 'dica' }, 'Na próxima tela você copia o código Pix com o valor exato.'));
      }
      f.append(campoTexto('Observação para a loja (opcional)', 'observacao', { maxlength: 200 }));
      f.append(el('label', { class: 'lembrar' },
        el('input', { type: 'checkbox', checked: estado.lembrar, onchange: (ev) => { estado.lembrar = ev.target.checked; } }),
        el('span', {}, 'Lembrar meus dados neste aparelho')));
      return f;
    }

    desenhar();
    abrir(dlgCar);
  }

  /* ---------- tela final: Pix + enviar ---------- */
  const dlgFim = $('#dlg-final');
  function finalizar(pedido) {
    pedido.codigo = L.codigoPedido();
    const texto = L.mensagemPedido(loja, pedido);
    const link = L.linkWhatsApp(c.whatsapp, texto);
    const t = L.totais(loja, pedido);
    const blocos = [];

    if (pedido.pagamento === 'pix') {
      const p = pg.pix;
      const codigo = window.Pix.gerarPix({ chave: p.chave, tipo: p.tipo, nome: p.nome || loja.marca.nome, cidade: p.cidade, valor: t.taxa == null ? 0 : t.total / 100, txid: pedido.codigo });
      blocos.push(el('section', { class: 'passo' },
        el('h3', {}, el('span', { class: 'num' }, '1'), 'Copie o Pix'),
        el('p', {}, t.taxa == null
          ? `Valor dos produtos: ${L.reais(t.subtotal)}. A taxa de entrega a loja confirma no WhatsApp.`
          : `Valor exato: ${L.reais(t.total)}. Cole no app do seu banco em "Pix copia e cola".`),
        el('textarea', { class: 'pix-codigo', readonly: true, rows: 3, 'aria-label': 'Código Pix copia e cola' }, codigo),
        el('button', {
          type: 'button', class: 'botao-secundario largo', onclick: async (ev) => {
            try { await navigator.clipboard.writeText(codigo); }
            catch { const ta = dlgFim.querySelector('.pix-codigo'); ta.select(); document.execCommand('copy'); }
            ev.target.textContent = 'Código copiado ✓';
            aviso('Código Pix copiado');
          },
        }, 'Copiar código Pix'),
        el('p', { class: 'dica' }, `Recebedor: ${p.nome || loja.marca.nome}. Depois de pagar, mande o comprovante no WhatsApp.`)));
    }

    blocos.push(el('section', { class: 'passo' },
      el('h3', {}, el('span', { class: 'num' }, pedido.pagamento === 'pix' ? '2' : '1'), 'Envie no WhatsApp'),
      el('p', {}, 'O WhatsApp abre com tudo escrito. É só tocar em enviar.'),
      el('a', {
        class: 'botao-principal largo whats', href: link, target: '_blank', rel: 'noopener',
        onclick: () => {
          carrinho = [];
          salvarCarrinho();
          atualizarBarra();
          setTimeout(() => { const fim = dlgFim.querySelector('.depois'); if (fim) fim.hidden = false; }, 400);
        },
      }, orcamento ? 'Enviar no WhatsApp' : 'Enviar pedido no WhatsApp'),
      el('details', { class: 'previa' }, el('summary', {}, 'Ver a mensagem'), el('pre', {}, texto))));

    blocos.push(el('p', { class: 'depois dica', hidden: true }, `Pedido ${pedido.codigo} enviado? A loja responde por lá. Se o WhatsApp não abriu, toque no botão de novo.`));

    fechar(dlgCar);
    preencher(dlgFim, el('div', { class: 'folha-corpo' },
      botaoFechar(dlgFim),
      el('h2', { id: 'final-titulo' }, orcamento ? 'Quase lá' : 'Pedido pronto'),
      el('p', { class: 'codigo' }, 'Código ' + pedido.codigo),
      blocos));
    abrir(dlgFim);
  }

  atualizarBarra();
})();
