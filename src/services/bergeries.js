// src/services/bergeries.js

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firestore, storage } from "../config/firebaseConfig";

/**
 * Fonction utilitaire pour uploader une image
 * @param {string} filePath - Chemin du fichier dans Storage
 * @param {string} fileUri - URI local du fichier
 * @returns {Promise<string>} URL de téléchargement
 */
const uploadImage = async (filePath, fileUri) => {
  try {
    console.log("Début upload image:", { filePath, fileUri });

    // DIAGNOSTIC COMPLET
    console.log("=== DIAGNOSTIC FIREBASE STORAGE ===");
    console.log("1. storage object:", storage);
    console.log("2. storage type:", typeof storage);
    console.log("3. storage app:", storage?.app);
    console.log("4. storage app name:", storage?.app?.name);
    console.log("5. Fonction ref disponible:", typeof ref);

    // Vérifier que l'URI existe
    if (!fileUri) {
      throw new Error("URI du fichier manquante");
    }

    // Vérifier que storage est bien initialisé
    if (!storage) {
      throw new Error(
        "Firebase Storage non initialisé - storage est undefined"
      );
    }

    if (typeof ref !== "function") {
      throw new Error(
        "La fonction ref de Firebase Storage n'est pas disponible"
      );
    }

    console.log("6. Récupération du fichier depuis URI...");

    // Récupérer le fichier depuis l'URI
    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    // Convertir en blob
    const blob = await response.blob();
    console.log("7. Blob créé:", blob.size, "bytes");

    // Créer la référence Storage avec diagnostic détaillé
    console.log("8. Tentative de création de la référence Storage...");
    console.log("   - storage object avant ref():", storage);
    console.log("   - filePath:", filePath);

    let storageRef;
    try {
      storageRef = ref(storage, filePath);
      console.log("9. StorageRef créée:", storageRef);
      console.log("   - storageRef type:", typeof storageRef);
      console.log("   - storageRef._location:", storageRef?._location);
      console.log("   - storageRef.bucket:", storageRef?.bucket);
      console.log("   - storageRef.fullPath:", storageRef?.fullPath);
    } catch (refError) {
      console.error("ERREUR lors de ref():", refError);
      console.error("Stack trace ref:", refError.stack);
      throw new Error(
        `Impossible de créer la référence Storage: ${refError.message}`
      );
    }

    // Vérifier que la référence est valide
    if (!storageRef) {
      throw new Error("StorageRef est null ou undefined après création");
    }

    // Uploader le fichier avec gestion d'erreur spécifique
    console.log("10. Début de l'upload...");
    let snapshot;
    try {
      snapshot = await uploadBytes(storageRef, blob);
      console.log("11. Upload terminé:", snapshot.metadata.name);
    } catch (uploadError) {
      console.error("ERREUR lors de uploadBytes():", uploadError);
      console.error("Stack trace upload:", uploadError.stack);
      throw new Error(`Échec de l'upload: ${uploadError.message}`);
    }

    // Obtenir l'URL de téléchargement
    console.log("12. Récupération de l'URL de téléchargement...");
    let downloadURL;
    try {
      downloadURL = await getDownloadURL(storageRef);
      console.log("13. URL obtenue:", downloadURL);
    } catch (urlError) {
      console.error("ERREUR lors de getDownloadURL():", urlError);
      console.error("Stack trace URL:", urlError.stack);
      throw new Error(`Impossible d'obtenir l'URL: ${urlError.message}`);
    }

    console.log("=== FIN DIAGNOSTIC - SUCCÈS ===");
    return downloadURL;
  } catch (error) {
    console.error("=== ERREUR GLOBALE UPLOAD ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("================================");
    throw new Error(`Impossible d'uploader l'image: ${error.message}`);
  }
};

/**
 * Crée une nouvelle bergerie
 * @param {object} bergerieData - Données de la bergerie
 * @param {object} coverPhotoFile - Fichier image de couverture (optionnel)
 * @returns {Promise<object>} - Bergerie créée
 */
export const createBergerie = async (bergerieData, coverPhotoFile = null) => {
  try {
    console.log("Création bergerie avec:", { bergerieData, coverPhotoFile });

    // Préparation des données avec valeurs par défaut
    const newBergerieData = {
      ...bergerieData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        likesCount: 0,
        commentsCount: 0,
        postsCount: 0,
      },
      verified: false,
    };

    // Créer d'abord le document dans Firestore
    const docRef = await addDoc(
      collection(firestore, "bergeries"),
      newBergerieData
    );
    const bergerieId = docRef.id;
    console.log("Bergerie créée avec ID:", bergerieId);

    // Traiter l'image de couverture si fournie
    if (coverPhotoFile && coverPhotoFile.uri) {
      try {
        const coverPhotoURL = await uploadImage(
          `bergeries/${bergerieId}/cover.jpg`,
          coverPhotoFile.uri
        );

        // Mettre à jour le document avec l'URL de l'image
        await updateDoc(doc(firestore, "bergeries", bergerieId), {
          coverPhoto: coverPhotoURL,
        });

        newBergerieData.coverPhoto = coverPhotoURL;
        console.log("Image de couverture ajoutée:", coverPhotoURL);
      } catch (imageError) {
        console.error(
          "Erreur lors de l'upload de l'image de couverture:",
          imageError
        );
        // On continue sans l'image plutôt que de faire échouer la création
      }
    }

    return { id: bergerieId, ...newBergerieData };
  } catch (error) {
    console.error("Erreur lors de la création de la bergerie:", error);
    throw error;
  }
};

