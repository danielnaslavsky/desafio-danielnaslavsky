# 🌿 Folhagem & Cia — Documentação da API

## 1. Visão geral

API REST que substitui a planilha de controle de estoque da **Folhagem & Cia**, uma loja de plantas. Ela cadastra, lista, edita e remove plantas, registra vendas sem nunca deixar o estoque negativo e calcula o valor total do estoque.

**Stack:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Docker

O código segue a mesma organização do CRUD de usuários do projeto:

```
Requisição → routes.ts → Controller → Repository → Banco
                              ↓
Resposta  ←───────────────────┘  (status HTTP + JSON)
```

- **Controller** (`src/controllers/PlantController.ts`): lê a requisição, valida e escolhe o status.
- **Repository** (`src/repositories/PlantRepository.ts`): única camada que fala com o banco (Prisma).

---

## 2. Como rodar

**Pré-requisitos:** Docker Desktop aberto, Node.js 20+ e Yarn (`npm install -g yarn`).

```bash
# 1. Crie o .env a partir do modelo
cp .env.example .env        # no PowerShell ou CMD: copy .env.example .env

# 2. Instale as dependências
yarn

# 3. Suba a API e o banco
docker compose up -d --build

# 4. Crie as tabelas (aplica as migrations)
yarn migration

# 5. (Opcional) Popule o banco com plantas de exemplo
yarn seed
```

Para conferir, abra `http://localhost:3001`. Deve aparecer:

```json
{ "message": "API do treinamento de CRUD do CITi 🚀" }
```

> O banco pode levar alguns segundos para ficar pronto depois do `docker compose up`. Se o `yarn migration` der `Can't reach database server`, aguarde um pouco e rode de novo.

---

## 3. Modelo de dados

### `Planta`

| Campo | Tipo | Exemplo | Observação |
|---|---|---|---|
| `id` | Int (autoincrement) | `1` | Gerado pelo banco |
| `nome` | String | `"Costela-de-adão"` | Nome popular |
| `especie` | String | `"Monstera deliciosa"` | Nome científico |
| `preco` | Int | `8990` | Em **centavos** (`8990` = R$ 89,90) |
| `estoque` | Int | `12` | Vasos disponíveis (pode ser `0`) |
| `luminosidade` | Enum `Luminosidade` | `"MEIA_SOMBRA"` | Ver abaixo |
| `petFriendly` | Boolean | `true` | Segura para cães e gatos? |
| `regaACadaDias` | Int | `3` | De quantos em quantos dias regar |
| `createdAt` / `updatedAt` | DateTime | | Preenchidos automaticamente |

### Enum `Luminosidade`

`SOMBRA` · `MEIA_SOMBRA` · `SOL_PLENO`

---

## 4. Rotas

Todas as respostas são JSON, exceto o `204` do `DELETE`, que não tem corpo. Os exemplos abaixo usam os dados do `yarn seed`; os `id` são ilustrativos.

### 4.1 `POST /plantas` — cadastra uma planta

