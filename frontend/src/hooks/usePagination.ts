import { useState, useCallback } from 'react';
import { PAGINATION } from '../utils/constants';

interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export const usePagination = (initialLimit: number = PAGINATION.DEFAULT_LIMIT) => {
  const [state, setState] = useState<PaginationState>({
    page: PAGINATION.DEFAULT_PAGE,
    limit: initialLimit,
    hasMore: true,
    isLoadingMore: false,
  });

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.isLoadingMore) return;
    setState(prev => ({
      ...prev,
      page: prev.page + 1,
      isLoadingMore: true,
    }));
  }, [state.hasMore, state.isLoadingMore]);

  const reset = useCallback(() => {
    setState({
      page: PAGINATION.DEFAULT_PAGE,
      limit: initialLimit,
      hasMore: true,
      isLoadingMore: false,
    });
  }, [initialLimit]);

  const setHasMore = useCallback((hasMore: boolean) => {
    setState(prev => ({ ...prev, hasMore, isLoadingMore: false }));
  }, []);

  const setLoadingMore = useCallback((isLoadingMore: boolean) => {
    setState(prev => ({ ...prev, isLoadingMore }));
  }, []);

  return {
    ...state,
    loadMore,
    reset,
    setHasMore,
    setLoadingMore,
  };
};
