// src/services/follows.js

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
 * Suivre une bergerie
 * @param {string} userId - ID de l'utilisateur qui suit
 * @param {string} bergerieId - ID de la bergerie à suivre
 * @returns {Promise<object>} - Données du follow créé
 */
export const followBergerie = async (userId, bergerieId) => {
  try {
    console.log('Tentative de follow:', { userId, bergerieId });
    
    // Vérifier si l'utilisateur suit déjà cette bergerie
    const existingFollow = await checkIfFollowing(userId, bergerieId);
    if (existingFollow) {
      throw new Error('Vous suivez déjà cette bergerie');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Créer le document de follow
    const followRef = doc(collection(firestore, 'follows'));
    const followData = {
      userId,
      bergerieId,
      createdAt: serverTimestamp()
    };
    batch.set(followRef, followData);
    
    // 2. Incrémenter le compteur de followers de la bergerie
    const bergerieRef = doc(firestore, 'bergeries', bergerieId);
    batch.update(bergerieRef, {
      'stats.followersCount': increment(1)
    });
    
    // 3. Incrémenter le compteur de following de l'utilisateur
    const userRef = doc(firestore, 'users', userId);
    batch.update(userRef, {
      'stats.followingCount': increment(1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Follow créé avec succès');
    return { id: followRef.id, ...followData };
  } catch (error) {
    console.error('Erreur lors du follow:', error);
    throw error;
  }
};

/**
 * Ne plus suivre une bergerie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<void>}
 */
export const unfollowBergerie = async (userId, bergerieId) => {
  try {
    console.log('Tentative d\'unfollow:', { userId, bergerieId });
    
    // Trouver le document de follow
    const followDoc = await getFollowDocument(userId, bergerieId);
    if (!followDoc) {
      throw new Error('Vous ne suivez pas cette bergerie');
    }
    
    // Utiliser une transaction pour assurer la cohérence
    const batch = writeBatch(firestore);
    
    // 1. Supprimer le document de follow
    const followRef = doc(firestore, 'follows', followDoc.id);
    batch.delete(followRef);
    
    // 2. Décrémenter le compteur de followers de la bergerie
    const bergerieRef = doc(firestore, 'bergeries', bergerieId);
    batch.update(bergerieRef, {
      'stats.followersCount': increment(-1)
    });
    
    // 3. Décrémenter le compteur de following de l'utilisateur
    const userRef = doc(firestore, 'users', userId);
    batch.update(userRef, {
      'stats.followingCount': increment(-1)
    });
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log('Unfollow réussi');
  } catch (error) {
    console.error('Erreur lors de l\'unfollow:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur suit une bergerie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<boolean>} - true si l'utilisateur suit la bergerie
 */
export const checkIfFollowing = async (userId, bergerieId) => {
  try {
    const followDoc = await getFollowDocument(userId, bergerieId);
    return !!followDoc;
  } catch (error) {
    console.error('Erreur lors de la vérification du follow:', error);
    return false;
  }
};

/**
 * Récupérer le document de follow entre un utilisateur et une bergerie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<object|null>} - Document de follow ou null
 */
const getFollowDocument = async (userId, bergerieId) => {
  try {
    const q = query(
      collection(firestore, 'follows'),
      where('userId', '==', userId),
      where('bergerieId', '==', bergerieId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du document de follow:', error);
    return null;
  }
};

/**
 * Récupérer la liste des bergeries suivies par un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limitCount - Nombre max de résultats
 * @returns {Promise<Array>} - Liste des bergeries suivies
 */
export const getUserFollowedBergeries = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(firestore, 'follows'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const followedBergeries = [];
    
    // Récupérer les détails de chaque bergerie suivie
    for (const followDoc of querySnapshot.docs) {
      const followData = followDoc.data();
      try {
        const bergerieRef = doc(firestore, 'bergeries', followData.bergerieId);
        const bergerieSnap = await getDoc(bergerieRef);
        
        if (bergerieSnap.exists()) {
          followedBergeries.push({
            followId: followDoc.id,
            followedAt: followData.createdAt,
            bergerie: { id: bergerieSnap.id, ...bergerieSnap.data() }
          });
        }
      } catch (bergerieError) {
        console.error('Erreur lors de la récupération de la bergerie:', bergerieError);
      }
    }
    
    return followedBergeries;
  } catch (error) {
    console.error('Erreur lors de la récupération des bergeries suivies:', error);
    throw error;
  }
};

/**
 * Récupérer la liste des followers d'une bergerie
 * @param {string} bergerieId - ID de la bergerie
 * @param {number} limitCount - Nombre max de résultats
 * @returns {Promise<Array>} - Liste des followers
 */
export const getBergerieFollowers = async (bergerieId, limitCount = 50) => {
  try {
    const q = query(
      collection(firestore, 'follows'),
      where('bergerieId', '==', bergerieId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const followers = [];
    
    // Récupérer les détails de chaque follower
    for (const followDoc of querySnapshot.docs) {
      const followData = followDoc.data();
      try {
        const userRef = doc(firestore, 'users', followData.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          followers.push({
            followId: followDoc.id,
            followedAt: followData.createdAt,
            user: { id: userSnap.id, ...userSnap.data() }
          });
        }
      } catch (userError) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
      }
    }
    
    return followers;
  } catch (error) {
    console.error('Erreur lors de la récupération des followers:', error);
    throw error;
  }
};

/**
 * Basculer le statut de follow (follow/unfollow)
 * @param {string} userId - ID de l'utilisateur
 * @param {string} bergerieId - ID de la bergerie
 * @returns {Promise<boolean>} - Nouveau statut (true = suivant, false = ne suit plus)
 */
export const toggleFollowBergerie = async (userId, bergerieId) => {
  try {
    const isFollowing = await checkIfFollowing(userId, bergerieId);
    
    if (isFollowing) {
      await unfollowBergerie(userId, bergerieId);
      return false;
    } else {
      await followBergerie(userId, bergerieId);
      return true;
    }
  } catch (error) {
    console.error('Erreur lors du toggle follow:', error);
    throw error;
  }
};