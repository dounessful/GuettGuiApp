import { 
    collection, 
    doc, 
    getDoc,
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    startAfter,
    serverTimestamp,
    increment
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { firestore, storage } from '../config/firebaseConfig';
  
  /**
   * Récupère toutes les bergeries avec pagination
   * @param {number} pageSize - Nombre d'éléments par page
   * @param {object} lastVisible - Dernier document visible pour pagination
   * @param {string} sortBy - Champ de tri (default: 'stats.likesCount')
   * @param {string} sortOrder - Ordre de tri ('asc' ou 'desc')
   * @returns {Promise<{bergeries: Array, lastVisible: object}>}
   */
  export const getAllBergeries = async (
    pageSize = 10, 
    lastVisible = null,
    sortBy = 'stats.likesCount',
    sortOrder = 'desc'
  ) => {
    try {
      const bergeriesRef = collection(firestore, 'bergeries');
      let bergeriesQuery;
      
      if (lastVisible) {
        bergeriesQuery = query(
          bergeriesRef,
          orderBy(sortBy, sortOrder),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        bergeriesQuery = query(
          bergeriesRef,
          orderBy(sortBy, sortOrder),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(bergeriesQuery);
      const bergeries = [];
      
      querySnapshot.forEach((doc) => {
        bergeries.push({ id: doc.id, ...doc.data() });
      });
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      return { bergeries, lastVisible: newLastVisible };
    } catch (error) {
      console.error("Erreur lors de la récupération des bergeries :", error);
      throw error;
    }
  };
  
  /**
   * Récupère une bergerie par son ID
   * @param {string} bergerieId - ID de la bergerie
   * @returns {Promise<object>} - Données de la bergerie
   */
  export const getBergerieById = async (bergerieId) => {
    try {
      const bergerieDoc = await getDoc(doc(firestore, 'bergeries', bergerieId));
      
      if (bergerieDoc.exists()) {
        return { id: bergerieDoc.id, ...bergerieDoc.data() };
      } else {
        throw new Error("Bergerie non trouvée");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la bergerie :", error);
      throw error;
    }
  };
  
  /**
   * Récupère toutes les bergeries d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des bergeries
   */
  export const getUserBergeries = async (userId) => {
    try {
      const bergeriesQuery = query(
        collection(firestore, 'bergeries'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(bergeriesQuery);
      const bergeries = [];
      
      querySnapshot.forEach((doc) => {
        bergeries.push({ id: doc.id, ...doc.data() });
      });
      
      return bergeries;
    } catch (error) {
      console.error("Erreur lors de la récupération des bergeries de l'utilisateur :", error);
      throw error;
    }
  };
  
  /**
   * Crée une nouvelle bergerie
   * @param {object} bergerieData - Données de la bergerie
   * @param {File} coverPhotoFile - Fichier image de couverture
   * @returns {Promise<object>} - Bergerie créée
   */
  export const createBergerie = async (bergerieData, coverPhotoFile) => {
    try {
      // Préparation des données avec valeurs par défaut
      const newBergerieData = {
        ...bergerieData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          likesCount: 0,
          commentsCount: 0,
          postsCount: 0
        },
        verified: false
      };
      
      // Ajout de la bergerie dans Firestore
      const docRef = await addDoc(collection(firestore, 'bergeries'), newBergerieData);
      const bergerieId = docRef.id;
      
      // Si une image de couverture est fournie, la télécharger
        if (coverPhotoFile && coverPhotoFile.uri) {
          try {
            // 1. Convertir l'URI en blob
            const response = await fetch(coverPhotoFile.uri);
            if (!response.ok) throw new Error('Erreur lors de la récupération du fichier');
            
            const blob = await response.blob();
            
            // 2. Créer une référence dans Storage
            const storageRef = ref(storage, `bergeries/${bergerieId}/cover`);
            
            // 3. Uploader le blob
            await uploadBytes(storageRef, blob);
            
            // 4. Obtenir l'URL de téléchargement
            coverPhotoURL = await getDownloadURL(storageRef);
            
            // 5. Mettre à jour la bergerie avec l'URL de l'image
            if (coverPhotoURL) {
              await updateDoc(doc(firestore, 'bergeries', bergerieId), {
                coverPhoto: coverPhotoURL
              });
              
              newBergerieData.coverPhoto = coverPhotoURL;
            }
          } catch (uploadError) {
            console.error("Erreur lors de l'upload de l'image:", uploadError);
            // Ne pas faire échouer la création de bergerie si l'upload d'image échoue
          }
        }
      return { id: bergerieId, ...newBergerieData };
    } catch (error) {
      console.error("Erreur lors de la création de la bergerie :", error);
      throw error;
    }
  };
  
  /**
   * Met à jour une bergerie existante
   * @param {string} bergerieId - ID de la bergerie
   * @param {object} bergerieData - Nouvelles données
   * @param {File} coverPhotoFile - Nouvelle image de couverture (optionnel)
   * @returns {Promise<object>} - Bergerie mise à jour
   */
  export const updateBergerie = async (bergerieId, bergerieData, coverPhotoFile) => {
    try {
      const bergerieRef = doc(firestore, 'bergeries', bergerieId);
      
      // Préparation des données de mise à jour
      const updateData = {
        ...bergerieData,
        updatedAt: serverTimestamp()
      };
      
      // Si une nouvelle image est fournie, la télécharger
      if (coverPhotoFile) {
        const storageRef = ref(storage, `bergeries/${bergerieId}/cover`);
        await uploadBytes(storageRef, coverPhotoFile);
        const coverPhotoURL = await getDownloadURL(storageRef);
        updateData.coverPhoto = coverPhotoURL;
      }
      
      // Mise à jour du document
      await updateDoc(bergerieRef, updateData);
      
      // Récupération de la bergerie mise à jour
      return getBergerieById(bergerieId);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la bergerie :", error);
      throw error;
    }
  };
  
  /**
   * Supprime une bergerie
   * @param {string} bergerieId - ID de la bergerie
   * @returns {Promise<void>}
   */
  export const deleteBergerie = async (bergerieId) => {
    try {
      await deleteDoc(doc(firestore, 'bergeries', bergerieId));
      // Note: Pour une implémentation complète, il faudrait également
      // supprimer les publications associées et les images dans Storage
    } catch (error) {
      console.error("Erreur lors de la suppression de la bergerie :", error);
      throw error;
    }
  };
  
  /**
   * Recherche des bergeries par mots-clés, région ou type
   * @param {string} searchTerm - Terme de recherche
   * @param {object} filters - Filtres supplémentaires (région, type, etc.)
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} - Résultats de la recherche
   */
  export const searchBergeries = async (searchTerm, filters = {}, resultLimit = 20) => {
    try {
      const bergeriesRef = collection(firestore, 'bergeries');
      let searchQuery = query(bergeriesRef);
      
      // Ajout des filtres
      if (filters.region) {
        searchQuery = query(searchQuery, where('location.region', '==', filters.region));
      }
      
      if (filters.type) {
        searchQuery = query(searchQuery, where('type', '==', filters.type));
      }
      
      if (filters.tags && filters.tags.length > 0) {
        searchQuery = query(searchQuery, where('tags', 'array-contains-any', filters.tags));
      }
      
      // Limitation du nombre de résultats
      searchQuery = query(searchQuery, limit(resultLimit));
      
      const querySnapshot = await getDocs(searchQuery);
      const bergeries = [];
      
      // Filtrage côté client pour la recherche par nom
      // Note: Firestore ne permet pas de recherche texte native, pour une solution
      // plus complète, il faudrait utiliser Firebase Functions avec Algolia ou une autre solution
      querySnapshot.forEach((doc) => {
        const bergerieData = doc.data();
        if (!searchTerm || 
            bergerieData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bergerieData.description && bergerieData.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
          bergeries.push({ id: doc.id, ...bergerieData });
        }
      });
      
      return bergeries;
    } catch (error) {
      console.error("Erreur lors de la recherche de bergeries :", error);
      throw error;
    }
  };
  
  export default {
    getAllBergeries,
    getBergerieById,
    getUserBergeries,
    createBergerie,
    updateBergerie,
    deleteBergerie,
    searchBergeries
  };