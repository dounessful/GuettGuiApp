// src/screens/profile/EditProfileScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebaseConfig";

const EditProfileScreen = ({ navigation }) => {
  const { userProfile, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger les données utilisateur existantes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setBio(userProfile.bio || "");
      setLocation(userProfile.location || "");
      setProfileImage(userProfile.photoURL || null);
    }

    // Demander les permissions pour la galerie
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Nous avons besoin de votre permission pour accéder à la galerie."
        );
      }
    })();
  }, [userProfile]);

  // Sélectionner une image depuis la galerie
  const pickImage = async () => {
    try {
      let mediaTypes;
      if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
        mediaTypes = ImagePicker.MediaType.Images;
      } else if (
        ImagePicker.MediaTypeOptions &&
        ImagePicker.MediaTypeOptions.Images
      ) {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else {
        mediaTypes = "Images";
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  // Enregistrer les modifications
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Erreur", "Le nom d'utilisateur est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      // Préparer les données à mettre à jour
      const profileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      };

      // Si une nouvelle image a été sélectionnée, la télécharger
      if (newProfileImage) {
        // Convertir l'URI en blob
        const response = await fetch(newProfileImage);
        const blob = await response.blob();

        // Référence de stockage
        const storageRef = ref(storage, `users/${userProfile.uid}/profile`);

        // Télécharger l'image
        await uploadBytes(storageRef, blob);

        // Obtenir l'URL de téléchargement
        const photoURL = await getDownloadURL(storageRef);

        // Ajouter l'URL à profileData
        profileData.photoURL = photoURL;
      }

      // Mettre à jour le profil
      await updateUserProfile(profileData);

      // Revenir à l'écran précédent
      navigation.goBack();

      // Afficher un message de succès
      Alert.alert("Succès", "Votre profil a été mis à jour avec succès!");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour votre profil. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Modifier votre profil</Text>
        </View>

        {/* Photo de profil */}
        <View style={styles.profileImageContainer}>
          {newProfileImage ? (
            <Image
              source={{ uri: newProfileImage }}
              style={styles.profileImage}
            />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          )}

          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Entrez votre nom d'utilisateur"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biographie</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Parlez-nous un peu de vous..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Localisation</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Votre ville ou région"
            />
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F7",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#BBBBBB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3F72AF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#3F72AF",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default EditProfileScreen;
