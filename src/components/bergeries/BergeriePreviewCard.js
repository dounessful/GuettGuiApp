// src/components/bergeries/BergeriePreviewCard.js

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BergeriePreviewCard = ({ bergerie, onPress, onEdit }) => {
  // Formatter les statistiques pour l'affichage (K pour milliers, M pour millions)
  const formatStat = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image de la bergerie */}
      <Image
        source={
          bergerie.coverPhoto
            ? { uri: bergerie.coverPhoto }
            : require('../../assets/placeholder-bergerie.png')
        }
        style={styles.image}
      />
      
      {/* Badge vérifié si applicable */}
      {bergerie.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#3F72AF" />
        </View>
      )}
      
      {/* Bouton d'édition */}
      <TouchableOpacity 
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Ionicons name="pencil" size={16} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Informations de la bergerie */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{bergerie.name}</Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" style={styles.locationIcon} />
          <Text style={styles.location} numberOfLines={1}>
            {bergerie.location?.region || 'Région non spécifiée'}
          </Text>
        </View>
        
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#E74C3C" style={styles.statIcon} />
            <Text style={styles.statValue}>
              {formatStat(bergerie.stats?.likesCount || 0)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#3498DB" style={styles.statIcon} />
            <Text style={styles.statValue}>
              {formatStat(bergerie.stats?.commentsCount || 0)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="images" size={14} color="#2ECC71" style={styles.statIcon} />
            <Text style={styles.statValue}>
              {formatStat(bergerie.stats?.postsCount || 0)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  editButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationIcon: {
    marginRight: 5,
  },
  location: {
    fontSize: 13,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 5,
  },
  statValue: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
});

export default BergeriePreviewCard;