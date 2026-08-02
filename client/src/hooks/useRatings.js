import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const GUEST_STORAGE_KEY = 'guestRatings';
const USER_STORAGE_PREFIX = 'userRatings:';

const RatingsContext = createContext(null);

export function RatingsProvider({ children }) {
  const { user } = useAuth();
  const prevUserIdRef = useRef(null);
  const skipPersistRef = useRef(false);
  const isHydratingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const currentUserId = user?._id || prevUserIdRef.current || null;

    if (isHydratingRef.current && !hasHydratedRef.current) {
      if (!(currentUserId && prevUserIdRef.current === currentUserId)) {
        return;
      }
    }

    try {
      if (currentUserId) {
        localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(ratings));
      } else {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(ratings));
      }
    } catch {}

    const token = localStorage.getItem('token');
    const userIdToSave = user?._id || (token ? prevUserIdRef.current : null);

    if (token && userIdToSave && prevUserIdRef.current === userIdToSave && ratings.length > 0) {
      api.put('/api/ratings', { ratings }).catch((error) => {
        console.error('[RATINGS] Error saving to server:', error);
      });
    }
  }, [ratings, user]);

  useEffect(() => {
    const currentUserId = user?._id || null;
    const prevUserId = prevUserIdRef.current;
    if (prevUserId === currentUserId) return;

    if (prevUserId && ratings.length > 0 && currentUserId === null) {
      const token = localStorage.getItem('token');
      if (token) {
        api.put('/api/ratings', { ratings }).catch(() => {
          try {
            localStorage.setItem(`${USER_STORAGE_PREFIX}${prevUserId}`, JSON.stringify(ratings));
          } catch {}
        });
      } else {
        try {
          localStorage.setItem(`${USER_STORAGE_PREFIX}${prevUserId}`, JSON.stringify(ratings));
        } catch {}
      }
    }

    prevUserIdRef.current = currentUserId;
    hasHydratedRef.current = false;
    skipPersistRef.current = true;
    setRatings([]);

    if (!currentUserId) {
      try {
        const guestRaw = localStorage.getItem(GUEST_STORAGE_KEY);
        setRatings(guestRaw ? JSON.parse(guestRaw) : []);
      } catch {
        setRatings([]);
      }
      hasHydratedRef.current = true;
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      hasHydratedRef.current = true;
      return;
    }

    (async () => {
      try {
        isHydratingRef.current = true;
        const res = await api.get('/api/ratings');
        const serverRatings = Array.isArray(res.data?.ratings) ? res.data.ratings : [];

        if (serverRatings.length > 0) {
          setRatings(serverRatings);
          try {
            localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(serverRatings));
          } catch {}
        } else {
          const migratedKey = `migrated:${currentUserId}`;
          const alreadyMigrated = localStorage.getItem(migratedKey) === '1';

          if (!alreadyMigrated) {
            let guest = [];
            try {
              const raw = localStorage.getItem(GUEST_STORAGE_KEY);
              guest = raw ? JSON.parse(raw) : [];
            } catch {}

            if (guest.length > 0) {
              await api.put('/api/ratings', { ratings: guest });
              setRatings(guest);
              try {
                localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(guest));
                localStorage.setItem(migratedKey, '1');
                localStorage.removeItem(GUEST_STORAGE_KEY);
              } catch {}
            } else {
              setRatings([]);
              try {
                localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify([]));
                localStorage.setItem(migratedKey, '1');
              } catch {}
            }
          } else {
            setRatings([]);
          }
        }
      } catch (error) {
        console.error('[RATINGS] Error fetching ratings:', error);
        setRatings([]);
      } finally {
        isHydratingRef.current = false;
        hasHydratedRef.current = true;
        skipPersistRef.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const computeScore = useCallback((index, total) => {
    if (total <= 1) return 10.0;
    const raw = 10 - (9 * index) / (total - 1);
    return Math.round(raw * 10) / 10;
  }, []);

  const withScores = useMemo(() => {
    return ratings.map((item, index) => ({
      ...item,
      rank: index,
      score: computeScore(index, ratings.length),
    }));
  }, [ratings, computeScore]);

  const upsertAtIndex = useCallback((movie, index) => {
    const movieIdStr = String(movie.id);
    const existsIdx = ratings.findIndex((r) => String(r.id) === movieIdStr);
    const updated = ratings.slice();
    if (existsIdx !== -1) {
      updated.splice(existsIdx, 1);
    }
    const entry = {
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate || movie.release_date || null,
      genres: movie.genres || movie.genre_ids || null,
      ratedAt: new Date().toISOString(),
    };
    const safeIndex = Math.max(0, Math.min(index, updated.length));
    updated.splice(safeIndex, 0, entry);

    try {
      if (user?._id) {
        localStorage.setItem(`${USER_STORAGE_PREFIX}${user._id}`, JSON.stringify(updated));
        const token = localStorage.getItem('token');
        if (token) {
          api.put('/api/ratings', { ratings: updated }).catch((error) => {
            console.error('[RATINGS] Error saving to server:', error);
          });
        }
      } else {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('[RATINGS] Error persisting rating:', error);
    }

    setRatings(updated);
    return updated;
  }, [ratings, user]);

  const clearAll = useCallback(() => setRatings([]), []);

  const setRatingsArray = useCallback((newRatings) => {
    const next = Array.isArray(newRatings) ? newRatings : [];
    setRatings(next);
    try {
      if (user?._id) {
        localStorage.setItem(`${USER_STORAGE_PREFIX}${user._id}`, JSON.stringify(next));
        const token = localStorage.getItem('token');
        if (token) {
          api.put('/api/ratings', { ratings: next }).catch((error) => {
            console.error('[RATINGS] Error saving reordered ratings:', error);
          });
        }
      } else {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next));
      }
    } catch (error) {
      console.error('[RATINGS] Error persisting ratings array:', error);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      ratings: withScores,
      rawRatings: ratings,
      computeScore,
      upsertAtIndex,
      clearAll,
      setRatingsArray,
    }),
    [withScores, ratings, computeScore, upsertAtIndex, clearAll, setRatingsArray]
  );

  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>;
}

export function useRatings() {
  const ctx = useContext(RatingsContext);
  if (!ctx) {
    throw new Error('useRatings must be used within a RatingsProvider');
  }
  return ctx;
}
