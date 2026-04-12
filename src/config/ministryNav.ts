import type { IconType } from 'react-icons';
import { FiHeart, FiSend, FiGift, FiMusic, FiSmile, FiUsers } from 'react-icons/fi';

export interface MinistryNavItem {
  id: string;
  label: string;
  to: string;
  icon: IconType;
}

/** Itens de ministério com rota própria (painel). Ordem exibida no menu e no resumo após login. */
export const MINISTRY_NAV_ITEMS: MinistryNavItem[] = [
  { id: 'pequenas_familias', label: 'Pequenas Famílias', to: '/pequenas-familias', icon: FiHeart },
  { id: 'evangelismo', label: 'Evangelismo e Missões', to: '/evangelismo', icon: FiSend },
  { id: 'diaconia', label: 'Diaconia', to: '/diaconia', icon: FiGift },
  { id: 'louvor', label: 'Louvor', to: '/louvor', icon: FiMusic },
  { id: 'ministerio_infantil', label: 'Ministério Infantil', to: '/ministerio-infantil', icon: FiSmile },
];

export const MEMBROS_NAV_ITEM: MinistryNavItem = {
  id: 'membros',
  label: 'Membros da ICF',
  to: '/membros',
  icon: FiUsers,
};

/** Cards do painel “Ministérios” no dashboard (títulos alinhados ao que já existia). */
export const DASHBOARD_MINISTRY_CARDS: { id: string; title: string; route: string }[] = [
  ...MINISTRY_NAV_ITEMS.map((m) => ({
    id: m.id,
    title: m.id === 'evangelismo' ? 'Evangelismo e Missões - Casa de Paz' : m.label,
    route: m.to,
  })),
  { id: 'membros', title: 'Membros da ICF - Aparecida', route: '/membros' },
];

/**
 * Lista os ministérios atribuídos ao usuário na ordem do menu (super_admin não usa aqui).
 */
export function getOrderedAssignedMinistryLinks(ministryIds: string[] | undefined): MinistryNavItem[] {
  if (!ministryIds?.length) {
    return [];
  }
  const set = new Set(ministryIds);
  const out: MinistryNavItem[] = [];
  for (const m of MINISTRY_NAV_ITEMS) {
    if (set.has(m.id)) {
      out.push(m);
    }
  }
  if (set.has(MEMBROS_NAV_ITEM.id)) {
    out.push(MEMBROS_NAV_ITEM);
  }
  return out;
}
