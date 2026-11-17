import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStats } from '../api';
import useSocketEvent from './useSocketEvent';

function useStats() {
  const [stats, setStats] = useState(null);
  const timer = useRef(null);

  const reload = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchStats()
        .then(({ data }) => setStats(data.data))
        .catch(() => {});
    }, 300);
  }, []);

  useEffect(() => {
    reload();
    return () => clearTimeout(timer.current);
  }, [reload]);

  useSocketEvent('post:created', reload);
  useSocketEvent('post:deleted', reload);
  useSocketEvent('post:comments', reload);

  return { stats, reload };
}

export default useStats;
