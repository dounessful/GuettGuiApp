// src/services/likes.js

import { 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';

/**
 * Liker une bergerie
 * @param {string} userId - ID de l'utilisateur qui like
 * @param {string} bergerieId - ID de la bergerie à liker
 * @returns {Promise<object>} - Données du like créé
 */
export const likeBergerie = async (userId, bergerieId) => {
  try {
    console.log('Tentative de like bergerie:', { userId, bergerieId });
    
    // Vérifier si l'utilisateur a déjà liké cette bergerie
    const existingLike = await checkIfLiked(userId, bergerieId, 'bergerie');
    if (existingLike) {
      throw new Error('Vous avez déjà liké cette bergerie');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Créer le document de like
    const likeRef = doc(collection(firestore, 'likes'));
    const likeData = {
      userId,
      targetId: bergerieId,
      targetType: 'bergerie',
      createdAt: serverTimestamp()
    };
    batch.set(likeRef, likeData);
    
    // 2. Incrémenter le compteur de likes de la bergerie
    const bergerieRef = doc(firestore, 'bergeries', bergerieId);
    batch.update(bergerieRef, {
      'stats.likesCount': increment(1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Like bergerie créé avec succès');
    return { id: likeRef.id, ...likeData };
  } catch (error) {
    console.error('Erreur lors du like bergerie:', error);
    throw error;
  }
};

/**
 * Unliker une bergerie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<void>}
 */
export const unlikeBergerie = async (userId, bergerieId) => {
  try {
    console.log('Tentative d\'unlike bergerie:', { userId, bergerieId });
    
    // Trouver le document de like
    const likeDoc = await getLikeDocument(userId, bergerieId, 'bergerie');
    if (!likeDoc) {
      throw new Error('Vous n\'avez pas liké cette bergerie');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Supprimer le document de like
    const likeRef = doc(firestore, 'likes', likeDoc.id);
    batch.delete(likeRef);
    
    // 2. Décrémenter le compteur de likes de la bergerie
    const bergerieRef = doc(firestore, 'bergeries', bergerieId);
    batch.update(bergerieRef, {
      'stats.likesCount': increment(-1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Unlike bergerie réussi');
  } catch (error) {
    console.error('Erreur lors de l\'unlike bergerie:', error);
    throw error;
  }
};

/**
 * Liker un post
 * @param {string} userId - ID de l'utilisateur qui like
 * @param {string} postId - ID du post à liker
 * @returns {Promise<object>} - Données du like créé
 */
export const likePost = async (userId, postId) => {
  try {
    console.log('Tentative de like post:', { userId, postId });
    
    // Vérifier si l'utilisateur a déjà liké ce post
    const existingLike = await checkIfLiked(userId, postId, 'post');
    if (existingLike) {
      throw new Error('Vous avez déjà liké ce post');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Créer le document de like
    const likeRef = doc(collection(firestore, 'likes'));
    const likeData = {
      userId,
      targetId: postId,
      targetType: 'post',
      createdAt: serverTimestamp()
    };
    batch.set(likeRef, likeData);
    
    // 2. Incrémenter le compteur de likes du post
    const postRef = doc(firestore, 'posts', postId);
    batch.update(postRef, {
      'stats.likesCount': increment(1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Like post créé avec succès');
    return { id: likeRef.id, ...likeData };
  } catch (error) {
    console.error('Erreur lors du like post:', error);
    throw error;
  }
};

/**
 * Unliker un post
 * @param {string} userId - ID de l'utilisateur
 * @param {string} postId - ID du post
 * @returns {Promise<void>}
 */
export const unlikePost = async (userId, postId) => {
  try {
    console.log('Tentative d\'unlike post:', { userId, postId });
    
    // Trouver le document de like
    const likeDoc = await getLikeDocument(userId, postId, 'post');
    if (!likeDoc) {
      throw new Error('Vous n\'avez pas liké ce post');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Supprimer le document de like
    const likeRef = doc(firestore, 'likes', likeDoc.id);
    batch.delete(likeRef);
    
    // 2. Décrémenter le compteur de likes du post
    const postRef = doc(firestore, 'posts', postId);
    batch.update(postRef, {
      'stats.likesCount': increment(-1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Unlike post réussi');
  } catch (error) {
    console.error('Erreur lors de l\'unlike post:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur a liké un élément
 * @param {string} userId - ID de l'utilisateur
 * @param {string} targetId - ID de l'élément (bergerie ou post)
 * @param {string} targetType - Type d'élément ('bergerie' ou 'post')
 * @returns {Promise<boolean>} - true si l'utilisateur a liké
 */
export const checkIfLiked = async (userId, targetId, targetType) => {
  try {
    const likeDoc = await getLikeDocument(userId, targetId, targetType);
    return !!likeDoc;
  } catch (error) {
    console.error('Erreur lors de la vérification du like:', error);
    return false;
  }
};

/**
 * Récupérer le document de like entre un utilisateur et un élément
 * @param {string} userId - ID de l'utilisateur
 * @param {string} targetId - ID de l'élément
 * @param {string} targetType - Type d'élément
 * @returns {Promise<object|null>} - Document de like ou null
 */
const getLikeDocument = async (userId, targetId, targetType) => {
  try {
    const q = query(
      collection(firestore, 'likes'),
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du document de like:', error);
    return null;
  }
};

/**
 * Basculer le statut de like (like/unlike) pour une bergerie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<boolean>} - Nouveau statut (true = liké, false = pas liké)
 */
export const toggleLikeBergerie = async (userId, bergerieId) => {
  try {
    const isLiked = await checkIfLiked(userId, bergerieId, 'bergerie');
    
    if (isLiked) {
      await unlikeBergerie(userId, bergerieId);
      return false;
    } else {
      await likeBergerie(userId, bergerieId);
      return true;
    }
  } catch (error) {
    console.error('Erreur lors du toggle like bergerie:', error);
    throw error;
  }
};

/**
 * Basculer le statut de like (like/unlike) pour un post
 * @param {string} userId - ID de l'utilisateur
 * @param {string} postId - ID du post
 * @returns {Promise<boolean>} - Nouveau statut (true = liké, false = pas liké)
 */
export const toggleLikePost = async (userId, postId) => {
  try {
    const isLiked = await checkIfLiked(userId, postId, 'post');
    
    if (isLiked) {
      await unlikePost(userId, postId);
      return false;
    } else {
      await likePost(userId, postId);
      return true;
    }
  } catch (error) {
    console.error('Erreur lors du toggle like post:', error);
    throw error;
  }
};

/**
 * Récupérer les likes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} targetType - Type d'élément ('bergerie', 'post', ou null pour tous)
 * @param {number} limitCount - Nombre max de résultats
 * @returns {Promise<Array>} - Liste des likes
 */
export const getUserLikes = async (userId, targetType = null, limitCount = 50) => {
  try {
    let constraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];
    
    if (targetType) {
      constraints.splice(1, 0, where('targetType', '==', targetType));
    }
    
    const q = query(collection(firestore, 'likes'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const likes = [];
    querySnapshot.forEach((doc) => {
      likes.push({ id: doc.id, ...doc.data() });
    });
    
    return likes;
  } catch (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    throw error;
  }
};