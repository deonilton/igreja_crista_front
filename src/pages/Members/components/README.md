# MembersTable Component

## Descrição
Componente reutilizável de tabela para exibição de membros com layout moderno, responsivo e acessível.

## Características

### Layout e Distribuição
- **Nome**: 2fr (maior espaço) - flexível para acomodar nomes longos
- **Telefone**: 1.2fr - espaço médio com nowrap
- **Status**: 0.8fr - espaço pequeno, centralizado
- **Data de Cadastro**: 1fr - espaço médio, centralizado
- **Ações**: 100px fixo - alinhado à direita

### Responsividade
- **Desktop (>768px)**: Todas as colunas visíveis
- **Tablet (≤768px)**: Reduz padding e fontes
- **Mobile (≤640px)**: Oculta Telefone e Data
- **Small Mobile (≤480px)**: Ajuste fino de espaçamento

### Acessibilidade
- ARIA labels nos botões de ação
- Semântica HTML5 correta
- Navegação por teclado suportada
- Contraste adequado

## Como Usar

```tsx
import MembersTable from './components/MembersTable';

<MembersTable
  members={members}
  canManageMembers={canManageMembers}
  onEdit={handleEdit}
  onDelete={handleDelete}
  formatPhone={formatPhone}
/>
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `members` | `Member[]` | Array de membros para exibir |
| `canManageMembers` | `boolean` | Controla visibilidade dos botões de ação |
| `onEdit` | `(id: number) => void` | Callback para edição |
| `onDelete` | `(id: number, name: string) => void` | Callback para exclusão |
| `formatPhone` | `(phone: string \| null) => string` | Função para formatar telefone |

## Decisões de Design

### Table Layout Fixed
- Uso de `table-layout: fixed` para performance e controle preciso
- Colunas com larguras proporcionais usando `fr` units
- Coluna de ações com largura fixa para consistência visual

### Alinhamento
- Nome: alinhado à esquerda (leitura natural)
- Status/Data: centralizados (foco visual)
- Ações: alinhado à direita (padrão UI)

### Cores e Estados
- Hover sutil com `var(--gray-50)`
- Badges de status com cores semânticas
- Botões com bordas e hover states consistentes

### Performance
- Componente memoizado para evitar re-renders desnecessários
- CSS otimizado com variáveis CSS
- Media queries progressivas

## Extensibilidade

O componente foi projetado para ser facilmente extensível:

1. **Novas colunas**: Adicionar no JSX e definir width no CSS
2. **Novas ações**: Adicionar botões no `member-actions`
3. **Customização**: Variáveis CSS podem ser sobrescritas
4. **Ordenação**: Adicionar headers clicáveis no futuro

## Manutenção

- CSS modular no arquivo `MembersTable.css`
- TypeScript para type safety
- Componente isolado para testabilidade
- Documentação inline para facilitar manutenção
