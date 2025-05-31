// src/components/feed/PostCard.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { getBergerieById } from '../../services/bergeries';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { toggleLikePost, checkIfUserLikedPost } from '../../services/posts';
import ImageCarousel from './ImageCarousel';

const { width } = Dimensions.get('window');

const PostCard = ({ post, onPress, onBergeriePress, currentUserId }) => {
  const [bergerie, setBergerie] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.stats?.likesCount || 0);
  const [isDoubleTapping, setIsDoubleTapping] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  
  const navigation = useNavigation();
  
  // Récupérer les informations de la bergerie et de l'utilisateur
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les données de la bergerie
        if (post.bergerieId) {
          const bergerieData = await getBergerieById(post.bergerieId);
          setBergerie(bergerieData);
        }
        
        // Récupérer les données de l'utilisateur
        if (post.userId) {
          const userDoc = await getDoc(doc(firestore, 'users', post.userId));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          }
        }
        
        // Vérifier si l'utilisateur a aimé la publication
        const isLiked = await checkIfUserLikedPost(post.id, currentUserId);
        setLiked(isLiked);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [post.bergerieId, post.userId, post.id, currentUserId]);
  
  // Gérer le double tap pour liker
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      handleLike();
      setIsDoubleTapping(true);
      setTimeout(() => {
        setIsDoubleTapping(false);
      }, 1000);
    } else {
      setLastTap(now);
    }
  };
  
  // Gérer le like/unlike
  const handleLike = async () => {
    try {
      const result = await toggleLikePost(post.id, currentUserId);
      setLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Erreur lors du like/unlike :', error);
    }
  };
  
  // Formater la date de publication
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date :', error);
      return '';
    }
  };
  
  // Afficher un indicateur de chargement si les données sont en cours de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3F72AF" />
      </View>
    );
  }
  
  return (
    <View style={styles.card}>
      {/* En-tête de la carte */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.bergerieInfo}
          onPress={() => onBergeriePress(post.bergerieId, bergerie?.name)}
        >
          <Image 
            source={
              bergerie?.coverPhoto 
                ? { uri: bergerie.coverPhoto } 
                : require('../../assets/placeholder-bergerie.png')
            } 
            style={styles.bergerieAvatar}
          />
          <View>
            <Text style={styles.bergerieName}>{bergerie?.name || 'Bergerie'}</Text>
            <Text style={styles.userName}>{user?.displayName || 'Utilisateur'}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
        </TouchableOpacity>
      </View>
      
      {/* Contenu média */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handleDoubleTap}
        onLongPress={onPress}
        delayLongPress={500}
      >
        <View style={styles.mediaContainer}>
          {post.mediaUrls && post.mediaUrls.length > 0 ? (
            <>
              <ImageCarousel images={post.mediaUrls} />
              {isDoubleTapping && (
                <View style={styles.heartOverlay}>
                  <Ionicons name="heart" size={80} color="#fff" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderMedia}>
              <Ionicons name="image-outline" size={60} color="#DDD" />
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Contenu texte */}
      <View style={styles.contentContainer}>
        {/* Barre d'actions */}
        <View style={styles.actionsBar}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={26} 
                color={liked ? "#E74C3C" : "#555"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Comments', { postId: post.id })}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>
        
        {/* Compteurs */}
        <View style={styles.counters}>
          <Text style={styles.likesCount}>
            {likesCount} {likesCount > 1 ? 'j\'aimes' : 'j\'aime'}
          </Text>
        </View>
        
        {/* Description */}
        {post.content && (
          <View style={styles.description}>
            <Text style={styles.descriptionText}>
              <Text style={styles.userName}>{bergerie?.name || 'Bergerie'}</Text>
              {' '}{post.content}
            </Text>
          </View>
        )}
        
        {/* Commentaires et date */}
        <TouchableOpacity 
          style={styles.commentsLink}
          onPress={() => navigation.navigate('Comments', { postId: post.id })}
        >
          <Text style={styles.commentsText}>
            Voir les {post.stats?.commentsCount || 0} commentaires
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 10,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  bergerieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bergerieAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  bergerieName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  userName: {
    fontSize: 13,
    color: '#555',
  },
  moreButton: {
    padding: 8,
  },
  mediaContainer: {
    width: '100%',
    height: width,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  placeholderMedia: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    padding: 12,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
    padding: 2,
  },
  counters: {
    marginBottom: 8,
  },
  likesCount: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  description: {
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentsLink: {
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#777',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});

export default PostCard;