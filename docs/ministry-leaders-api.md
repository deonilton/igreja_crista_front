# API de Líderes de Ministérios

## Endpoints Necessários

### 1. Buscar todos os ministérios com seus líderes
```
GET /api/ministries/leaders
```

**Response:**
```json
{
  "ministries": [
    {
      "id": "pequenas_familias",
      "name": "Pequenas Famílias",
      "leaders": [
        {
          "id": 1,
          "ministry_id": "pequenas_familias",
          "member_id": 123,
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z",
          "member": {
            "id": 123,
            "full_name": "João Silva",
            "email": "joao@exemplo.com",
            "phone": "11999999999"
          }
        }
      ]
    }
  ]
}
```

### 2. Buscar líderes de um ministério específico
```
GET /api/ministries/{ministryId}/leaders
```

**Response:**
```json
[
  {
    "id": 1,
    "ministry_id": "pequenas_familias",
    "member_id": 123,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "member": {
      "id": 123,
      "full_name": "João Silva",
      "email": "joao@exemplo.com",
      "phone": "11999999999"
    }
  }
]
```

### 3. Adicionar líder a um ministério
```
POST /api/ministries/leaders
```

**Request:**
```json
{
  "ministry_id": "pequenas_familias",
  "member_id": 123
}
```

**Validações:**
- Um ministério pode ter no máximo 2 líderes
- Um membro não pode ser líder do mesmo ministério mais de uma vez

**Response (201):**
```json
{
  "id": 1,
  "ministry_id": "pequenas_familias",
  "member_id": 123,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "member": {
    "id": 123,
    "full_name": "João Silva",
    "email": "joao@exemplo.com",
    "phone": "11999999999"
  }
}
```

**Errors:**
- `409 Conflict`: Membro já é líder do ministério ou limite de líderes atingido
- `404 Not Found`: Membro não encontrado
- `400 Bad Request`: Dados inválidos

### 4. Atualizar líder de um ministério
```
PUT /api/ministries/leaders/{leaderId}
```

**Request:**
```json
{
  "member_id": 456
}
```

**Validações:**
- Novo membro não pode já ser líder do mesmo ministério

**Response:**
```json
{
  "id": 1,
  "ministry_id": "pequenas_familias",
  "member_id": 456,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "member": {
    "id": 456,
    "full_name": "Maria Santos",
    "email": "maria@exemplo.com",
    "phone": "11888888888"
  }
}
```

### 5. Remover líder de um ministério
```
DELETE /api/ministries/leaders/{leaderId}
```

**Response:** `204 No Content`

### 6. Buscar membros para autocomplete
```
GET /api/members/search?query=joao
```

**Response:**
```json
[
  {
    "id": 123,
    "full_name": "João Silva",
    "email": "joao@exemplo.com",
    "phone": "11999999999"
  }
]
```

### 7. Buscar lideranças de um membro
```
GET /api/members/{memberId}/leaderships
```

**Response:**
```json
[
  {
    "id": 1,
    "ministry_id": "pequenas_familias",
    "member_id": 123,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "ministry": {
      "id": "pequenas_familias",
      "name": "Pequenas Famílias"
    }
  }
]
```

## Estrutura do Banco de Dados Sugerida

### Tabela: ministry_leaders
```sql
CREATE TABLE ministry_leaders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ministry_id VARCHAR(50) NOT NULL,
  member_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (member_id) REFERENCES members(id),
  UNIQUE KEY unique_ministry_member (ministry_id, member_id),
  
  -- Constraint para garantir máximo de 2 líderes por ministério
  CHECK (
    (SELECT COUNT(*) FROM ministry_leaders ml WHERE ml.ministry_id = ministry_leaders.ministry_id) <= 2
  )
);
```

### Índices recomendados:
```sql
CREATE INDEX idx_ministry_leaders_ministry_id ON ministry_leaders(ministry_id);
CREATE INDEX idx_ministry_leaders_member_id ON ministry_leaders(member_id);
```

## Validações Implementadas no Frontend

### 1. Limite de 2 líderes por ministério
- Verificado antes de adicionar novo líder
- Interface desabilita adição quando limite é atingido
- Exibe aviso visual quando limite é atingido

### 2. Prevenção de duplicidade
- Verificado antes de adicionar/editar líder
- Impede seleção do mesmo membro duas vezes no mesmo ministério
- Validação tanto no frontend quanto esperada no backend

### 3. Experiência do usuário
- Feedback visual em tempo real
- Mensagens de erro claras
- Busca por nome com autocomplete
- Interface responsiva e acessível

## Ministérios Disponíveis

1. `pequenas_familias` - Pequenas Famílias
2. `evangelismo` - Evangelismo e Missões
3. `diaconia` - Diaconia
4. `louvor` - Louvor
5. `ministerio_infantil` - Ministério Infantil
6. `membros` - Membros da ICF

## Fluxo de Uso

1. **Acesso**: Botão "Líderes de Ministérios" na página Users
2. **Seleção**: Escolher ministério na lista à esquerda
3. **Gestão**: Adicionar/editar/remover líderes (máx. 2 por ministério)
4. **Visualização**: Ver líderes na página Diaconia
5. **Busca**: Autocomplete para encontrar membros rapidamente

## Permissões

- Apenas Super Admins podem gerenciar líderes de ministérios
- Todos os usuários com acesso podem visualizar os líderes na página Diaconia
