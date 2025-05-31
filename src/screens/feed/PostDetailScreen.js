// src/screens/feed/PostDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPostById, toggleLikePost, checkIfUserLikedPost, getPostComments } from '../../services/posts';
import { getBergerieById } from '../../services/bergeries';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageCarousel from '../../components/feed/ImageCarousel';
import CommentItem from '../../components/feed/CommentItem';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [bergerie, setBergerie] = useState(null);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  
  const { currentUser } = useAuth();
  
  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les détails du post
        const postData = await getPostById(postId);
        setPost(postData);
        setLikesCount(postData.stats?.likesCount || 0);
        setCommentsCount(postData.stats?.commentsCount || 0);
        
        // Récupérer les détails de la bergerie
        if (postData.bergerieId) {
          const bergerieData = await getBergerieById(postData.bergerieId);
          setBergerie(bergerieData);
        }
        
        // Récupérer les détails de l'utilisateur
        if (postData.userId) {
          const userDoc = await getDoc(doc(firestore, 'users', postData.userId));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          }
        }
        
        // Vérifier si l'utilisateur a aimé le post
        const isLiked = await checkIfUserLikedPost(postId, currentUser.uid);
        setLiked(isLiked);
        
        // Récupérer les commentaires
        const postComments = await getPostComments(postId, 10);
        setComments(postComments);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [postId, currentUser]);
  
  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };
  
  // Fonction pour liker/unliker
  const handleLike = async () => {
    try {
      const result = await toggleLikePost(postId, currentUser.uid);
      setLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Erreur lors du like/unlike:', error);
    }
  };
  
  // Fonction pour partager
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez cette publication de ${bergerie?.name || 'BergerieApp'}!`,
        // Vous pourriez ajouter un lien profond ici quand l'app sera publiée
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };
  
  // Afficher un indicateur de chargement si les données sont en cours de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* En-tête avec les informations de la bergerie */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.bergerieInfo}
          onPress={() => navigation.navigate('BergerieDetail', { 
            bergerieId: bergerie?.id, 
            name: bergerie?.name 
          })}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
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
      <View style={styles.mediaContainer}>
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <ImageCarousel images={post.mediaUrls} />
        ) : (
          <View style={styles.placeholderMedia}>
            <Ionicons name="image-outline" size={60} color="#DDD" />
          </View>
        )}
      </View>
      
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
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>
      
      {/* Compteurs et contenu */}
      <View style={styles.contentContainer}>
        <Text style={styles.likesCount}>
          {likesCount} {likesCount > 1 ? 'j\'aimes' : 'j\'aime'}
        </Text>
        
        {post.content && (
          <View style={styles.caption}>
            <Text style={styles.captionText}>
              <Text style={styles.captionName}>{bergerie?.name || 'Bergerie'}</Text>
              {' '}{post.content}
            </Text>
          </View>
        )}
        
        <Text style={styles.dateText}>
          Publié le {formatDate(post.createdAt)}
        </Text>
      </View>
      
      {/* Commentaires */}
      <View style={styles.commentsSection}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentTitle}>
            Commentaires ({commentsCount})
          </Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Comments', { postId: post.id })}
          >
            <Text style={styles.viewAllText}>Voir tous</Text>
          </TouchableOpacity>
        </View>
        
        {comments.length > 0 ? (
          comments.slice(0, 3).map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
            />
          ))
        ) : (
          <Text style={styles.noCommentsText}>Aucun commentaire pour le moment</Text>
        )}
        
        <TouchableOpacity 
          style={styles.addCommentButton}
          onPress={() => navigation.navigate('Comments', { postId: post.id })}
        >
          <Text style={styles.addCommentText}>Ajouter un commentaire</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bergerieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3F72AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bergerieName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  userName: {
    fontSize: 13,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  mediaContainer: {
    width: width,
    height: width,
    backgroundColor: '#F5F5F5',
  },
  placeholderMedia: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
    padding: 2,
  },
  contentContainer: {
    padding: 12,
    borderBottomWidth: 8,
    borderBottomColor: '#F0F0F0',
  },
  likesCount: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  caption: {
    marginBottom: 10,
  },
  captionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  captionName: {
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  commentsSection: {
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    color: '#3F72AF',
    fontSize: 14,
  },
  noCommentsText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  addCommentButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  addCommentText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PostDetailScreen;