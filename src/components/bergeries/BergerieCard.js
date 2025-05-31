// src/components/BergerieCard.js

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInteractions } from '../../hooks/useInteractions';

const BergerieCard = ({ bergerie, onPress }) => {
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
    canInteract,
    loading
  } = useInteractions(bergerie.id, 'bergerie');

  // Initialiser les compteurs avec les données de la bergerie
  useEffect(() => {
    updateCounts(
      bergerie.stats?.likesCount || 0,
      bergerie.stats?.followersCount || 0
    );
  }, [bergerie]);

  const handleCardPress = () => {
    if (onPress) {
      onPress(bergerie);
    }
  };

  const handleLikePress = (event) => {
    event.stopPropagation(); // Empêcher la propagation vers le TouchableOpacity parent
    handleLike();
  };

  const handleFollowPress = (event) => {
    event.stopPropagation(); // Empêcher la propagation vers le TouchableOpacity parent
    handleFollow();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
      {/* Image de couverture */}
      <View style={styles.imageContainer}>
        {bergerie.coverPhoto ? (
          <Image 
            source={{ uri: bergerie.coverPhoto }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#CCC" />
          </View>
        )}
        
        {/* Badge vérifié */}
        {bergerie.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
        
        {/* Type de bergerie */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{bergerie.type}</Text>
        </View>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* En-tête avec nom et localisation */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {bergerie.name}
            </Text>
            {bergerie.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.location} numberOfLines={1}>
                  {bergerie.location.region}
                  {bergerie.location.address && `, ${bergerie.location.address}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {bergerie.description && (
          <Text style={styles.description} numberOfLines={2}>
            {bergerie.description}
          </Text>
        )}

        {/* Tags */}
        {bergerie.tags && bergerie.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {bergerie.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {bergerie.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{bergerie.tags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#666" />
            <Text style={styles.statText}>{likesCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.statText}>{followersCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={14} color="#666" />
            <Text style={styles.statText}>{bergerie.stats?.postsCount || 0}</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        {canInteract && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]} 
              onPress={handleLikePress}
              disabled={isLikeLoading}
              activeOpacity={0.7}
            >
              {isLikeLoading ? (
                <ActivityIndicator size="small" color={isLiked ? "#FFFFFF" : "#666"} />
              ) : (
                <>
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={16} 
                    color={isLiked ? "#FFFFFF" : "#666"} 
                  />
                  <Text style={[styles.actionText, isLiked && styles.likedText]}>
                    {isLiked ? "Aimé" : "J'aime"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isFollowing && styles.followingButton]} 
              onPress={handleFollowPress}
              disabled={isFollowLoading}
              activeOpacity={0.7}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#FFFFFF" : "#666"} />
              ) : (
                <>
                  <Ionicons 
                    name={isFollowing ? "person-remove" : "person-add"} 
                    size={16} 
                    color={isFollowing ? "#FFFFFF" : "#666"} 
                  />
                  <Text style={[styles.actionText, isFollowing && styles.followingText]}>
                    {isFollowing ? "Suivi" : "Suivre"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Indicateur de chargement des interactions */}
        {loading && (
          <View style={styles.interactionLoadingContainer}>
            <ActivityIndicator size="small" color="#3F72AF" />
            <Text style={styles.interactionLoadingText}>Chargement...</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F5F5F5',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 15,
  },
  header: {
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 6,
  },
  likedButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  followingButton: {
    backgroundColor: '#3F72AF',
    borderColor: '#3F72AF',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  likedText: {
    color: '#FFFFFF',
  },
  followingText: {
    color: '#FFFFFF',
  },
  interactionLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  interactionLoadingText: {
    fontSize: 12,
    color: '#999',
  },
});

export default BergerieCard;