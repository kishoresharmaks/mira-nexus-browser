import { daySerial, atOffset, curatedShortDate } from '@/lib/curation';
import type { DiscoveryCategory, DiscoveryItem } from '@/types';

export type DailyEditorialSlots = {
  websiteOfDay: DiscoveryItem | null;
  articleOfDay: DiscoveryItem | null;
  developerDiscovery: DiscoveryItem | null;
};

export type ArchiveDay = {
  date: Date;
  label: string;
  item: DiscoveryItem | null;
  offset: number;
};

export class DiscoveryRepository {
  /**
   * Returns active, unexpired discovery items.
   */
  static getEligibleItems(items: DiscoveryItem[]): DiscoveryItem[] {
    const now = Date.now();
    return items.filter((item) => {
      if (item.enabled === false) return false;
      if (item.expiresAt) {
        const expiresTime = Date.parse(item.expiresAt);
        if (!Number.isNaN(expiresTime) && expiresTime < now) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Filters discovery items by category or content type.
   */
  static filterItems(
    items: DiscoveryItem[],
    categories: DiscoveryCategory[],
    filterId: string,
  ): DiscoveryItem[] {
    const eligible = DiscoveryRepository.getEligibleItems(items);
    if (!filterId || filterId === 'all') return eligible;

    const targetCategory = categories.find((c) => c.id === filterId);

    return eligible.filter((item) => {
      // Direct category ID match
      if (item.categoryId === filterId || item.category?.toLowerCase() === filterId.toLowerCase()) {
        return true;
      }

      // Match category's configured content types
      if (targetCategory?.contentTypes && targetCategory.contentTypes.length > 0) {
        return targetCategory.contentTypes.includes(item.contentType);
      }

      return false;
    });
  }

  /**
   * Resolves the three daily featured slots:
   * 1. Website of the Day
   * 2. Article of the Day
   * 3. Developer Discovery
   *
   * Checks explicit slot assignment first, then falls back to deterministic rotation.
   */
  static resolveDailySlots(
    items: DiscoveryItem[],
    date: Date = new Date(),
  ): DailyEditorialSlots {
    const eligible = DiscoveryRepository.getEligibleItems(items);
    if (eligible.length === 0) {
      return {
        websiteOfDay: null,
        articleOfDay: null,
        developerDiscovery: null,
      };
    }

    // 1. Look for explicit slot assignments
    let websiteOfDay =
      eligible.find((i) => i.dailySlot === 'website_of_day') ?? null;
    let articleOfDay =
      eligible.find((i) => i.dailySlot === 'article_of_day') ?? null;
    let developerDiscovery =
      eligible.find((i) => i.dailySlot === 'developer_discovery') ?? null;

    const serial = daySerial(date);

    // 2. Deterministic rotation fallback if unassigned
    if (!websiteOfDay) {
      const idx = ((serial % eligible.length) + eligible.length) % eligible.length;
      websiteOfDay = eligible[idx];
    }

    if (!articleOfDay) {
      const available = eligible.filter((i) => i.id !== websiteOfDay?.id);
      if (available.length > 0) {
        const idx = (((serial + 1) % available.length) + available.length) % available.length;
        articleOfDay = available[idx];
      } else {
        articleOfDay = websiteOfDay;
      }
    }

    if (!developerDiscovery) {
      const available = eligible.filter(
        (i) => i.id !== websiteOfDay?.id && i.id !== articleOfDay?.id,
      );
      if (available.length > 0) {
        const idx = (((serial + 2) % available.length) + available.length) % available.length;
        developerDiscovery = available[idx];
      } else {
        developerDiscovery = articleOfDay || websiteOfDay;
      }
    }

    return {
      websiteOfDay,
      articleOfDay,
      developerDiscovery,
    };
  }

  /**
   * Generates a deterministic archive of past days using the active dataset.
   * If the dataset is empty, returns an empty array.
   */
  static resolveArchive(
    items: DiscoveryItem[],
    count = 10,
    from: Date = new Date(),
  ): ArchiveDay[] {
    const eligible = DiscoveryRepository.getEligibleItems(items);
    if (eligible.length === 0) return [];

    return Array.from({ length: count }, (_, offset) => {
      const targetDate = atOffset(from, offset);
      const serial = daySerial(targetDate);
      const idx = ((serial % eligible.length) + eligible.length) % eligible.length;
      const item = eligible[idx] ?? null;

      const label =
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Yesterday'
            : curatedShortDate(targetDate);

      return {
        date: targetDate,
        label,
        item,
        offset,
      };
    });
  }
}
