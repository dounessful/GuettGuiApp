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
   * Récupère le flux d'actualités (publications récentes)
   * @param {number} pageSize - Nombre d'éléments par page
   * @param {object} lastVisible - Dernier document visible pour pagination
   * @returns {Promise<{posts: Array, lastVisible: object}>}
   */
  export const getFeedPosts = async (pageSize = 10, lastVisible = null) => {
    try {
      const postsRef = collection(firestore, 'posts');
      let postsQuery;
      
      if (lastVisible) {
        postsQuery = query(
          postsRef,
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        postsQuery = query(
          postsRef,
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      return { posts, lastVisible: newLastVisible };
    } catch (error) {
      console.error("Erreur lors de la récupération des publications :", error);
      throw error;
    }
  };
  
  /**
   * Récupère les publications d'une bergerie spécifique
   * @param {string} bergerieId - ID de la bergerie
   * @param {number} pageSize - Nombre d'éléments par page
   * @param {object} lastVisible - Dernier document visible pour pagination
   * @returns {Promise<{posts: Array, lastVisible: object}>}
   */
  export const getBergeriePosts = async (bergerieId, pageSize = 10, lastVisible = null) => {
    try {
      const postsRef = collection(firestore, 'posts');
      let postsQuery;
      
      if (lastVisible) {
        postsQuery = query(
          postsRef,
          where('bergerieId', '==', bergerieId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        postsQuery = query(
          postsRef,
          where('bergerieId', '==', bergerieId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      return { posts, lastVisible: newLastVisible };
    } catch (error) {
      console.error("Erreur lors de la récupération des publications de la bergerie :", error);
      throw error;
    }
  };
  
  /**
   * Récupère une publication par son ID
   * @param {string} postId - ID de la publication
   * @returns {Promise<object>} - Données de la publication
   */
  export const getPostById = async (postId) => {
    try {
      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      
      if (postDoc.exists()) {
        return { id: postDoc.id, ...postDoc.data() };
      } else {
        throw new Error("Publication non trouvée");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la publication :", error);
      throw error;
    }
  };
  
  /**
   * Crée une nouvelle publication
   * @param {object} postData - Données de la publication
   * @param {Array<File>} mediaFiles - Fichiers médias (images/vidéos)
   * @returns {Promise<object>} - Publication créée
   */
  export const createPost = async (postData, mediaFiles = []) => {
    try {
      // Validation des données minimales requises
      if (!postData.bergerieId || !postData.userId) {
        throw new Error("Les IDs de bergerie et d'utilisateur sont obligatoires");
      }
      
      // Préparation des données avec valeurs par défaut
      const newPostData = {
        ...postData,
        createdAt: serverTimestamp(),
        stats: {
          likesCount: 0,
          commentsCount: 0
        },
        mediaUrls: [],
        isPublic: postData.isPublic !== undefined ? postData.isPublic : true
      };
      
      // Création du document dans Firestore
      const docRef = await addDoc(collection(firestore, 'posts'), newPostData);
      const postId = docRef.id;
      
      // Téléchargement des médias si présents
      if (mediaFiles && mediaFiles.length > 0) {
        const mediaPromises = mediaFiles.map(async (file, index) => {
          // Déterminer le type de média
          const isVideo = file.type.startsWith('video/');
          const mediaType = isVideo ? 'video' : 'image';
          
          // Référence de stockage
          const storageRef = ref(storage, `posts/${postId}/${index}_${file.name}`);
          
          // Téléchargement du fichier
          await uploadBytes(storageRef, file);
          const mediaUrl = await getDownloadURL(storageRef);
          
          return {
            url: mediaUrl,
            type: mediaType,
            thumbnailUrl: isVideo ? null : mediaUrl  // Pour les vidéos, vous devriez idéalement créer des miniatures
          };
        });
        
        // Attendre que tous les médias soient téléchargés
        const mediaUrls = await Promise.all(mediaPromises);
        
        // Mise à jour du document avec les URLs des médias
        await updateDoc(doc(firestore, 'posts', postId), {
          mediaUrls
        });
        
        newPostData.mediaUrls = mediaUrls;
      }
      
      // Incrémenter le compteur de publications dans la bergerie
      await updateDoc(doc(firestore, 'bergeries', postData.bergerieId), {
        'stats.postsCount': increment(1)
      });
      
      return { id: postId, ...newPostData };
    } catch (error) {
      console.error("Erreur lors de la création de la publication :", error);
      throw error;
    }
  };
  
  /**
   * Met à jour une publication existante
   * @param {string} postId - ID de la publication
   * @param {object} postData - Nouvelles données
   * @returns {Promise<object>} - Publication mise à jour
   */
  export const updatePost = async (postId, postData) => {
    try {
      const postRef = doc(firestore, 'posts', postId);
      
      // Vérifier que la publication existe
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error("Publication non trouvée");
      }
      
      // Mise à jour du document
      await updateDoc(postRef, {
        ...postData,
        updatedAt: serverTimestamp()
      });
      
      // Récupération de la publication mise à jour
      return getPostById(postId);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la publication :", error);
      throw error;
    }
  };
  
  /**
   * Supprime une publication
   * @param {string} postId - ID de la publication
   * @returns {Promise<void>}
   */
  export const deletePost = async (postId) => {
    try {
      // Récupérer les informations de la publication pour mettre à jour les compteurs
      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (!postDoc.exists()) {
        throw new Error("Publication non trouvée");
      }
      
      const postData = postDoc.data();
      
      // Supprimer la publication
      await deleteDoc(doc(firestore, 'posts', postId));
      
      // Décrémenter le compteur de publications dans la bergerie
      if (postData.bergerieId) {
        await updateDoc(doc(firestore, 'bergeries', postData.bergerieId), {
          'stats.postsCount': increment(-1)
        });
      }
      
      // Note: Pour une implémentation complète, il faudrait également
      // supprimer les likes et commentaires associés, ainsi que les fichiers dans Storage
    } catch (error) {
      console.error("Erreur lors de la suppression de la publication :", error);
      throw error;
    }
  };
  
  /**
   * Like/Unlike une publication
   * @param {string} postId - ID de la publication
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{liked: boolean}>} - État du like
   */
  export const toggleLikePost = async (postId, userId) => {
    try {
      // Vérifier si l'utilisateur a déjà aimé la publication
      const likesRef = collection(firestore, 'likes');
      const likeQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(likeQuery);
      const likeExists = !querySnapshot.empty;
      
      if (likeExists) {
        // Si le like existe déjà, le supprimer
        const likeId = querySnapshot.docs[0].id;
        await deleteDoc(doc(firestore, 'likes', likeId));
        
        // Décrémenter le compteur de likes
        await updateDoc(doc(firestore, 'posts', postId), {
          'stats.likesCount': increment(-1)
        });
        
        // Récupérer la bergerie associée et mettre à jour son compteur
        const postDoc = await getDoc(doc(firestore, 'posts', postId));
        if (postDoc.exists() && postDoc.data().bergerieId) {
          await updateDoc(doc(firestore, 'bergeries', postDoc.data().bergerieId), {
            'stats.likesCount': increment(-1)
          });
        }
        
        return { liked: false };
      } else {
        // Si le like n'existe pas, le créer
        await addDoc(likesRef, {
          postId,
          userId,
          createdAt: serverTimestamp()
        });
        
        // Incrémenter le compteur de likes
        await updateDoc(doc(firestore, 'posts', postId), {
          'stats.likesCount': increment(1)
        });
        
        // Récupérer la bergerie associée et mettre à jour son compteur
        const postDoc = await getDoc(doc(firestore, 'posts', postId));
        if (postDoc.exists() && postDoc.data().bergerieId) {
          await updateDoc(doc(firestore, 'bergeries', postDoc.data().bergerieId), {
            'stats.likesCount': increment(1)
          });
        }
        
        return { liked: true };
      }
    } catch (error) {
      console.error("Erreur lors du like/unlike de la publication :", error);
      throw error;
    }
  };
  
  /**
   * Vérifie si un utilisateur a aimé une publication
   * @param {string} postId - ID de la publication
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} - True si l'utilisateur a aimé la publication
   */
  export const checkIfUserLikedPost = async (postId, userId) => {
    try {
      const likesRef = collection(firestore, 'likes');
      const likeQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(likeQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Erreur lors de la vérification du like :", error);
      throw error;
    }
  };
  
  /**
   * Ajoute un commentaire à une publication
   * @param {string} postId - ID de la publication
   * @param {string} userId - ID de l'utilisateur
   * @param {string} text - Contenu du commentaire
   * @returns {Promise<object>} - Commentaire créé
   */
  export const addComment = async (postId, userId, text) => {
    try {
      // Création du commentaire
      const commentData = {
        postId,
        userId,
        text,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likesCount: 0
      };
      
      const docRef = await addDoc(collection(firestore, 'comments'), commentData);
      
      // Incrémenter le compteur de commentaires de la publication
      await updateDoc(doc(firestore, 'posts', postId), {
        'stats.commentsCount': increment(1)
      });
      
      // Récupérer la bergerie associée et mettre à jour son compteur
      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists() && postDoc.data().bergerieId) {
        await updateDoc(doc(firestore, 'bergeries', postDoc.data().bergerieId), {
          'stats.commentsCount': increment(1)
        });
      }
      
      return { id: docRef.id, ...commentData };
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire :", error);
      throw error;
    }
  };
  
  /**
   * Récupère les commentaires d'une publication
   * @param {string} postId - ID de la publication
   * @param {number} limit - Nombre maximum de commentaires à récupérer
   * @returns {Promise<Array>} - Liste des commentaires
   */
  export const getPostComments = async (postId, commentLimit = 50) => {
    try {
      const commentsRef = collection(firestore, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(commentLimit)
      );
      
      const querySnapshot = await getDocs(commentsQuery);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      
      return comments;
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires :", error);
      throw error;
    }
  };
  
  export default {
    getFeedPosts,
    getBergeriePosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    toggleLikePost,
    checkIfUserLikedPost,
    addComment,
    getPostComments
  };