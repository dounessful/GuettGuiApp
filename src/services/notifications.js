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
    serverTimestamp 
  } from 'firebase/firestore';
  import { firestore } from '../config/firebaseConfig';
  
  /**
   * Types de notifications
   */
  export const NOTIFICATION_TYPES = {
    LIKE: 'like',
    COMMENT: 'comment',
    FOLLOW: 'follow',
    NEW_POST: 'new_post',
    SYSTEM: 'system'
  };
  
  /**
   * Crée une nouvelle notification
   * @param {string} recipientId - ID du destinataire
   * @param {string} senderId - ID de l'expéditeur
   * @param {string} type - Type de notification (NOTIFICATION_TYPES)
   * @param {string} refId - ID de référence (post, commentaire, etc.)
   * @param {string} message - Message de la notification
   * @returns {Promise<object>} - Notification créée
   */
  export const createNotification = async (recipientId, senderId, type, refId, message) => {
    try {
      // Éviter les auto-notifications
      if (recipientId === senderId) {
        return null;
      }
      
      const notificationData = {
        recipientId,
        senderId,
        type,
        refId,
        message,
        read: false,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(firestore, 'notifications'), notificationData);
      return { id: docRef.id, ...notificationData };
    } catch (error) {
      console.error("Erreur lors de la création de la notification :", error);
      throw error;
    }
  };
  
  /**
   * Récupère les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} limit - Nombre maximum de notifications
   * @returns {Promise<Array>} - Liste des notifications
   */
  export const getUserNotifications = async (userId, notificationsLimit = 50) => {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(notificationsLimit)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return notifications;
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications :", error);
      throw error;
    }
  };
  
  /**
   * Marque une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @returns {Promise<void>}
   */
  export const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Erreur lors du marquage de la notification :", error);
      throw error;
    }
  };
  
  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  export const markAllNotificationsAsRead = async (userId) => {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      
      const batch = [];
      querySnapshot.forEach((doc) => {
        batch.push(updateDoc(doc.ref, { read: true }));
      });
      
      await Promise.all(batch);
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications :", error);
      throw error;
    }
  };
  
  /**
   * Supprime une notification
   * @param {string} notificationId - ID de la notification
   * @returns {Promise<void>}
   */
  export const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification :", error);
      throw error;
    }
  };
  
  /**
   * Compte le nombre de notifications non lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de notifications non lues
   */
  export const countUnreadNotifications = async (userId) => {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      return querySnapshot.size;
    } catch (error) {
      console.error("Erreur lors du comptage des notifications non lues :", error);
      throw error;
    }
  };
  
  /**
   * Crée automatiquement les notifications appropriées lors d'une action
   * @param {string} action - Type d'action (like, comment, follow)
   * @param {object} data - Données associées à l'action
   * @returns {Promise<void>}
   */
  export const handleNotificationForAction = async (action, data) => {
    try {
      switch (action) {
        case 'like': {
          // data = { postId, userId (liker) }
          const postDoc = await getDoc(doc(firestore, 'posts', data.postId));
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const postAuthorId = postData.userId;
            
            await createNotification(
              postAuthorId,
              data.userId,
              NOTIFICATION_TYPES.LIKE,
              data.postId,
              "a aimé votre publication"
            );
          }
          break;
        }
        
        case 'comment': {
          // data = { postId, userId (commenter), commentId }
          const postDoc = await getDoc(doc(firestore, 'posts', data.postId));
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const postAuthorId = postData.userId;
            
            await createNotification(
              postAuthorId,
              data.userId,
              NOTIFICATION_TYPES.COMMENT,
              data.commentId,
              "a commenté votre publication"
            );
          }
          break;
        }
        
        case 'follow': {
          // data = { followerId, followedId }
          await createNotification(
            data.followedId,
            data.followerId,
            NOTIFICATION_TYPES.FOLLOW,
            data.followerId,
            "a commencé à vous suivre"
          );
          break;
        }
        
        case 'new_post': {
          // data = { bergerieId, postId, userId (poster) }
          // Récupérer tous les followers de la bergerie
          // Cette logique devrait être implémentée avec un Cloud Function
          // pour une application réelle
          break;
        }
        
        default:
          break;
      }
    } catch (error) {
      console.error("Erreur lors de la gestion des notifications :", error);
      // Ne pas propager l'erreur pour éviter d'interrompre le flux principal
    }
  };
  
  export default {
    NOTIFICATION_TYPES,
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    countUnreadNotifications,
    handleNotificationForAction
  };