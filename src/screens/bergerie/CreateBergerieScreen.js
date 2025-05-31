// src/screens/bergerie/CreateBergerieScreen.js

import React, { useState } from "react";
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
import { createBergerie } from "../../services/bergeriesOLD";
import { Picker } from "@react-native-picker/picker";

// Types de bergeries disponibles
const BERGERIE_TYPES = [
  { label: "Sélectionnez un type", value: "" },
  { label: "Ovins", value: "ovin" },
  { label: "Caprins", value: "caprin" },
  { label: "Bovins", value: "bovin" },
  { label: "Mixte", value: "mixte" },
];

// Régions françaises
/* const REGIONS = [
  { label: 'Sélectionnez une région', value: '' },
  { label: 'Auvergne-Rhône-Alpes', value: 'Auvergne-Rhône-Alpes' },
  { label: 'Bourgogne-Franche-Comté', value: 'Bourgogne-Franche-Comté' },
  { label: 'Bretagne', value: 'Bretagne' },
  { label: 'Centre-Val de Loire', value: 'Centre-Val de Loire' },
  { label: 'Corse', value: 'Corse' },
  { label: 'Grand Est', value: 'Grand Est' },
  { label: 'Hauts-de-France', value: 'Hauts-de-France' },
  { label: 'Île-de-France', value: 'Île-de-France' },
  { label: 'Normandie', value: 'Normandie' },
  { label: 'Nouvelle-Aquitaine', value: 'Nouvelle-Aquitaine' },
  { label: 'Occitanie', value: 'Occitanie' },
  { label: 'Pays de la Loire', value: 'Pays de la Loire' },
  { label: 'Provence-Alpes-Côte d\'Azur', value: 'Provence-Alpes-Côte d\'Azur' },
]; */
const REGIONS = [
  { label: "Sélectionnez une région", value: "" },
  { label: "Dakar", value: "Dakar" },
  { label: "Diourbel", value: "Diourbel" },
  { label: "Fatick", value: "Fatick" },
  { label: "Kaffrine", value: "Kaffrine" },
  { label: "Kaolack", value: "Kaolack" },
  { label: "Kédougou", value: "Kédougou" },
  { label: "Kolda", value: "Kolda" },
  { label: "Louga", value: "Louga" },
  { label: "Matam", value: "Matam" },
  { label: "Saint-Louis", value: "Saint-Louis" },
  { label: "Sédhiou", value: "Sédhiou" },
  { label: "Tambacounda", value: "Tambacounda" },
  { label: "Thiès", value: "Thiès" },
  { label: "Ziguinchor", value: "Ziguinchor" },
];

const CreateBergerieScreen = ({ navigation }) => {
  const { currentUser } = useAuth();

  // États pour les champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState("");
  const [coverPhotoUri, setCoverPhotoUri] = useState(null);
  const [creating, setCreating] = useState(false);

  // Sélectionner une image de couverture
  const pickCoverPhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de votre permission pour accéder à la galerie."
        );
        return;
      }

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
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  // Créer la bergerie
  const handleCreate = async () => {
    // Validation des champs obligatoires
    if (!name.trim()) {
      Alert.alert(
        "Champ obligatoire",
        "Veuillez saisir un nom pour votre bergerie."
      );
      return;
    }

    if (!type) {
      Alert.alert(
        "Champ obligatoire",
        "Veuillez sélectionner un type de bergerie."
      );
      return;
    }

    if (!region) {
      Alert.alert("Champ obligatoire", "Veuillez sélectionner une région.");
      return;
    }

    if (!coverPhotoUri) {
      Alert.alert(
        "Image de couverture",
        "Veuillez sélectionner une image de couverture pour votre bergerie."
      );
      return;
    }

    try {
      setCreating(true);

      let coverPhotoFile = null;

      // Préparer le fichier de couverture si une image a été sélectionnée
      if (coverPhotoUri) {
        coverPhotoFile = {
          uri: coverPhotoUri,
          type: "image/jpeg",
          name: `bergerie_cover_${Date.now()}.jpg`,
        };
      }

      // Préparer les données de la bergerie
      const bergerieData = {
        name: name.trim(),
        description: description.trim(),
        ownerId: currentUser.uid,
        type,
        location: {
          region,
          address: address.trim(),
          country: "Sénégal",
        },
        phoneNumber: phoneNumber.trim(),
        website: website.trim(),
        tags: tags
          .trim()
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
      };

      // Créer la bergerie dans Firestore
      const result = await createBergerie(bergerieData, coverPhotoFile);

      // Rediriger vers la page de détail de la bergerie
      navigation.navigate("BergerieDetail", {
        bergerieId: result.id,
        name: result.name,
      });

      // Afficher un message de succès
      Alert.alert("Succès", "Votre bergerie a été créée avec succès!");
    } catch (error) {
      console.error("Erreur lors de la création de la bergerie:", error);
      Alert.alert(
        "Erreur",
        "Impossible de créer la bergerie. Veuillez réessayer."
      );
    } finally {
      setCreating(false);
    }
  };

  // Annuler la création
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Créer une nouvelle bergerie</Text>
        </View>

        {/* Image de couverture */}
        <TouchableOpacity
          style={styles.coverPhotoContainer}
          onPress={pickCoverPhoto}
        >
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPhotoPlaceholder}>
              <Ionicons name="image-outline" size={50} color="#FFFFFF" />
              <Text style={styles.coverPhotoText}>
                Ajouter une image de couverture
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          {/* Nom de la bergerie */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la bergerie *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Entrez le nom de votre bergerie"
              maxLength={50}
            />
          </View>

          {/* Type de bergerie */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de bergerie *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue)}
                style={styles.picker}
              >
                {BERGERIE_TYPES.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Région */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Région *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={region}
                onValueChange={(itemValue) => setRegion(itemValue)}
                style={styles.picker}
              >
                {REGIONS.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse complète de la bergerie"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre bergerie, son histoire, vos produits..."
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
            />
          </View>

          {/* Site web */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site web</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="URL de votre site web"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (séparés par des virgules)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="bio, fromage, montagne, tradition..."
            />
          </View>

          {/* Note explicative */}
          <Text style={styles.note}>* Champs obligatoires</Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={creating}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Créer</Text>
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
  coverPhotoContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    marginBottom: 15,
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  coverPhotoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#BBBBBB",
    justifyContent: "center",
    alignItems: "center",
  },
  coverPhotoText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  formContainer: {
    paddingHorizontal: 15,
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  note: {
    fontSize: 12,
    color: "#888",
    marginBottom: 20,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 10,
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
  createButton: {
    backgroundColor: "#3F72AF",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CreateBergerieScreen;
