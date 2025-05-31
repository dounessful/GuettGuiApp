// src/screens/bergerie/BergerieDetailScreen.js (partie mise à jour)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBergerieById } from '../../services/bergeries';
import { useInteractions } from '../../hooks/useInteractions';

const BergerieDetailScreen = ({ route, navigation }) => {
  const { bergerieId } = route.params;
  const { currentUser } = useAuth();
  
  const [bergerie, setBergerie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Hook pour gérer les interactions
  const {
    isLiked,
    isFollowing,
    likesCount,
    followersCount,
    handleLike,
    handleFollow,
    updateCounts,
    isLikeLoading,
    isFollowLoading,
    canInteract
  } = useInteractions(bergerieId, 'bergerie');

  // Charger les données de la bergerie
  useEffect(() => {
    const fetchBergerie = async () => {
      try {
        setLoading(true);
        const bergerieData = await getBergerieById(bergerieId);
        setBergerie(bergerieData);
        
        // Initialiser les compteurs
        updateCounts(
          bergerieData.stats?.likesCount || 0,
          bergerieData.stats?.followersCount || 0
        );
        
        // Mettre à jour le titre de la navigation
        navigation.setOptions({
          title: bergerieData.name || 'Bergerie'
        });
      } catch (error) {
        console.error('Erreur lors du chargement de la bergerie:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de la bergerie.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchBergerie();
  }, [bergerieId]);

  const handleEditPress = () => {
    navigation.navigate('EditBergerie', { bergerieId });
  };

  const handlePhonePress = () => {
    if (bergerie?.phoneNumber) {
      Linking.openURL(`tel:${bergerie.phoneNumber}`);
    }
  };

  const handleWebsitePress = () => {
    if (bergerie?.website) {
      Linking.openURL(bergerie.website);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!bergerie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Bergerie non trouvée</Text>
      </View>
    );
  }

  const isOwner = currentUser?.uid === bergerie.ownerId;

  return (
    <ScrollView style={styles.container}>
      {/* Image de couverture */}
      {bergerie.coverPhoto && (
        <Image source={{ uri: bergerie.coverPhoto }} style={styles.coverPhoto} />
      )}

      {/* Informations principales */}
      <View style={styles.mainInfo}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.name}>{bergerie.name}</Text>
            <View style={styles.typeContainer}>
              <Text style={styles.type}>{bergerie.type}</Text>
              {bergerie.verified && (
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              )}
            </View>
          </View>
          
          {isOwner && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <Ionicons name="create-outline" size={20} color="#3F72AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{likesCount}</Text>
            <Text style={styles.statLabel}>J'aime</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bergerie.stats?.postsCount || 0}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        {!isOwner && canInteract && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.primaryButton, isLiked && styles.likedButton]} 
              onPress={handleLike}
              disabled={isLikeLoading}
            >
              {isLikeLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.primaryButtonText}>
                    {isLiked ? "Aimé" : "J'aime"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, isFollowing && styles.followingButton]} 
              onPress={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color="#3F72AF" />
              ) : (
                <>
                  <Ionicons 
                    name={isFollowing ? "person-remove" : "person-add"} 
                    size={18} 
                    color={isFollowing ? "#FFFFFF" : "#3F72AF"} 
                  />
                  <Text style={[
                    styles.secondaryButtonText, 
                    isFollowing && styles.followingButtonText
                  ]}>
                    {isFollowing ? "Suivi" : "Suivre"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Informations détaillées */}
      <View style={styles.detailsContainer}>
        {/* Localisation */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="location-outline" size={20} color="#3F72AF" />
            <Text style={styles.infoTitle}>Localisation</Text>
          </View>
          <Text style={styles.infoText}>
            {bergerie.location?.address && `${bergerie.location.address}, `}
            {bergerie.location?.region}
          </Text>
        </View>

        {/* Description */}
        {bergerie.description && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="document-text-outline" size={20} color="#3F72AF" />
              <Text style={styles.infoTitle}>Description</Text>
            </View>
            <Text style={styles.infoText}>{bergerie.description}</Text>
          </View>
        )}

        {/* Contact */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="call-outline" size={20} color="#3F72AF" />
            <Text style={styles.infoTitle}>Contact</Text>
          </View>
          
          {bergerie.phoneNumber && (
            <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
              <Ionicons name="call" size={16} color="#4CAF50" />
              <Text style={styles.contactText}>{bergerie.phoneNumber}</Text>
            </TouchableOpacity>
          )}
          
          {bergerie.website && (
            <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
              <Ionicons name="globe" size={16} color="#2196F3" />
              <Text style={styles.contactText}>{bergerie.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags */}
        {bergerie.tags && bergerie.tags.length > 0 && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="pricetags-outline" size={20} color="#3F72AF" />
              <Text style={styles.infoTitle}>Tags</Text>
            </View>
            <View style={styles.tagsContainer}>
              {bergerie.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  coverPhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  mainInfo: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleSection: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F72AF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  likedButton: {
    backgroundColor: '#FF6B6B',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3F72AF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  followingButton: {
    backgroundColor: '#3F72AF',
    borderColor: '#3F72AF',
  },
  secondaryButtonText: {
    color: '#3F72AF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  detailsContainer: {
    padding: 15,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
});

export default BergerieDetailScreen;