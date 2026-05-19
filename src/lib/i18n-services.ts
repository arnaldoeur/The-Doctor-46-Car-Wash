import { ServiceItem } from './serviceCatalog';

/**
 * Service catalog data with multi-language support.
 * This helper provides translated versions of the catalog items based on the current language.
 */

const categoriesMap: Record<string, string> = {
 'Viaturas Ligeiras': 'cat.light',
 'Viaturas Ligeiras (Particulares)': 'cat.light',
 'Limpeza & Brilho': 'cat.cleaning',
 'Empresas & Frotas': 'cat.business',
 'Motas, Camiões & Maquinas': 'cat.heavy'
};

export function getTranslatedCatalog(catalog: ServiceItem[], t: (key: string) => string): ServiceItem[] {
  return catalog.map(item => {
    const tName = t(`service.${item.id}.name`);
    const tDesc = t(`service.${item.id}.desc`);
    return {
      ...item,
      name: tName.startsWith('service.') ? item.name : tName,
      description: tDesc.startsWith('service.') ? item.description : tDesc,
      category: t(categoriesMap[item.category] || item.category),
      features: item.features.map((feat, idx) => {
        const tFeat = t(`service.${item.id}.f${idx + 1}`);
        return tFeat.startsWith('service.') ? feat : tFeat;
      })
    };
  });
}

export function getTranslatedGroupedServices(grouped: any[], t: (key: string) => string) {
 return grouped.map(group => ({
 ...group,
 category: t(categoriesMap[group.category] || group.category),
 items: getTranslatedCatalog(group.items, t)
 }));
}