/**
 * Met à jour une bergerie existante
 * @param {string} bergerieId - ID de la bergerie
 * @param {object} bergerieData - Nouvelles données
 * @param {object} coverPhotoFile - Nouveau fichier image (optionnel)
 * @returns {Promise<object>} - Bergerie mise à jour
 */
export const updateBergerie = async (
  bergerieId,
  bergerieData,
  coverPhotoFile = null
) => {
  try {
    console.log("Mise à jour bergerie:", {
      bergerieId,
      bergerieData,
      coverPhotoFile,
    });

    // Préparer les données de mise à jour
    const updateData = {
      ...bergerieData,
      updatedAt: serverTimestamp(),
    };

    // Traiter la nouvelle image de couverture si fournie
    if (coverPhotoFile && coverPhotoFile.uri) {
      try {
        const coverPhotoURL = await uploadImage(
          `bergeries/${bergerieId}/cover_${Date.now()}.jpg`,
          coverPhotoFile.uri
        );

        updateData.coverPhoto = coverPhotoURL;
        console.log("Nouvelle image de couverture uploadée:", coverPhotoURL);
      } catch (imageError) {
        console.error(
          "Erreur lors de l'upload de la nouvelle image:",
          imageError
        );
        // On continue la mise à jour sans changer l'image
      }
    }

    // Mettre à jour le document
    const docRef = doc(firestore, "bergeries", bergerieId);
    await updateDoc(docRef, updateData);

    // Récupérer les données mises à jour
    const updatedDoc = await getDoc(docRef);
    const updatedData = { id: bergerieId, ...updatedDoc.data() };

    console.log("Bergerie mise à jour:", updatedData);
    return updatedData;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la bergerie:", error);
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
    const docRef = doc(firestore, "bergeries", bergerieId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Bergerie non trouvée");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la bergerie:", error);
    throw error;
  }
};

/**
 * Recherche des bergeries selon des filtres
 * @param {string} searchTerm - Terme de recherche
 * @param {object} filters - Filtres (type, région, etc.)
 * @param {number} limitCount - Nombre max de résultats
 * @returns {Promise<Array>} - Liste des bergeries
 */
export const searchBergeries = async (
  searchTerm = "",
  filters = {},
  limitCount = 20
) => {
  try {
    let q = collection(firestore, "bergeries");

    // Construire la requête avec les filtres
    const constraints = [];

    if (filters.type) {
      constraints.push(where("type", "==", filters.type));
    }

    if (filters.region) {
      constraints.push(where("location.region", "==", filters.region));
    }

    // Ajouter l'ordre et la limite
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(limitCount));

    // Créer la requête
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const querySnapshot = await getDocs(q);
    const bergeries = [];

    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };

      // Filtrer par terme de recherche côté client si nécessaire
      if (
        !searchTerm ||
        data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        bergeries.push(data);
      }
    });

    return bergeries;
  } catch (error) {
    console.error("Erreur lors de la recherche de bergeries:", error);
    throw error;
  }
};

/**
 * Supprime une bergerie
 * @param {string} bergerieId - ID de la bergerie à supprimer
 * @returns {Promise<void>}
 */
export const deleteBergerie = async (bergerieId) => {
  try {
    // Supprimer le document
    await deleteDoc(doc(firestore, "bergeries", bergerieId));

    // Optionnel : supprimer aussi les images associées
    try {
      const coverRef = ref(storage, `bergeries/${bergerieId}/cover.jpg`);
      await deleteObject(coverRef);
    } catch (deleteImageError) {
      console.log(
        "Aucune image à supprimer ou erreur lors de la suppression:",
        deleteImageError
      );
    }

    console.log("Bergerie supprimée:", bergerieId);
  } catch (error) {
    console.error("Erreur lors de la suppression de la bergerie:", error);
    throw error;
  }
};
