import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

/**
 * Télécharge un fichier dans Firebase Storage
 * @param {File} file - Fichier à télécharger
 * @param {string} path - Chemin de destination dans Storage
 * @returns {Promise<string>} - URL de téléchargement du fichier
 */
export const uploadFile = async (file, path) => {
  try {
    if (!file) {
      throw new Error("Aucun fichier fourni");
    }
    
    // Référence de stockage
    const storageRef = ref(storage, path);
    
    // Téléchargement du fichier
    const snapshot = await uploadBytes(storageRef, file);
    
    // Récupération de l'URL du fichier
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier :", error);
    throw error;
  }
};

/**
 * Télécharge un fichier image avec compression (à implémenter côté client)
 * @param {File} imageFile - Fichier image à télécharger
 * @param {string} path - Chemin de destination dans Storage
 * @param {object} options - Options de compression
 * @returns {Promise<string>} - URL de téléchargement de l'image
 */
export const uploadImage = async (imageFile, path, options = { maxWidth: 1200, quality: 0.8 }) => {
  try {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      throw new Error("Le fichier fourni n'est pas une image valide");
    }
    
    // Note: La compression d'image devrait être implémentée ici
    // Pour une implémentation complète, utilisez une bibliothèque comme
    // browser-image-compression ou canvas pour redimensionner et compresser l'image
    
    // Pour le moment, nous téléchargeons simplement l'image originale
    return uploadFile(imageFile, path);
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image :", error);
    throw error;
  }
};

/**
 * Télécharge plusieurs fichiers dans Firebase Storage
 * @param {Array<File>} files - Fichiers à télécharger
 * @param {string} basePath - Chemin de base pour le stockage
 * @returns {Promise<Array<string>>} - URLs des fichiers téléchargés
 */
export const uploadMultipleFiles = async (files, basePath) => {
  try {
    if (!files || files.length === 0) {
      return [];
    }
    
    const uploadPromises = files.map((file, index) => {
      const path = `${basePath}/${index}_${file.name}`;
      
      if (file.type.startsWith('image/')) {
        return uploadImage(file, path);
      } else {
        return uploadFile(file, path);
      }
    });
    
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error("Erreur lors du téléchargement multiple :", error);
    throw error;
  }
};

/**
 * Supprime un fichier de Firebase Storage
 * @param {string} fileURL - URL du fichier à supprimer
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileURL) => {
  try {
    // Extraction du chemin du fichier depuis l'URL
    // Note: Cette méthode peut varier selon la structure d'URL de Firebase Storage
    const fileRef = ref(storage, fileURL);
    
    // Suppression du fichier
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier :", error);
    throw error;
  }
};

export default {
  uploadFile,
  uploadImage,
  uploadMultipleFiles,
  deleteFile
};