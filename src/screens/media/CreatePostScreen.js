// src/screens/media/CreatePostScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getUserBergeries } from '../../services/bergeries';
import { createPost } from '../../services/posts';

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = (width - 60) / 3;

const CreatePostScreen = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedBergerie, setSelectedBergerie] = useState(null);
  const [userBergeries, setUserBergeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();

  // Récupérer les bergeries de l'utilisateur
  useEffect(() => {
    const fetchUserBergeries = async () => {
      try {
        setLoading(true);
        const bergeries = await getUserBergeries(currentUser.uid);
        setUserBergeries(bergeries);
        
        // Sélectionner automatiquement la première bergerie si elle existe
        if (bergeries.length > 0) {
          setSelectedBergerie(bergeries[0]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des bergeries:', error);
        Alert.alert('Erreur', 'Impossible de récupérer vos bergeries.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserBergeries();
  }, [currentUser]);

  // Demander les permissions d'accès à la caméra/galerie
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Nous avons besoin de votre permission pour accéder à la caméra et à la galerie.'
        );
      }
    })();
  }, []);

  // Fonction pour sélectionner des images depuis la galerie
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });
      
      if (!result.canceled && result.assets) {
        if (mediaFiles.length + result.assets.length > 10) {
          Alert.alert('Limite atteinte', 'Vous ne pouvez pas ajouter plus de 10 médias.');
          return;
        }
        
        setMediaFiles([...mediaFiles, ...result.assets]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'images:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images.');
    }
  };

  // Fonction pour prendre une photo avec la caméra
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets) {
        if (mediaFiles.length + 1 > 10) {
          Alert.alert('Limite atteinte', 'Vous ne pouvez pas ajouter plus de 10 médias.');
          return;
        }
        
        setMediaFiles([...mediaFiles, ...result.assets]);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo.');
    }
  };

  // Fonction pour retirer une image
  const removeMedia = (index) => {
    const newMediaFiles = [...mediaFiles];
    newMediaFiles.splice(index, 1);
    setMediaFiles(newMediaFiles);
  };

  // Fonction pour publier le post
  const handlePost = async () => {
    if (!selectedBergerie) {
      Alert.alert('Erreur', 'Veuillez sélectionner une bergerie.');
      return;
    }
    
    if (mediaFiles.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une image ou vidéo.');
      return;
    }
    
    try {
      setUploading(true);
      
      // Préparer les fichiers médias
      const files = mediaFiles.map(media => ({
        uri: media.uri,
        type: media.type || 'image/jpeg',
        name: media.fileName || `photo-${Date.now()}.jpg`,
      }));
      
      // Créer le post
      const postData = {
        bergerieId: selectedBergerie.id,
        userId: currentUser.uid,
        content,
        isPublic: true
      };
      
      await createPost(postData, files);
      
      // Réinitialiser le formulaire
      setContent('');
      setMediaFiles([]);
      
      // Retourner à l'écran précédent
      navigation.goBack();
      
      // Afficher un message de succès
      Alert.alert('Succès', 'Votre publication a été créée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
      Alert.alert('Erreur', 'Impossible de créer la publication. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  // Si aucune bergerie n'est disponible
  if (!loading && userBergeries.length === 0) {
    return (
      <View style={styles.noBergerieContainer}>
        <Ionicons name="warning-outline" size={60} color="#BBB" />
        <Text style={styles.noBergerieTitle}>Aucune bergerie disponible</Text>
        <Text style={styles.noBergerieText}>
          Vous devez créer une bergerie avant de pouvoir publier du contenu.
        </Text>
        <TouchableOpacity
          style={styles.createBergerieButton}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'CreateBergerie' })}
        >
          <Text style={styles.createBergerieButtonText}>Créer une bergerie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nouvelle publication</Text>
        
        <TouchableOpacity
          style={[styles.postButton, (!mediaFiles.length || uploading) ? styles.postButtonDisabled : {}]}
          onPress={handlePost}
          disabled={!mediaFiles.length || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Publier</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Sélection de la bergerie */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3F72AF" />
            <Text style={styles.loadingText}>Chargement de vos bergeries...</Text>
          </View>
        ) : (
          <View style={styles.bergerieSection}>
            <Text style={styles.sectionTitle}>Bergerie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bergerieList}
            >
              {userBergeries.map((bergerie) => (
                <TouchableOpacity
                  key={bergerie.id}
                  style={[
                    styles.bergerieItem,
                    selectedBergerie?.id === bergerie.id ? styles.selectedBergerieItem : {}
                  ]}
                  onPress={() => setSelectedBergerie(bergerie)}
                >
                  <Image
                    source={
                      bergerie.coverPhoto
                        ? { uri: bergerie.coverPhoto }
                        : require('../../assets/placeholder-bergerie.png')
                    }
                    style={styles.bergerieImage}
                  />
                  <Text
                    style={[
                      styles.bergerieName,
                      selectedBergerie?.id === bergerie.id ? styles.selectedBergerieName : {}
                    ]}
                    numberOfLines={1}
                  >
                    {bergerie.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Texte de la publication */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Écrivez quelque chose à propos de cette publication..."
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={2000}
          />
          <Text style={styles.characterCount}>{content.length}/2000</Text>
        </View>
        
        {/* Médias */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Médias</Text>
          
          <View style={styles.mediaThumbnails}>
            {mediaFiles.map((media, index) => (
              <View key={index} style={styles.thumbnailContainer}>
                <Image source={{ uri: media.uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMedia(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#3F72AF" />
                </TouchableOpacity>
              </View>
            ))}
            
            {mediaFiles.length < 10 && (
              <View style={styles.mediaActions}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImages}>
                  <Ionicons name="images-outline" size={24} color="#3F72AF" />
                  <Text style={styles.mediaButtonText}>Galerie</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color="#3F72AF" />
                  <Text style={styles.mediaButtonText}>Caméra</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <Text style={styles.mediaLimit}>
            {mediaFiles.length}/10 médias ajoutés
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#555',
  },
  postButton: {
    backgroundColor: '#3F72AF',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  postButtonDisabled: {
    backgroundColor: '#BBBBBB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  bergerieSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  bergerieList: {
    paddingVertical: 10,
  },
  bergerieItem: {
    width: 100,
    alignItems: 'center',
    marginRight: 15,
    opacity: 0.7,
  },
  selectedBergerieItem: {
    opacity: 1,
  },
  bergerieImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#EFEFEF',
  },
  bergerieName: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  selectedBergerieName: {
    color: '#3F72AF',
    fontWeight: 'bold',
  },
  contentSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  contentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  mediaSection: {
    padding: 15,
  },
  mediaThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    margin: 5,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  mediaActions: {
    width: THUMBNAIL_SIZE * 2 + 10,
    height: THUMBNAIL_SIZE,
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
  },
  mediaButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  mediaButtonText: {
    fontSize: 12,
    color: '#3F72AF',
    marginTop: 5,
  },
  mediaLimit: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  noBergerieContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noBergerieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noBergerieText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  createBergerieButton: {
    backgroundColor: '#3F72AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
  },
  createBergerieButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreatePostScreen;