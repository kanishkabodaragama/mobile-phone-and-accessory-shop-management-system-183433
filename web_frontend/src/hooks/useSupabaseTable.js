import { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from '../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * useSupabaseTable
 * Generic Supabase table hook supporting filters, sorting, and range pagination.
 *
 * Params:
 *  - table: string
 *  - options: {
 *      select?: string,
 *      filters?: Array<[column: string, op: string, value: any]>,
 *      orderBy?: { column: string, ascending?: boolean },
 *      page?: number,
 *      pageSize?: number,
 *      count?: 'exact'|'planned'|'estimated'|null
 *    }
 *
 * Returns:
 *  - { data, total, loading, error, refetch }
 */
// PUBLIC_INTERFACE
export default function useSupabaseTable(
  table,
  { select = '*', filters = [], orderBy = null, page = 1, pageSize = 20, count = 'exact' } = {}
) {
  /** Query a Supabase table with filter/sort and pagination. */
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const range = useMemo(() => {
    const from = (Math.max(1, page) - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  const buildQuery = useCallback(() => {
    let query = supabase.from(table).select(select, { count });

    // Apply filters (support several common ops)
    (filters || []).forEach(([column, operator, value]) => {
      if (value === undefined || value === null || value === '') return;
      switch (operator) {
        case 'eq': query = query.eq(column, value); break;
        case 'neq': query = query.neq(column, value); break;
        case 'ilike': query = query.ilike(column, `%${value}%`); break;
        case 'like': query = query.like(column, value); break;
        case 'gt': query = query.gt(column, value); break;
        case 'gte': query = query.gte(column, value); break;
        case 'lt': query = query.lt(column, value); break;
        case 'lte': query = query.lte(column, value); break;
        case 'is': query = query.is(column, value); break;
        case 'in': query = query.in(column, Array.isArray(value) ? value : [value]); break;
        default: break;
      }
    });

    if (orderBy?.column) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    if (pageSize != null) {
      query = query.range(range.from, range.to);
    }

    return query;
  }, [table, select, filters, orderBy, range.from, range.to, count, pageSize]);

  const refetch = useCallback(async () => {
    if (!table) return;
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery();
      const { data, error, count: totalCount } = await query;
      if (error) {
        setError(error.message || 'Failed to fetch data');
        setData([]);
        setTotal(null);
      } else {
        setData(data || []);
        setTotal(typeof totalCount === 'number' ? totalCount : null);
      }
    } catch (err) {
      setError(err?.message || String(err));
      setData([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, table]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), range.from, range.to, count]);

  return { data, total, loading, error, refetch };
}
