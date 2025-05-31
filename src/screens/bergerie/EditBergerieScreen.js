// src/screens/bergerie/EditBergerieScreen.js

import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getBergerieById, updateBergerie } from '../../services/bergeries';
import { Picker } from '@react-native-picker/picker';

// Types de bergeries disponibles
const BERGERIE_TYPES = [
  { label: 'Sélectionnez un type', value: '' },
  { label: 'Ovins', value: 'ovin' },
  { label: 'Caprins', value: 'caprin' },
  { label: 'Bovins', value: 'bovin' },
  { label: 'Mixte', value: 'mixte' },
];

// Régions françaises
const REGIONS = [
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
];

/**
 * Écran d'édition de bergerie
 * Permet de modifier les informations d'une bergerie existante
 */
const EditBergerieScreen = ({ route, navigation }) => {
  const { bergerieId } = route.params;
  const { currentUser } = useAuth();
  
  // États pour les champs du formulaire
  const [bergerie, setBergerie] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [coverPhotoUri, setCoverPhotoUri] = useState(null);
  const [originalCoverPhoto, setOriginalCoverPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  /**
   * Chargement des données de la bergerie
   */
  useEffect(() => {
    const fetchBergerieData = async () => {
      try {
        setLoading(true);
        console.log('Récupération des données de la bergerie:', bergerieId);
        
        const bergerieData = await getBergerieById(bergerieId);
        console.log('Données de la bergerie récupérées:', bergerieData);
        
        // Vérifier que l'utilisateur est le propriétaire
        if (bergerieData.ownerId !== currentUser.uid) {
          Alert.alert(
            'Accès refusé', 
            'Vous n\'êtes pas autorisé à modifier cette bergerie.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        // Remplir les états avec les données récupérées
        setBergerie(bergerieData);
        setName(bergerieData.name || '');
        setDescription(bergerieData.description || '');
        setType(bergerieData.type || '');
        setRegion(bergerieData.location?.region || '');
        setAddress(bergerieData.location?.address || '');
        setPhoneNumber(bergerieData.phoneNumber || '');
        setWebsite(bergerieData.website || '');
        setTagsString(bergerieData.tags?.join(', ') || '');
        setOriginalCoverPhoto(bergerieData.coverPhoto || null);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de la bergerie:', error);
        Alert.alert(
          'Erreur', 
          'Impossible de récupérer les données de la bergerie.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchBergerieData();
  }, [bergerieId, currentUser]);
  
  /**
   * Sélectionner une nouvelle image de couverture
   */
  const pickCoverPhoto = async () => {
    try {
      console.log('Demande de sélection d\'image...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie.');
        return;
      }
      
      // Gestion de la compatibilité des versions d'expo-image-picker
      let mediaTypes;
      if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
        mediaTypes = ImagePicker.MediaType.Images;
      } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else {
        mediaTypes = 'Images'; // Fallback pour les versions très anciennes
      }
      
      console.log('MediaTypes utilisé:', mediaTypes);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      console.log('Résultat de la sélection d\'image:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        console.log('Image sélectionnée:', selectedImageUri);
        setCoverPhotoUri(selectedImageUri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', `Impossible de sélectionner l'image: ${error.message}`);
    }
  };
  
  /**
   * Valider les données du formulaire
   * @returns {boolean} true si les données sont valides, false sinon
   */
  const validateForm = () => {
    console.log('Validation du formulaire...');
    
    // Validation des champs obligatoires
    if (!name.trim()) {
      Alert.alert('Champ obligatoire', 'Veuillez saisir un nom pour votre bergerie.');
      return false;
    }
    
    if (!type) {
      Alert.alert('Champ obligatoire', 'Veuillez sélectionner un type de bergerie.');
      return false;
    }
    
    if (!region) {
      Alert.alert('Champ obligatoire', 'Veuillez sélectionner une région.');
      return false;
    }
    
    console.log('Validation réussie');
    return true;
  };
  
  /**
   * Mettre à jour la bergerie
   */
  const handleUpdate = async () => {
    console.log('Début de la mise à jour de la bergerie...');
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      
      // Préparer le fichier de couverture si une nouvelle image a été sélectionnée
      let coverPhotoFile = null;
      if (coverPhotoUri) {
        coverPhotoFile = {
          uri: coverPhotoUri,
          type: 'image/jpeg',
          name: `bergerie_cover_update_${Date.now()}.jpg`,
        };
        console.log('Fichier de couverture préparé:', coverPhotoFile);
      }
      
      // Préparer les données de la bergerie
      const bergerieData = {
        name: name.trim(),
        description: description.trim(),
        type,
        location: {
          region,
          address: address.trim(),
          country: 'France',
        },
        phoneNumber: phoneNumber.trim(),
        website: website.trim(),
        tags: tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      };
      
      console.log('Données de la bergerie à mettre à jour:', bergerieData);
      
      // Mettre à jour la bergerie dans Firestore
      const result = await updateBergerie(bergerieId, bergerieData, coverPhotoFile);
      console.log('Bergerie mise à jour avec succès:', result);
      
      // Rediriger vers la page de détail de la bergerie
      navigation.navigate('BergerieDetail', { 
        bergerieId: result.id,
        name: result.name
      });
      
      // Afficher un message de succès
      Alert.alert('Succès', 'Les modifications ont été enregistrées avec succès!');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la bergerie:', error);
      console.error('Stack trace complet:', error.stack);
      Alert.alert('Erreur', `Impossible de mettre à jour la bergerie: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  /**
   * Annuler les modifications
   */
  const handleCancel = () => {
    console.log('Annulation des modifications');
    navigation.goBack();
  };
  
  // Afficher un indicateur de chargement pendant la récupération des données
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Modifier la bergerie</Text>
        </View>
        
        {/* Image de couverture */}
        <TouchableOpacity style={styles.coverPhotoContainer} onPress={pickCoverPhoto}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverPhoto} />
          ) : originalCoverPhoto ? (
            <Image source={{ uri: originalCoverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPhotoPlaceholder}>
              <Ionicons name="image-outline" size={50} color="#FFFFFF" />
              <Text style={styles.coverPhotoText}>Ajouter une image de couverture</Text>
            </View>
          )}
          
          <View style={styles.editPhotoButton}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
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
              value={tagsString}
              onChangeText={setTagsString}
              placeholder="bio, fromage, montagne, tradition..."
            />
          </View>
          
          {/* Note explicative */}
          <Text style={styles.note}>
            * Champs obligatoires
          </Text>
        </View>
        
        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
            disabled={updating}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.updateButton]} 
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <View style={styles.loadingButtonContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingButtonText}>Enregistrement...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Enregistrer</Text>
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
    backgroundColor: '#F9F7F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  coverPhotoContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginBottom: 15,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#BBBBBB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  note: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#3F72AF',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default EditBergerieScreen;