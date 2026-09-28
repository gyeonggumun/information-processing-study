import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMaterialId, setPendingMaterialId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setFavorites([]);
      setError('');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    setIsLoading(true);
    supabase.from('study_favorites').select('subject_id, material_id, created_at').order('created_at', { ascending: false }).then(({ data, error: fetchError }) => {
      if (!isMounted) return;
      if (fetchError) setError('즐겨찾기 자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      else setFavorites(data ?? []);
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [user?.id]);

  const isFavorite = useCallback((materialId) => favorites.some((favorite) => favorite.material_id === materialId), [favorites]);

  const toggleFavorite = useCallback(async ({ subjectId, materialId }) => {
    if (!user || pendingMaterialId === materialId) return false;

    const wasFavorite = isFavorite(materialId);
    setPendingMaterialId(materialId);
    setError('');

    const result = wasFavorite
      ? await supabase.from('study_favorites').delete().eq('user_id', user.id).eq('material_id', materialId)
      : await supabase.from('study_favorites').insert({ user_id: user.id, subject_id: subjectId, material_id: materialId });

    setPendingMaterialId(null);
    if (result.error) {
      setError('즐겨찾기를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    setFavorites((current) => wasFavorite
      ? current.filter((favorite) => favorite.material_id !== materialId)
      : [{ subject_id: subjectId, material_id: materialId, created_at: new Date().toISOString() }, ...current]);
    return true;
  }, [isFavorite, pendingMaterialId, user]);

  return <FavoritesContext.Provider value={{ favorites, isLoading, error, pendingMaterialId, isFavorite, toggleFavorite }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites는 FavoritesProvider 안에서 사용해야 합니다.');
  return context;
}
