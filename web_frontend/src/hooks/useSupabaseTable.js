import { useEffect, useMemo, useState } from 'react';
import { listProducts } from '../lib/api/products';

/**
 * PUBLIC_INTERFACE
 * useSupabaseTable
 * Generic-ish table hook for paginated, searchable data backed by Supabase.
 * For now, specialized to products via products API to keep scope minimal.
 *
 * Params:
 *  - initialQuery: { search?: string, category?: string, page?: number, pageSize?: number }
 *
 * Returns:
 *  - data, count, loading, error
 *  - query state: search, category, page, pageSize
 *  - setters: setSearch, setCategory, setPage, setPageSize, refresh
 */
// PUBLIC_INTERFACE
export default function useSupabaseTable(initialQuery = {}) {
  /** This is a public function. */
  const [search, setSearch] = useState(initialQuery.search || '');
  const [category, setCategory] = useState(initialQuery.category || '');
  const [page, setPage] = useState(initialQuery.page || 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize || 10);

  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useMemo(() => ({ search, category, page, pageSize }), [search, category, page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listProducts(params);
      setData(res.data || []);
      setCount(res.count || 0);
      if (res.status !== 'OK' && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err);
      setData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page, pageSize]);

  return {
    data,
    count,
    loading,
    error,
    search,
    category,
    page,
    pageSize,
    setSearch,
    setCategory,
    setPage,
    setPageSize,
    refresh: fetchData,
  };
}
