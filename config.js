/* Configuração da loja Parrilla Búrguer — gerada por gerar.cjs em 23/11/2026, 00:15:14. */
window.LOJA = {
  "demonstracao": false,
  "modo": "pedido",
  "marca": {
    "nome": "Parrilla Búrguer",
    "slogan": "Hambúrguer na brasa, receita da Espanha",
    "logo": "img/logo.jpg",
    "cor": "#145A35",
    "capa": ""
  },
  "contato": {
    "whatsapp": "5547988824995",
    "instagram": "parrillaburguer_",
    "endereco": "R. XV de Novembro, 7470 — Vila Nova, Joinville",
    "mapa": "https://maps.google.com/?q=Parrilla+Búrguer+R.+XV+de+Novembro+7470+Joinville"
  },
  "aviso": "Prévia montada para a Parrilla Búrguer: os itens e preços são de exemplo. Com o cardápio de vocês, fica tudo igual ao balcão.",
  "horarios": {
    "fuso": "America/Sao_Paulo",
    "aceitarFechado": true,
    "dias": {}
  },
  "entrega": {
    "retirada": true,
    "delivery": true,
    "tipo": "combinar",
    "taxa": 0,
    "bairros": [],
    "pedidoMinimo": 0,
    "tempo": "40–60 min"
  },
  "pagamento": {
    "pix": {
      "ativo": false,
      "tipo": "aleatoria",
      "chave": "",
      "nome": "",
      "cidade": ""
    },
    "cartao": true,
    "dinheiro": true
  },
  "rodape": {
    "credito": "Feito por NEXO",
    "link": ""
  },
  "categorias": [
    {
      "id": "brasa",
      "nome": "Hambúrgueres na brasa"
    },
    {
      "id": "porcoes",
      "nome": "Porções"
    },
    {
      "id": "bebidas",
      "nome": "Bebidas"
    }
  ],
  "produtos": [
    {
      "id": "clasico",
      "categoria": "brasa",
      "nome": "Parrilla Clásico",
      "destaque": true,
      "descricao": "Blend grelhado no carvão, queijo, alface, tomate e molho da casa no pão brioche.",
      "preco": 32,
      "foto": "",
      "opcoes": [
        {
          "nome": "Ponto da carne",
          "tipo": "uma",
          "obrigatorio": true,
          "itens": [
            {
              "nome": "Ao ponto",
              "preco": 0
            },
            {
              "nome": "Bem passado",
              "preco": 0
            }
          ]
        },
        {
          "nome": "Adicionais",
          "tipo": "varias",
          "max": 4,
          "itens": [
            {
              "nome": "Bacon",
              "preco": 5
            },
            {
              "nome": "Queijo extra",
              "preco": 4
            },
            {
              "nome": "Ovo",
              "preco": 3
            },
            {
              "nome": "Cebola caramelizada",
              "preco": 4
            }
          ]
        }
      ]
    },
    {
      "id": "doble",
      "categoria": "brasa",
      "nome": "Doble Parrilla",
      "destaque": true,
      "descricao": "Dois blends na brasa, cheddar e cebola crispy.",
      "preco": 42,
      "foto": "",
      "opcoes": [
        {
          "nome": "Ponto da carne",
          "tipo": "uma",
          "obrigatorio": true,
          "itens": [
            {
              "nome": "Ao ponto",
              "preco": 0
            },
            {
              "nome": "Bem passado",
              "preco": 0
            }
          ]
        },
        {
          "nome": "Adicionais",
          "tipo": "varias",
          "max": 3,
          "itens": [
            {
              "nome": "Bacon",
              "preco": 5
            },
            {
              "nome": "Picles",
              "preco": 2
            }
          ]
        }
      ]
    },
    {
      "id": "bacon",
      "categoria": "brasa",
      "nome": "Parrilla Bacon",
      "descricao": "Blend na brasa, bacon crocante, queijo e maionese defumada.",
      "preco": 36,
      "foto": ""
    },
    {
      "id": "pollo",
      "categoria": "brasa",
      "nome": "Pollo a la Brasa",
      "descricao": "Frango grelhado no carvão, queijo e salada.",
      "preco": 30,
      "foto": ""
    },
    {
      "id": "bravas",
      "categoria": "porcoes",
      "nome": "Batatas com molhos artesanais",
      "destaque": true,
      "descricao": "A batata que o pessoal elogia nas avaliações, com os molhos da casa.",
      "preco": 28,
      "foto": "",
      "opcoes": [
        {
          "nome": "Tamanho",
          "tipo": "uma",
          "obrigatorio": true,
          "itens": [
            {
              "nome": "Individual",
              "preco": 0
            },
            {
              "nome": "Para dividir",
              "preco": 12
            }
          ]
        }
      ]
    },
    {
      "id": "lata",
      "categoria": "bebidas",
      "nome": "Refrigerante lata",
      "descricao": "350 ml.",
      "preco": 7,
      "foto": ""
    },
    {
      "id": "suco",
      "categoria": "bebidas",
      "nome": "Suco natural",
      "descricao": "500 ml.",
      "preco": 10,
      "foto": ""
    }
  ]
};
