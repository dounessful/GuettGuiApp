// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../config/firebaseConfig';
// AsyncStorage retiré pour compatibilité Expo Go
import { ActivityIndicator, View, Text } from 'react-native';

// Création du contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};

// Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // Nouveau state

  // Fonction d'inscription avec stats initialisées
  const signup = async (email, password, displayName) => {
    try {
      if (!auth) {
        throw new Error("Le service d'authentification n'est pas initialisé");
      }
      
      // Création de l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Mise à jour du profil avec le nom d'affichage
      await updateProfile(user, { displayName });
      
      // Création du document utilisateur dans Firestore avec stats complètes
      if (firestore) {
        await setDoc(doc(firestore, 'users', user.uid), {
          uid: user.uid,
          email,
          displayName,
          photoURL: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isVerified: false,
          role: 'user',
          stats: {
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            likesGivenCount: 0
          }
        });
      }
      
      console.log('Utilisateur créé avec succès:', user.uid);
      return user;
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      throw error;
    }
  };

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      if (!auth) {
        throw new Error("Le service d'authentification n'est pas initialisé");
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Authentification réussie:", result.user.uid);
      
      return result;
    } catch (error) {
      console.error("Erreur de login:", error.code, error.message);
      throw error;
    }
  };

  // Fonction de déconnexion améliorée
  const logout = async () => {
    try {
      if (!auth) {
        throw new Error("Le service d'authentification n'est pas initialisé");
      }
      
      console.log('Déconnexion en cours...');
      
      // Déconnexion Firebase
      await signOut(auth);
      
      // Réinitialiser les états locaux
      setCurrentUser(null);
      setUserProfile(null);
      
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  // Fonction de réinitialisation du mot de passe
  const resetPassword = async (email) => {
    if (!auth) {
      throw new Error("Le service d'authentification n'est pas initialisé");
    }
    return sendPasswordResetEmail(auth, email);
  };

  // Récupération du profil utilisateur depuis Firestore
  const fetchUserProfile = async (uid) => {
    try {
      if (!firestore) {
        throw new Error("Firestore n'est pas initialisé");
      }
      
      console.log('Récupération du profil pour:', uid);
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Assurer que les stats existent
        if (!userData.stats) {
          userData.stats = {
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            likesGivenCount: 0
          };
        }
        
        setUserProfile(userData);
        console.log('Profil utilisateur chargé');
        return userData;
      } else {
        console.warn('Document utilisateur non trouvé');
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil :", error);
      return null;
    }
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error("Aucun utilisateur connecté");
      if (!firestore) throw new Error("firestore n'est pas initialisé");
      
      console.log('Mise à jour du profil:', profileData);
      
      // Préparer les données à mettre à jour
      const updateData = {
        ...profileData,
        updatedAt: serverTimestamp()
      };
      
      // Assurer que les stats sont préservées
      if (userProfile?.stats) {
        updateData.stats = { ...userProfile.stats, ...profileData.stats };
      }
      
      await setDoc(doc(firestore, 'users', currentUser.uid), updateData, { merge: true });
      
      // Mise à jour du displayName et photoURL dans Auth si fournis
      const authUpdateData = {};
      if (profileData.displayName) authUpdateData.displayName = profileData.displayName;
      if (profileData.photoURL) authUpdateData.photoURL = profileData.photoURL;
      
      if (Object.keys(authUpdateData).length > 0 && auth) {
        await updateProfile(currentUser, authUpdateData);
      }
      
      // Rafraîchir les données du profil
      return fetchUserProfile(currentUser.uid);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      throw error;
    }
  };

  // Observer les changements d'état d'authentification
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Vérifier si auth est défini
        if (!auth) {
          console.warn("Le service d'authentification n'est pas initialisé");
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }
        
        console.log('Initialisation du listener d\'authentification...');
        
        // Configurer le listener d'authentification
        const unsubscribe = onAuthStateChanged(
          auth, 
          async (user) => {
            if (!mounted) return;
            
            try {
              console.log('État d\'authentification changé:', !!user);
              
              setCurrentUser(user);
              
              if (user) {
                // Utilisateur connecté, récupérer son profil
                console.log('Utilisateur connecté, chargement du profil...');
                await fetchUserProfile(user.uid);
              } else {
                // Utilisateur déconnecté
                console.log('Utilisateur déconnecté');
                setUserProfile(null);
              }
            } catch (error) {
              console.error("Erreur lors du traitement de l'authentification :", error);
              if (mounted) {
                setAuthError(error.message);
              }
            } finally {
              if (mounted) {
                setLoading(false);
                setIsInitialized(true);
              }
            }
          }, 
          (error) => {
            console.error("Erreur lors de l'observation de l'authentification :", error);
            if (mounted) {
              setAuthError(error.message);
              setLoading(false);
              setIsInitialized(true);
            }
          }
        );
        
        // Retourner la fonction de nettoyage
        return () => {
          mounted = false;
          if (unsubscribe) {
            unsubscribe();
          }
        };
      } catch (error) {
        console.error("Erreur critique dans le contexte d'authentification :", error);
        if (mounted) {
          setAuthError(error.message);
          setLoading(false);
          setIsInitialized(true);
        }
        return () => {
          mounted = false;
        };
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, []);

  // Valeur du contexte
  const value = {
    currentUser,
    userProfile,
    loading,
    isInitialized,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    fetchUserProfile,
    authError
  };

  // Affichage de chargement pendant l'initialisation
  if (loading && !isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F9F7F7'
      }}>
        <ActivityIndicator size="large" color="#3F72AF" />
        <Text style={{ 
          marginTop: 15, 
          color: '#666',
          fontSize: 16
        }}>
          Initialisation...
        </Text>
        <Text style={{ 
          marginTop: 5, 
          color: '#999',
          fontSize: 12
        }}>
          Vérification de l'authentification
        </Text>
      </View>
    );
  }

  // Affichage d'erreur critique
  if (authError && !currentUser) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#F9F7F7'
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#E74C3C', 
          marginBottom: 10,
          textAlign: 'center'
        }}>
          Erreur d'authentification
        </Text>
        <Text style={{ 
          textAlign: 'center', 
          color: '#555',
          marginBottom: 20,
          lineHeight: 20
        }}>
          {authError}
        </Text>
        <Text style={{ 
          textAlign: 'center', 
          color: '#999',
          fontSize: 12
        }}>
          Redémarrez l'application si le problème persiste
        </Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;