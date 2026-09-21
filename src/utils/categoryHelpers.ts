import { Category, Product, Order } from '../types';

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
  path: Category[];
}

export interface FlattenedCategoryOption {
  id: string;
  nameBn: string;
  nameEn: string;
  level: number;
  pathString: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
}

/**
 * Builds a recursive tree from a flat list of categories
 */
export function buildCategoryTree(
  categories: Category[],
  parentId: string | null = null,
  level: number = 0,
  parentPath: Category[] = []
): CategoryTreeNode[] {
  const directChildren = categories
    .filter((c) => {
      if (parentId === null) {
        return !c.parentId;
      }
      return c.parentId === parentId;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return directChildren.map((cat) => {
    const currentPath = [...parentPath, cat];
    return {
      ...cat,
      level,
      path: currentPath,
      children: buildCategoryTree(categories, cat.id, level + 1, currentPath),
    };
  });
}

/**
 * Returns the breadcrumb trail for a category (from Root -> Leaf)
 */
export function getCategoryPath(
  categoryId: string | null | undefined,
  categories: Category[]
): Category[] {
  if (!categoryId) return [];

  const path: Category[] = [];
  let current: Category | undefined = categories.find((c) => c.id === categoryId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    if (!current.parentId) break;
    current = categories.find((c) => c.id === current?.parentId);
  }

  return path;
}

/**
 * Returns a readable breadcrumb string, e.g. "বই › ইসলামিক বই › তাফসির"
 */
export function getCategoryBreadcrumbString(
  categoryId: string | null | undefined,
  categories: Category[],
  separator: string = ' › '
): string {
  const path = getCategoryPath(categoryId, categories);
  return path.map((c) => c.nameBn).join(separator);
}

/**
 * Recursively retrieves all descendant category IDs (children, grandchildren, etc.)
 */
export function getDescendantCategoryIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const descendantIds: string[] = [];
  const queue = [categoryId];
  const visited = new Set<string>([categoryId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directChildren = categories.filter((c) => c.parentId === currentId);

    for (const child of directChildren) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        descendantIds.push(child.id);
        queue.push(child.id);
      }
    }
  }

  return descendantIds;
}

/**
 * Returns the category itself plus all its descendant IDs
 */
export function getAllCategoryAndDescendantIds(
  categoryId: string,
  categories: Category[]
): string[] {
  return [categoryId, ...getDescendantCategoryIds(categoryId, categories)];
}

/**
 * Checks if targetId is an ancestor of candidateChildId, or if they are the same
 * Used to strictly prevent circular parent relationships (e.g. A -> B -> C, cannot make A child of C)
 */
export function isDescendantOrSelf(
  candidateChildId: string,
  potentialAncestorId: string,
  categories: Category[]
): boolean {
  if (candidateChildId === potentialAncestorId) return true;
  const descendants = getDescendantCategoryIds(potentialAncestorId, categories);
  return descendants.includes(candidateChildId);
}

/**
 * Flattened hierarchy options for select inputs with clear indentation and paths
 */
export function getFlattenedHierarchy(
  categories: Category[],
  excludeId?: string,
  onlyActive: boolean = false
): FlattenedCategoryOption[] {
  const filtered = onlyActive ? categories.filter((c) => c.isActive) : categories;
  const tree = buildCategoryTree(filtered);
  const result: FlattenedCategoryOption[] = [];

  function traverse(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      // Exclude the category itself and its entire subtree if excludeId is given (prevents circular move)
      if (excludeId && node.id === excludeId) {
        continue;
      }

      const indent = '— '.repeat(node.level);
      const prefix = node.level > 0 ? `${indent}└ ` : '';

      result.push({
        id: node.id,
        nameBn: `${prefix}${node.nameBn}`,
        nameEn: node.nameEn,
        level: node.level,
        pathString: node.path.map((p) => p.nameBn).join(' › '),
        slug: node.slug,
        parentId: node.parentId || null,
        isActive: node.isActive,
      });

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Generate a unique URL slug from name
 */
export function generateCategorySlug(
  name: string,
  existingCategories: Category[],
  excludeId?: string
): string {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_-]+/g, '-') // collapse dashes
    .replace(/^-+|-+$/g, ''); // trim dashes

  if (!baseSlug) {
    baseSlug = `cat-${Date.now().toString(36)}`;
  }

  let finalSlug = baseSlug;
  let counter = 1;

  while (
    existingCategories.some((c) => c.slug === finalSlug && c.id !== excludeId)
  ) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

/**
 * Checks whether a category can be safely deleted or if products/children/orders depend on it
 */
export function canDeleteCategory(
  categoryId: string,
  categories: Category[],
  products: Product[],
  orders: Order[]
): {
  canDelete: boolean;
  reason?: string;
  childCount: number;
  productCount: number;
  orderCount: number;
} {
  const directChildren = categories.filter((c) => c.parentId === categoryId);
  const assignedProducts = products.filter(
    (p) => p.categoryId === categoryId || p.categoryIds?.includes(categoryId)
  );

  // Check if any historical orders have items that belong to this category
  const productIds = new Set(assignedProducts.map((p) => p.id));
  const orderCount = orders.filter((o) =>
    o.items.some((item) => productIds.has(item.productId))
  ).length;

  if (directChildren.length > 0) {
    return {
      canDelete: false,
      reason: `এই ক্যাটাগরির অধীনে ${directChildren.length} টি সাব-ক্যাটাগরি রয়েছে। মুছে ফেলার আগে সেগুলোকে অন্য কোথাও সরান অথবা মুছে ফেলুন।`,
      childCount: directChildren.length,
      productCount: assignedProducts.length,
      orderCount,
    };
  }

  if (assignedProducts.length > 0) {
    return {
      canDelete: false,
      reason: `এই ক্যাটাগরিতে ${assignedProducts.length} টি পণ্য যুক্ত আছে। মুছে ফেলার আগে পণ্যগুলোকে অন্য ক্যাটাগরিতে সরান।`,
      childCount: 0,
      productCount: assignedProducts.length,
      orderCount,
    };
  }

  return {
    canDelete: true,
    childCount: 0,
    productCount: 0,
    orderCount,
  };
}
