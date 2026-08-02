/** Global rank index in user's preference order, or -1 if unranked. */
const globalRankIndex = (ratings, movieId, tmdbId) => {
  const idStr = String(movieId);
  const tmdbStr = tmdbId != null ? String(tmdbId) : null;
  return (ratings || []).findIndex((r) => {
    const rid = String(r.id);
    return rid === idStr || (tmdbStr && rid === tmdbStr);
  });
};

/**
 * Insert so list order mirrors the user's overall ranking.
 * Ranked films stay sorted by global preference; unranked films stay after them.
 */
const insertMovieByRanking = (listMovies, newMovie, ratings) => {
  const newRank = globalRankIndex(ratings, newMovie.movieId, newMovie.tmdbId);
  if (newRank === -1) {
    listMovies.push(newMovie);
    return listMovies.length - 1;
  }

  let insertAt = listMovies.length;
  for (let i = 0; i < listMovies.length; i += 1) {
    const m = listMovies[i];
    const mRank = globalRankIndex(ratings, m.movieId, m.tmdbId);
    if (mRank === -1 || mRank > newRank) {
      insertAt = i;
      break;
    }
  }
  listMovies.splice(insertAt, 0, newMovie);
  return insertAt;
};

/** Re-sort an existing list so ranked movies match global preference order. */
const sortListMoviesByRanking = (listMovies, ratings) => {
  const ranked = [];
  const unranked = [];
  for (const m of listMovies || []) {
    const rank = globalRankIndex(ratings, m.movieId, m.tmdbId);
    if (rank === -1) unranked.push(m);
    else ranked.push({ m, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank);
  return [...ranked.map((x) => x.m), ...unranked];
};

const orderChanged = (before, after) => {
  if ((before || []).length !== (after || []).length) return true;
  return after.some((m, i) => {
    const prev = before[i];
    return (
      String(prev?.movieId) !== String(m?.movieId) ||
      String(prev?.tmdbId ?? '') !== String(m?.tmdbId ?? '')
    );
  });
};

module.exports = {
  globalRankIndex,
  insertMovieByRanking,
  sortListMoviesByRanking,
  orderChanged,
};
