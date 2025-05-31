// src/hooks/useInteractions.js

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  toggleLikeBergerie, 
  toggleLikePost, 
  checkIfLiked 
} from '../services/likes';
import { 
  toggleFollowBergerie, 
  checkIfFollowing 
} from '../services/follows';

/**
 * Hook personnalisé pour gérer les interactions utilisateur (likes, follows)
 * @param {string} targetId - ID de l'élément cible (bergerie ou post)
 * @param {string} targetType - Type d'élément ('bergerie' ou 'post')
 * @returns {object} - État et fonctions d'interaction
 */
export const useInteractions = (targetId, targetType = 'bergerie') => {
  const { currentUser } = useAuth();
  
  // États locaux
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    like: false,
    follow: false
  });

  /**
   * Charger l'état initial des interactions
   */
  useEffect(() => {
    const loadInteractionStates = async () => {
      if (!currentUser || !targetId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Chargement des états d\'interaction pour:', { targetId, targetType });

        // Vérifier le statut de like
        const likedStatus = await checkIfLiked(currentUser.uid, targetId, targetType);
        setIsLiked(likedStatus);
        console.log('Statut like:', likedStatus);

        // Vérifier le statut de follow (seulement pour les bergeries)
        if (targetType === 'bergerie') {
          const followStatus = await checkIfFollowing(currentUser.uid, targetId);
          setIsFollowing(followStatus);
          console.log('Statut follow:', followStatus);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des états d\'interaction:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInteractionStates();
  }, [currentUser, targetId, targetType]);

  /**
   * Gérer le like/unlike
   */
  const handleLike = async () => {
    if (!currentUser) {
      console.warn('Utilisateur non connecté');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, like: true }));
      console.log('Toggle like pour:', { targetId, targetType });

      let newLikedStatus;
      if (targetType === 'bergerie') {
        newLikedStatus = await toggleLikeBergerie(currentUser.uid, targetId);
      } else if (targetType === 'post') {
        newLikedStatus = await toggleLikePost(currentUser.uid, targetId);
      }

      // Mettre à jour l'état local
      setIsLiked(newLikedStatus);
      
      // Mettre à jour le compteur localement pour un feedback immédiat
      setLikesCount(prev => newLikedStatus ? prev + 1 : prev - 1);
      
      console.log('Nouveau statut like:', newLikedStatus);
    } catch (error) {
      console.error('Erreur lors du toggle like:', error);
      // Optionnel : afficher une erreur à l'utilisateur
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }));
    }
  };

  /**
   * Gérer le follow/unfollow (seulement pour les bergeries)
   */
  const handleFollow = async () => {
    if (!currentUser) {
      console.warn('Utilisateur non connecté');
      return;
    }

    if (targetType !== 'bergerie') {
      console.warn('Follow disponible seulement pour les bergeries');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, follow: true }));
      console.log('Toggle follow pour:', targetId);

      const newFollowingStatus = await toggleFollowBergerie(currentUser.uid, targetId);

      // Mettre à jour l'état local
      setIsFollowing(newFollowingStatus);
      
      // Mettre à jour le compteur localement pour un feedback immédiat
      setFollowersCount(prev => newFollowingStatus ? prev + 1 : prev - 1);
      
      console.log('Nouveau statut follow:', newFollowingStatus);
    } catch (error) {
      console.error('Erreur lors du toggle follow:', error);
      // Optionnel : afficher une erreur à l'utilisateur
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  /**
   * Mettre à jour les compteurs depuis les props externes
   */
  const updateCounts = (newLikesCount, newFollowersCount) => {
    if (typeof newLikesCount === 'number') {
      setLikesCount(newLikesCount);
    }
    if (typeof newFollowersCount === 'number') {
      setFollowersCount(newFollowersCount);
    }
  };

  /**
   * Réinitialiser les états (utile lors du changement de target)
   */
  const resetStates = () => {
    setIsLiked(false);
    setIsFollowing(false);
    setLikesCount(0);
    setFollowersCount(0);
    setLoading(true);
    setActionLoading({ like: false, follow: false });
  };

  return {
    // États
    isLiked,
    isFollowing,
    likesCount,
    followersCount,
    loading,
    actionLoading,
    
    // Actions
    handleLike,
    handleFollow,
    updateCounts,
    resetStates,
    
    // Statuts
    canInteract: !!currentUser,
    isLikeLoading: actionLoading.like,
    isFollowLoading: actionLoading.follow
  };
};