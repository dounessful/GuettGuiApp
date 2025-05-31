// src/components/feed/PostThumbnail.js

import React from 'react';
import {
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = (width - 12) / 3; // 3 images par ligne avec 2px de marge

const PostThumbnail = ({ post, onPress }) => {
  // Récupère l'URL de la première image du post
  const getImageUrl = () => {
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      return post.mediaUrls[0].url;
    }
    return null;
  };

  // Vérifie si le post contient plusieurs médias
  const hasMultipleMedia = post.mediaUrls && post.mediaUrls.length > 1;
  
  // Vérifie si le post contient une vidéo
  const hasVideo = post.mediaUrls && post.mediaUrls.some(media => media.type === 'video');

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={
          getImageUrl()
            ? { uri: getImageUrl() }
            : require('../../assets/placeholder-image.png')
        }
        style={styles.thumbnail}
      />
      
      {/* Indicateur de contenu multiple */}
      {hasMultipleMedia && (
        <View style={styles.multipleIndicator}>
          <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
        </View>
      )}
      
      {/* Indicateur de vidéo */}
      {hasVideo && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    margin: 2,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostThumbnail;