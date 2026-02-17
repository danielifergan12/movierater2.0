import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const GUEST_STORAGE_KEY = 'guestRatings';
const USER_STORAGE_PREFIX = 'userRatings:'; // followed by userId

export function useRatings() {
  const { user } = useAuth();
  const prevUserIdRef = useRef(null);
  const skipPersistRef = useRef(false);
  const isHydratingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  // Always start with empty array - hydration effect will load correct data
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    // Skip persist during user transitions to avoid leaking ratings between accounts
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    
    // Get current user ID - use user._id if available, otherwise check prevUserIdRef (for logout scenario)
    const currentUserId = user?._id || prevUserIdRef.current || null;
    
    // Only persist if we have a valid user context (hydration may still be in progress, that's ok)
    // But don't persist if we're currently hydrating from a different user
    if (isHydratingRef.current && !hasHydratedRef.current) {
      // Still allow saves during hydration if user matches (user just added a rating)
      if (currentUserId && prevUserIdRef.current === currentUserId) {
        // Same user, allow save
      } else {
        // Different user or no user, skip
        return;
      }
    }
    
    // Persist to appropriate local storage key
    try {
      if (currentUserId) {
        localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(ratings));
      } else {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(ratings));
      }
    } catch {}
    
    // Push to server if authenticated and user matches
    // Use prevUserIdRef if user is null (logout scenario) to save before losing user context
    const token = localStorage.getItem('token');
    const userIdToSave = user?._id || (token ? prevUserIdRef.current : null);
    
    if (token && userIdToSave && prevUserIdRef.current === userIdToSave && ratings.length > 0) {
      console.log(`[RATINGS] Auto-saving ${ratings.length} ratings to server for user ${userIdToSave}`);
          api.put('/api/ratings', { ratings }).catch((error) => {
        console.error('[RATINGS] Error saving to server:', error);
        console.error('[RATINGS] Error response:', error.response?.data);
      });
    }
  }, [ratings, user]);

  // Hydrate/merge behavior on user changes
  useEffect(() => {
    const currentUserId = user?._id || null;
    const prevUserId = prevUserIdRef.current;
    if (prevUserId === currentUserId) return;
    
    // Before clearing, save previous user's ratings if we have them and they're not empty
    // This handles the logout scenario where user becomes null
    if (prevUserId && ratings.length > 0 && currentUserId === null) {
      // User is logging out - save ratings before losing user context
      // Get token before it might be removed
      const token = localStorage.getItem('token');
      if (token) {
        console.log(`[RATINGS] Saving ${ratings.length} ratings before logout for user ${prevUserId}`);
        // Save synchronously if possible, or at least attempt save
        api.put('/api/ratings', { ratings }).then(() => {
          console.log(`[RATINGS] Successfully saved ratings before logout`);
        }).catch((error) => {
          console.error('[RATINGS] Error saving before logout:', error);
          // Even if save fails, keep ratings in localStorage for recovery
          try {
            localStorage.setItem(`${USER_STORAGE_PREFIX}${prevUserId}`, JSON.stringify(ratings));
            console.log(`[RATINGS] Saved to localStorage as backup`);
          } catch {}
        });
      } else {
        // No token but we have ratings - save to localStorage as backup
        console.log(`[RATINGS] No token available, saving to localStorage as backup for user ${prevUserId}`);
        try {
          localStorage.setItem(`${USER_STORAGE_PREFIX}${prevUserId}`, JSON.stringify(ratings));
        } catch {}
      }
    }
    
    console.log(`[RATINGS] User change detected: ${prevUserId} -> ${currentUserId}`);
    prevUserIdRef.current = currentUserId;
    hasHydratedRef.current = false;
    skipPersistRef.current = true;
    setRatings([]);
    console.log(`[RATINGS] Cleared ratings state for user transition`);

    if (!currentUserId) {
      // User -> guest: load guest cache and finish
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
        console.log(`[RATINGS] Fetching ratings for user: ${currentUserId}`);
        const res = await api.get('/api/ratings');
        console.log('[RATINGS] Server response:', res.data);
        const serverRatings = Array.isArray(res.data?.ratings) ? res.data.ratings : [];
        console.log(`[RATINGS] Loaded ${serverRatings.length} ratings for user ${currentUserId}`);

        if (serverRatings.length > 0) {
          // Server has ratings - use them
          console.log(`[RATINGS] Setting ${serverRatings.length} ratings from server for user ${currentUserId}`);
          setRatings(serverRatings);
          try {
            localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(serverRatings));
          } catch {}
        } else {
          console.log(`[RATINGS] Server returned empty ratings for user ${currentUserId}`);
          // Server is empty - check if we should migrate guest ratings (only once per account)
          const migratedKey = `migrated:${currentUserId}`;
          const alreadyMigrated = localStorage.getItem(migratedKey) === '1';
          
          if (!alreadyMigrated) {
            // First time logging in - check for guest ratings to migrate
            let guest = [];
            try {
              const raw = localStorage.getItem(GUEST_STORAGE_KEY);
              guest = raw ? JSON.parse(raw) : [];
            } catch {}
            
            if (guest.length > 0) {
              // Migrate guest ratings to this account
              console.log(`[RATINGS] Migrating ${guest.length} guest ratings to user ${currentUserId}`);
              await api.put('/api/ratings', { ratings: guest });
              setRatings(guest);
              try {
                localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify(guest));
                localStorage.setItem(migratedKey, '1');
                localStorage.removeItem(GUEST_STORAGE_KEY);
              } catch {}
            } else {
              // No guest ratings - new account starts empty
              console.log(`[RATINGS] No guest ratings to migrate, starting empty for user ${currentUserId}`);
              setRatings([]);
              try {
                localStorage.setItem(`${USER_STORAGE_PREFIX}${currentUserId}`, JSON.stringify([]));
                localStorage.setItem(migratedKey, '1'); // Mark as migrated so we don't check again
              } catch {}
            }
          } else {
            // Already migrated before - account has no ratings, keep it empty
            console.log(`[RATINGS] Already migrated, keeping empty for user ${currentUserId}`);
            setRatings([]);
          }
        }
      } catch (error) {
        console.error('[RATINGS] Error fetching ratings:', error);
        console.error('[RATINGS] Error response:', error.response?.data);
        setRatings([]);
      } finally {
        isHydratingRef.current = false;
        hasHydratedRef.current = true;
        skipPersistRef.current = true;
        console.log(`[RATINGS] Hydration complete for user ${currentUserId}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // (Transition handling consolidated in the user change effect above)

  const computeScore = useCallback((index, total) => {
    // Evenly distribute scores from 10 (best) to 1 (worst), unique 1.0 for last item
    if (total <= 1) return 10.0;
    const raw = 10 - (9 * index) / (total - 1);
    return Math.round(raw * 10) / 10; // one decimal
  }, []);

  const withScores = useMemo(() => {
    return ratings.map((item, index) => ({
      ...item,
      rank: index,
      score: computeScore(index, ratings.length),
    }));
  }, [ratings, computeScore]);

  const upsertAtIndex = useCallback((movie, index) => {
    const existsIdx = ratings.findIndex(r => r.id === movie.id);
    let updated = ratings.slice();
    if (existsIdx !== -1) {
      updated.splice(existsIdx, 1);
    }
    const entry = {
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      // Optionally store additional metadata for filtering
      releaseDate: movie.releaseDate || movie.release_date || null,
      genres: movie.genres || movie.genre_ids || null,
    };
    updated.splice(index, 0, entry);
    console.log(`[RATINGS] Adding rating for movie: ${movie.title} at index ${index} for user ${user?._id || 'guest'}`);
    
    // Persist immediately to avoid losing changes on fast navigations
    try {
      if (user?._id) {
        localStorage.setItem(`${USER_STORAGE_PREFIX}${user._id}`, JSON.stringify(updated));
        // Immediately save to server if authenticated (even during hydration)
        const token = localStorage.getItem('token');
        if (token) {
          console.log(`[RATINGS] Immediately saving ${updated.length} ratings to server for user ${user._id}`);
          api.put('/api/ratings', { ratings: updated }).catch((error) => {
            console.error('[RATINGS] Error saving to server:', error);
            console.error('[RATINGS] Error response:', error.response?.data);
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
    setRatings(newRatings);
  }, []);

  return {
    ratings: withScores,
    rawRatings: ratings,
    computeScore,
    upsertAtIndex,
    clearAll,
    setRatingsArray,
  };
}


