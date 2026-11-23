/*
 * Regras da vitrine (sem tela): preço, carrinho, horário, entrega e mensagem do pedido.
 * Tudo em centavos para não errar conta. Testado em tests/loja.test.cjs.
 */
(function (global) {
  'use strict';

  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const NOMES_DIAS = { dom: 'domingo', seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', sab: 'sábado' };

  /** Aceita número ou texto digitado ("100", "100,00", "1.250,50", "R$ 20"). */
  function centavos(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
    let t = String(valor || '').replace(/[^\d,.-]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }
  const reais = (c) =>
    (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');

  /* ---------- produto e carrinho ---------- */

  function acharProduto(loja, id) {
    return (loja.produtos || []).find((p) => p.id === id);
  }

  /** escolhas = { [indiceGrupo]: [indiceItem, ...] } */
  function validarEscolhas(produto, escolhas) {
    const erros = [];
    (produto.opcoes || []).forEach((grupo, gi) => {
      const marcadas = (escolhas && escolhas[gi]) || [];
      if (grupo.obrigatorio && marcadas.length === 0) erros.push(`Escolha ${grupo.nome.toLowerCase()}.`);
      if (grupo.tipo === 'uma' && marcadas.length > 1) erros.push(`Escolha só uma opção em ${grupo.nome.toLowerCase()}.`);
      if (grupo.max && marcadas.length > grupo.max) erros.push(`Máximo de ${grupo.max} em ${grupo.nome.toLowerCase()}.`);
    });
    return erros;
  }

  function precoUnitario(produto, escolhas) {
    let total = centavos(produto.preco);
    (produto.opcoes || []).forEach((grupo, gi) => {
      ((escolhas && escolhas[gi]) || []).forEach((ii) => {
        const item = grupo.itens[ii];
        if (item) total += centavos(item.preco);
      });
    });
    return total;
  }

  function descreverEscolhas(produto, escolhas) {
    const partes = [];
    (produto.opcoes || []).forEach((grupo, gi) => {
      const nomes = ((escolhas && escolhas[gi]) || []).map((ii) => grupo.itens[ii] && grupo.itens[ii].nome).filter(Boolean);
      if (nomes.length) partes.push(grupo.tipo === 'uma' ? nomes.join(', ') : '+ ' + nomes.join(', + '));
    });
    return partes;
  }

  function chaveItem(produtoId, escolhas, obs) {
    return produtoId + '|' + JSON.stringify(escolhas || {}) + '|' + (obs || '').trim();
  }

  /** Remove do carrinho o que não existe mais ou esgotou (cardápio mudou). */
  function limparCarrinho(loja, itens) {
    return (itens || []).filter((it) => {
      const p = acharProduto(loja, it.produtoId);
      return p && !p.esgotado && it.qtd > 0 && validarEscolhas(p, it.escolhas).length === 0;
    });
  }

  function subtotal(loja, itens) {
    return itens.reduce((soma, it) => {
      const p = acharProduto(loja, it.produtoId);
      return p ? soma + precoUnitario(p, it.escolhas) * it.qtd : soma;
    }, 0);
  }

  /* ---------- entrega ---------- */

  /** Taxa em centavos, ou null quando é "a combinar". */
  function taxaEntrega(loja, forma, bairro) {
    if (forma !== 'entrega') return 0;
    const e = loja.entrega || {};
    if (e.tipo === 'fixa') return centavos(e.taxa);
    if (e.tipo === 'bairros') {
      const b = (e.bairros || []).find((x) => x.nome === bairro);
      return b ? centavos(b.taxa) : null;
    }
    return null;
  }

  /* ---------- horário ---------- */

  function agoraNoFuso(fuso, data) {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: fuso || 'America/Sao_Paulo',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(data || new Date());
    const get = (t) => partes.find((p) => p.type === t).value;
    const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { dia, minutos: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  const paraMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + (m || 0);
  };

  /** Intervalos de um dia em minutos; "18:00-02:00" passa da meia-noite. */
  function intervalos(horarios, diaIdx) {
    const lista = ((horarios && horarios.dias) || {})[DIAS[diaIdx]] || [];
    return lista.map(([a, f]) => ({ ini: paraMin(a), fim: paraMin(f) <= paraMin(a) ? paraMin(f) + 1440 : paraMin(f), a, f }));
  }

  /**
   * @returns {{aberto:boolean, texto:string, semHorario?:boolean}}
   */
  function statusHorario(loja, data) {
    const h = loja.horarios;
    if (!h || !h.dias || Object.values(h.dias).every((d) => !d || d.length === 0)) {
      return { aberto: true, texto: '', semHorario: true };
    }
    const { dia, minutos } = agoraNoFuso(h.fuso, data);

    for (const it of intervalos(h, dia)) {
      if (minutos >= it.ini && minutos < it.fim) return { aberto: true, texto: `Aberto até ${it.f}` };
    }
    const ontem = (dia + 6) % 7;
    for (const it of intervalos(h, ontem)) {
      if (it.fim > 1440 && minutos < it.fim - 1440) return { aberto: true, texto: `Aberto até ${it.f}` };
    }
    for (const it of intervalos(h, dia)) {
      if (it.ini > minutos) return { aberto: false, texto: `Fechado · abre hoje às ${it.a}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (dia + i) % 7;
      const prox = intervalos(h, d)[0];
      if (prox) {
        const quando = i === 1 ? 'amanhã' : NOMES_DIAS[DIAS[d]];
        return { aberto: false, texto: `Fechado · abre ${quando} às ${prox.a}` };
      }
    }
    return { aberto: false, texto: 'Fechado' };
  }

  /* ---------- pedido ---------- */

  function codigoPedido(aleatorio) {
    const r = aleatorio || Math.random;
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 5; i++) c += letras[Math.floor(r() * letras.length)];
    return c;
  }

  /**
   * Confere o pedido antes de abrir o WhatsApp. Devolve lista de problemas (vazia = ok).
   */
  function validarPedido(loja, pedido) {
    const erros = [];
    const orcamento = loja.modo === 'orcamento';
    if (!pedido.itens || pedido.itens.length === 0) erros.push('Seu pedido está vazio.');
    if (!String(pedido.nome || '').trim()) erros.push('Informe seu nome.');
    if (orcamento) return erros;

    const st = statusHorario(loja, pedido.data);
    if (!st.aberto && !(loja.horarios && loja.horarios.aceitarFechado)) erros.push('A loja está fechada agora.');

    if (!pedido.forma) erros.push('Escolha entrega ou retirada.');
    if (pedido.forma === 'entrega') {
      if (!String(pedido.endereco || '').trim()) erros.push('Informe o endereço de entrega.');
      if ((loja.entrega || {}).tipo === 'bairros' && !pedido.bairro) erros.push('Escolha o bairro.');
    }
    const minimo = centavos((loja.entrega || {}).pedidoMinimo);
    if (minimo && subtotal(loja, pedido.itens) < minimo) erros.push(`Pedido mínimo de ${reais(minimo)}.`);
    if (!pedido.pagamento) erros.push('Escolha a forma de pagamento.');
    if (pedido.pagamento === 'dinheiro' && pedido.troco) {
      const total = subtotal(loja, pedido.itens) + (taxaEntrega(loja, pedido.forma, pedido.bairro) || 0);
      if (centavos(pedido.troco) < total) erros.push('O troco precisa ser maior que o total.');
    }
    return erros;
  }

  function totais(loja, pedido) {
    const sub = subtotal(loja, pedido.itens || []);
    const taxa = taxaEntrega(loja, pedido.forma, pedido.bairro);
    return { subtotal: sub, taxa, total: sub + (taxa || 0) };
  }

  const PAGAMENTOS = { pix: 'Pix', cartao: 'Cartão (na entrega/retirada)', dinheiro: 'Dinheiro' };

  /** Texto que vai para o WhatsApp da loja. */
  function mensagemPedido(loja, pedido) {
    const orcamento = loja.modo === 'orcamento';
    const linhas = [];
    linhas.push(orcamento ? `*Pedido de orçamento — ${loja.marca.nome}*` : `*Novo pedido — ${loja.marca.nome}*`);
    linhas.push(`Código: ${pedido.codigo}`);
    linhas.push('');
    pedido.itens.forEach((it) => {
      const p = acharProduto(loja, it.produtoId);
      if (!p) return;
      const unit = precoUnitario(p, it.escolhas);
      const preco = orcamento || p.preco == null ? '' : ` — ${reais(unit * it.qtd)}`;
      linhas.push(`${it.qtd}x ${p.nome}${preco}`);
      descreverEscolhas(p, it.escolhas).forEach((d) => linhas.push(`   ${d}`));
      if (it.obs) linhas.push(`   Obs.: ${it.obs}`);
    });
    linhas.push('');

    if (!orcamento) {
      const t = totais(loja, pedido);
      linhas.push(`Subtotal: ${reais(t.subtotal)}`);
      if (pedido.forma === 'entrega') {
        const onde = pedido.bairro ? ` (${pedido.bairro})` : '';
        linhas.push(`Entrega${onde}: ${t.taxa == null ? 'a combinar' : reais(t.taxa)}`);
      }
      linhas.push(`*Total: ${reais(t.total)}*${t.taxa == null && pedido.forma === 'entrega' ? ' + entrega' : ''}`);
      linhas.push('');
    }

    linhas.push(`*Nome:* ${String(pedido.nome).trim()}`);
    if (!orcamento) {
      if (pedido.forma === 'entrega') {
        linhas.push(`*Entrega em:* ${String(pedido.endereco).trim()}${pedido.bairro ? ' — ' + pedido.bairro : ''}`);
      } else {
        linhas.push('*Retirada no local*');
      }
      let pag = PAGAMENTOS[pedido.pagamento] || pedido.pagamento;
      if (pedido.pagamento === 'pix') pag += ' (envio o comprovante aqui)';
      if (pedido.pagamento === 'dinheiro') pag += pedido.troco ? ` — troco para ${reais(centavos(pedido.troco))}` : ' — sem troco';
      linhas.push(`*Pagamento:* ${pag}`);
    }
    if (String(pedido.observacao || '').trim()) linhas.push(`*Observação:* ${String(pedido.observacao).trim()}`);
    return linhas.join('\n');
  }

  function linkWhatsApp(numero, texto) {
    const n = String(numero || '').replace(/\D/g, '');
    const comPais = n.length <= 11 ? '55' + n : n;
    return `https://wa.me/${comPais}?text=${encodeURIComponent(texto)}`;
  }

  const api = {
    centavos, reais, acharProduto, validarEscolhas, precoUnitario, descreverEscolhas, chaveItem,
    limparCarrinho, subtotal, taxaEntrega, statusHorario, codigoPedido, validarPedido, totais,
    mensagemPedido, linkWhatsApp, DIAS, NOMES_DIAS,
  };
  global.Loja = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
