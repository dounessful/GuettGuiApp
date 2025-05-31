// src/screens/feed/CommentsScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPostById, getPostComments, addComment } from '../../services/posts';
import { getBergerieById } from '../../services/bergeries';
import CommentItem from '../../components/feed/CommentItem';

const CommentsScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [bergerie, setBergerie] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { currentUser } = useAuth();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Chargement des données
  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails du post
      const postData = await getPostById(postId);
      setPost(postData);
      
      // Récupérer les détails de la bergerie
      if (postData.bergerieId) {
        const bergerieData = await getBergerieById(postData.bergerieId);
        setBergerie(bergerieData);
      }
      
      // Récupérer les commentaires
      await fetchComments();
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les commentaires
  const fetchComments = async () => {
    try {
      const postComments = await getPostComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
    }
  };

  // Rafraîchir les commentaires
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  };

  // Ajouter un commentaire
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    Keyboard.dismiss();
    
    try {
      setSubmitting(true);
      
      // Ajouter le commentaire à la base de données
      await addComment(postId, currentUser.uid, commentText);
      
      // Réinitialiser le champ de texte
      setCommentText('');
      
      // Rafraîchir les commentaires
      await fetchComments();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu d'un commentaire
  const renderComment = ({ item }) => {
    return <CommentItem comment={item} />;
  };

  // Rendu de l'en-tête de la liste
  const renderListHeader = () => {
    if (!post) return null;
    
    return (
      <View style={styles.listHeader}>
        <Text style={styles.postInfoText}>
          Commentaires sur la publication de{' '}
          <Text style={styles.bergerieName}>{bergerie?.name || 'Bergerie'}</Text>
        </Text>
      </View>
    );
  };

  // Rendu de l'indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Liste des commentaires */}
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        ListHeaderComponent={renderListHeader}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={50} color="#BBB" />
            <Text style={styles.emptyText}>Aucun commentaire</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à commenter cette publication</Text>
          </View>
        }
      />
      
      {/* Barre d'ajout de commentaire */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Ajouter un commentaire..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || submitting) ? styles.sendButtonDisabled : {}
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color={!commentText.trim() ? "#BBBBBB" : "#FFFFFF"} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  commentsList: {
    flexGrow: 1,
    paddingHorizontal: 15,
  },
  listHeader: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  postInfoText: {
    fontSize: 14,
    color: '#666',
  },
  bergerieName: {
    fontWeight: 'bold',
    color: '#3F72AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  input: {
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3F72AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});

export default CommentsScreen;