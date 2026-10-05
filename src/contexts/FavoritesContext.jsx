import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

function loadFavorites(userId) {
  return supabase.from('study_favorites')
    .select('subject_id, material_id, created_at, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const activeUserId = useRef(user?.id);
  activeUserId.current = user?.id;
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMaterialId, setPendingMaterialId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setPendingMaterialId(null);
    setIsReordering(false);

    if (!user) {
      setFavorites([]);
      setError('');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    setFavorites([]);
    setError('');
    setIsLoading(true);
    loadFavorites(user.id).then(({ data, error: fetchError }) => {
      if (!isMounted) return;
      if (fetchError) setError('즐겨찾기 자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      else setFavorites(data ?? []);
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [user?.id]);

  const isFavorite = useCallback((materialId) => favorites.some((favorite) => favorite.material_id === materialId), [favorites]);

  const toggleFavorite = useCallback(async ({ subjectId, materialId }) => {
    if (!user || isReordering || pendingMaterialId === materialId) return false;

    const wasFavorite = isFavorite(materialId);
    const sortOrder = favorites.length ? favorites[0].sort_order - 1 : 0;
    setPendingMaterialId(materialId);
    setError('');

    const result = wasFavorite
      ? await supabase.from('study_favorites').delete().eq('user_id', user.id).eq('material_id', materialId)
      : await supabase.from('study_favorites').insert({ user_id: user.id, subject_id: subjectId, material_id: materialId, sort_order: sortOrder });

    if (activeUserId.current !== user.id) return false;
    setPendingMaterialId(null);
    if (result.error) {
      setError('즐겨찾기를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    setFavorites((current) => wasFavorite
      ? current.filter((favorite) => favorite.material_id !== materialId)
      : [{ subject_id: subjectId, material_id: materialId, created_at: new Date().toISOString(), sort_order: sortOrder }, ...current]);
    return true;
  }, [favorites, isFavorite, isReordering, pendingMaterialId, user]);

  const reorderFavorites = useCallback(async (draggedId, targetId) => {
    if (!user || isReordering || pendingMaterialId) return false;

    const fromIndex = favorites.findIndex((favorite) => favorite.material_id === draggedId);
    const toIndex = favorites.findIndex((favorite) => favorite.material_id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return false;

    const next = [...favorites];
    const [dragged] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragged);
    const reordered = next.map((favorite, index) => ({ ...favorite, sort_order: index }));

    setFavorites(reordered);
    setIsReordering(true);
    setError('');
    const { error: saveError } = await supabase.rpc('reorder_study_favorites', {
      p_material_ids: reordered.map((favorite) => favorite.material_id),
    });
    if (activeUserId.current !== user.id) return false;
    setIsReordering(false);

    if (saveError) {
      const { data } = await loadFavorites(user.id);
      setFavorites(data ?? favorites);
      setError('즐겨찾기 순서를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    return true;
  }, [favorites, isReordering, pendingMaterialId, user]);

  return <FavoritesContext.Provider value={{ favorites, isLoading, error, pendingMaterialId, isReordering, isFavorite, toggleFavorite, reorderFavorites }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites는 FavoritesProvider 안에서 사용해야 합니다.');
  return context;
}
