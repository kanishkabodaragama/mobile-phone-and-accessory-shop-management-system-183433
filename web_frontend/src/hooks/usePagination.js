/**
 * Simple client-side pagination state and helpers.
 * Supports total count, page size, current page, and derived values.
 */

// PUBLIC_INTERFACE
import { useCallback, useMemo, useState } from 'react';

export default function usePagination(options = {}) {
  /** Manage pagination state for tables and lists. */
  const {
    initialPage = 1,
    initialPageSize = 10,
    total = 0,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    if (!total || !pageSize) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const canNext = page < totalPages;
  const canPrev = page > 1;

  const next = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prev = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    canNext,
    canPrev,
    setPage,
    setPageSize,
    next,
    prev,
    reset,
  };
}
