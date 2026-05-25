export function toPaginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
  itemsKey: string,
): Record<string, unknown> {
  return {
    [itemsKey]: items,
    items,
    total,
    limit,
    offset,
  };
}