**Corpo (todos os campos são obrigatórios):**

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3
}
```

**Resposta `201`:**

```json
{
  "id": 1,
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3,
  "createdAt": "2026-10-31T15:00:00.000Z",
  "updatedAt": "2026-10-31T15:00:00.000Z"
}
```

### 4.2 `GET /plantas` — lista as plantas

**Parâmetros de URL (todos opcionais, combináveis):**

| Parâmetro | Valores | O que faz |
|---|---|---|
| `luminosidade` | `SOMBRA`, `MEIA_SOMBRA`, `SOL_PLENO` | Só as plantas dessa luminosidade |
| `petFriendly` | `true` ou `false` | Só as pet friendly (ou só as não pet friendly) |
| `nome` | qualquer texto não vazio | Busca por pedaço do nome, sem diferenciar maiúsculas de minúsculas *(bônus)* |
| `ordem` | `preco` ou `nome` | Ordena de forma crescente *(bônus)* |

**Exemplos:**

```
GET /plantas
GET /plantas?luminosidade=SOMBRA
GET /plantas?petFriendly=true
GET /plantas?luminosidade=SOMBRA&petFriendly=true
GET /plantas?nome=costela
GET /plantas?petFriendly=true&ordem=preco
```

**Resposta `200`** (para `GET /plantas?luminosidade=SOMBRA`):

```json
[
  {
    "id": 2,
    "nome": "Samambaia",
    "especie": "Nephrolepis exaltata",
    "preco": 3500,
    "estoque": 5,
    "luminosidade": "SOMBRA",
    "petFriendly": true,
    "regaACadaDias": 2,
    "createdAt": "2026-10-31T15:00:00.000Z",
    "updatedAt": "2026-10-31T15:00:00.000Z"
  },
  {
    "id": 5,
    "nome": "Violeta",
    "especie": "Saintpaulia ionantha",
    "preco": 2500,
    "estoque": 0,
    "luminosidade": "SOMBRA",
    "petFriendly": true,
    "regaACadaDias": 4,
    "createdAt": "2026-10-31T15:00:00.000Z",
    "updatedAt": "2026-10-31T15:00:00.000Z"
  }
]
```

Um filtro válido sem resultado devolve `200` com `[]`, nunca `404`.

### 4.3 `GET /plantas/:id` — busca uma planta

**Resposta `200`:** o objeto da planta, no mesmo formato do `POST`.

### 4.4 `PATCH /plantas/:id` — edita só os campos enviados

**Corpo (qualquer subconjunto dos campos da planta):**

```json
{ "preco": 9990 }
```

**Resposta `200`:** a planta atualizada. Os campos não enviados continuam como estavam. Os campos enviados passam pelas mesmas regras do cadastro.

### 4.5 `DELETE /plantas/:id` — remove uma planta

**Resposta `204`:** sem corpo.

### 4.6 `POST /plantas/:id/venda` — registra uma venda

**Corpo:**

```json
{ "quantidade": 2 }
```

**Resposta `200`:** a planta com o estoque já descontado (por exemplo, o estoque vai de `12` para `10`).

### 4.7 `GET /plantas/estoque/valor-total` — valor total do estoque

Soma `preco × estoque` de todas as plantas e o total de vasos.

**Resposta `200`** (com os dados do seed):

```json
{
  "valorTotalEmCentavos": 161380,
  "totalDeVasos": 25
}
```

Com nenhuma planta cadastrada, devolve `200` com os dois valores `0`.

### 4.8 `GET /plantas/esgotadas` — plantas com estoque zero *(bônus)*

**Resposta `200`:** lista com as plantas de `estoque: 0` (no formato do `GET /plantas`), ou `[]` se não houver nenhuma.

---

## 5. Erros e status HTTP

Os erros tratados pela API respondem com um corpo no formato:

```json
{ "message": "Descrição do problema" }
```

| Rota | `400` | `404` | `500` |
|---|---|---|---|
| `POST /plantas` | Campo faltando ou inválido | — | Erro inesperado |
| `GET /plantas` | `luminosidade`, `petFriendly`, `nome` ou `ordem` inválidos | — | Erro inesperado |
| `GET /plantas/:id` | `id` não é um inteiro positivo | `id` não existe | Erro inesperado |
| `PATCH /plantas/:id` | `id` inválido ou algum campo enviado é inválido | `id` não existe | Erro inesperado |
| `DELETE /plantas/:id` | `id` inválido | `id` não existe | Erro inesperado |
| `POST /plantas/:id/venda` | `id` inválido, `quantidade` inválida ou estoque insuficiente | `id` não existe | Erro inesperado |
| `GET /plantas/estoque/valor-total` | — | — | Erro inesperado |
| `GET /plantas/esgotadas` | — | — | Erro inesperado |

Uma URL que não existe (por exemplo, `GET /abc`) responde `404` com `{ "message": "Rota não encontrada" }`.

### Mensagens do erro `500`

| Rota | Mensagem |
|---|---|
| `POST /plantas` | `Erro ao criar planta.` |
| `GET /plantas` | `Erro ao listar plantas.` |
| `GET /plantas/:id` | `Erro ao buscar planta.` |
| `PATCH /plantas/:id` | `Erro ao atualizar planta.` |
| `DELETE /plantas/:id` | `Erro ao remover planta.` |
| `POST /plantas/:id/venda` | `Erro ao vender planta.` |
| `GET /plantas/estoque/valor-total` | `Erro ao somar valor total de estoque.` |
| `GET /plantas/esgotadas` | `Erro ao listar plantas esgotadas.` |

### Regras de validação

| Campo | Regra | Mensagem de erro |
|---|---|---|
| qualquer campo, no `POST` | obrigatório | `<campo> é obrigatório` |
| `nome`, `especie` | texto não vazio | `nome deve ser um texto não vazio` |
| `preco` | inteiro maior que zero | `preco deve ser um inteiro maior que zero (em centavos)` |
| `estoque` | inteiro maior ou igual a zero | `estoque deve ser um inteiro maior ou igual a zero` |
| `luminosidade` | um dos três valores do enum | `luminosidade deve ser: SOMBRA, MEIA_SOMBRA, SOL_PLENO` |
| `petFriendly` | `true` ou `false` | `petFriendly deve ser true ou false` |
| `regaACadaDias` | inteiro maior ou igual a 1 | `regaACadaDias deve ser um inteiro maior ou igual a 1` |
| `id` (na URL) | inteiro positivo | `O ID fornecido é inválido. Deve ser um número inteiro positivo.` |
| `quantidade` (na venda) | inteiro maior que zero | `Quantidade deve ser um inteiro maior que zero.` |
| venda acima do estoque | — | `Estoque insuficiente. Temos só <N> vasos.` |
| `ordem` | `preco` ou `nome` | `ordem deve ser preco ou nome` |

### Exemplos de resposta de erro

`POST /plantas` com `"preco": 0`:

```json
{ "message": "preco deve ser um inteiro maior que zero (em centavos)" }
```

`GET /plantas?luminosidade=LUA`:

```json
{ "message": "luminosidade deve ser: SOMBRA, MEIA_SOMBRA, SOL_PLENO" }
```

`GET /plantas/9999`:

```json
{ "message": "Planta não encontrada." }
```

`POST /plantas/1/venda` com `{ "quantidade": 50 }` (estoque `12`):

```json
{ "message": "Estoque insuficiente. Temos só 12 vasos." }
```

---

## 6. Decisões e bônus

### Bônus implementados

- **Busca por nome:** `?nome=costela` procura o texto em qualquer parte do nome, sem diferenciar maiúsculas de minúsculas.
- **Ordenação:** `?ordem=preco` ou `?ordem=nome`.
- **`GET /plantas/esgotadas`:** lista as plantas com `estoque: 0`. A rota é registrada **antes** de `/plantas/:id`, senão "esgotadas" seria tratado como um id.
- **Seed:** `yarn seed` insere 5 plantas de exemplo (duas delas esgotadas). Ele **apaga as plantas existentes** antes de inserir, então pode ser rodado mais de uma vez sem duplicar.

### Decisões

- **Vendas simultâneas do último vaso:** a verificação do estoque e o desconto acontecem em uma única operação no banco (`UPDATE ... WHERE estoque >= quantidade`). Como o PostgreSQL processa atualizações da mesma linha uma de cada vez, se duas pessoas tentarem comprar o último vaso ao mesmo tempo, apenas uma venda é concluída e a outra recebe `400` (estoque insuficiente). O estoque nunca fica negativo.
- **Ordenação crescente:** o enunciado não define a direção, então `?ordem=preco` vai do mais barato ao mais caro e `?ordem=nome` segue a ordem alfabética.
- **Filtros inválidos:** um valor fora do esperado (por exemplo `?luminosidade=LUA` ou `?petFriendly=talvez`) responde `400`, e não uma lista vazia.
- **`id` inválido x inexistente:** um `id` que não é inteiro positivo (por exemplo `abc`, `0` ou `-1`) responde `400`; um `id` válido que não existe responde `404`.
- **Valor total:** a conta `preco × estoque` é feita no código, buscando só os campos `preco` e `estoque`.
- **Preço em centavos:** valores inteiros evitam erros de arredondamento com decimais.
