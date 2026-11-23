/*
 * Pix "copia e cola" (BR Code estático) — padrão EMV do Banco Central.
 * Gera o código com o valor exato do pedido. Não confirma pagamento:
 * a loja confere o comprovante que o cliente manda no WhatsApp.
 */
(function (global) {
  'use strict';

  function semAcento(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 .,\-@+*/]/g, '')
      .trim();
  }

  function campo(id, valor) {
    const v = String(valor);
    return id + String(v.length).padStart(2, '0') + v;
  }

  function crc16(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /** Deixa a chave no formato que os bancos aceitam. */
  function normalizarChave(chave, tipo) {
    const bruta = String(chave || '').trim();
    const digitos = bruta.replace(/\D/g, '');
    switch (tipo) {
      case 'telefone': {
        const semPais = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;
        return '+55' + semPais;
      }
      case 'cpf':
      case 'cnpj':
        return digitos;
      case 'email':
        return bruta.toLowerCase();
      default:
        return bruta; // chave aleatória (EVP)
    }
  }

  function validarChave(chave, tipo) {
    const c = normalizarChave(chave, tipo);
    if (!c) return 'Informe a chave Pix.';
    if (tipo === 'telefone' && !/^\+55\d{10,11}$/.test(c)) return 'Telefone Pix deve ter DDD + número.';
    if (tipo === 'cpf' && c.length !== 11) return 'CPF deve ter 11 números.';
    if (tipo === 'cnpj' && c.length !== 14) return 'CNPJ deve ter 14 números.';
    if (tipo === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) return 'E-mail Pix inválido.';
    if (tipo === 'aleatoria' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) {
      return 'Chave aleatória deve ter o formato 8-4-4-4-12.';
    }
    return '';
  }

  /**
   * @param {{chave:string, tipo?:string, nome:string, cidade:string, valor?:number, txid?:string, descricao?:string}} o
   */
  function gerarPix(o) {
    const chave = normalizarChave(o.chave, o.tipo || 'aleatoria');
    const nome = semAcento(o.nome).slice(0, 25) || 'LOJA';
    const cidade = semAcento(o.cidade).slice(0, 15) || 'BRASIL';
    const txid = (String(o.txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)) || '***';
    const descricao = semAcento(o.descricao || '').slice(0, 40);

    let conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
    if (descricao) conta += campo('02', descricao);

    let payload =
      campo('00', '01') +
      campo('26', conta) +
      campo('52', '0000') +
      campo('53', '986');
    const valor = Number(o.valor);
    if (Number.isFinite(valor) && valor > 0) payload += campo('54', valor.toFixed(2));
    payload +=
      campo('58', 'BR') +
      campo('59', nome) +
      campo('60', cidade) +
      campo('62', campo('05', txid)) +
      '6304';
    return payload + crc16(payload);
  }

  const api = { gerarPix, crc16, normalizarChave, validarChave, semAcento };
  global.Pix = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
