// src/components/feed/CommentItem.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CommentItem = ({ comment }) => {
  const [user, setUser] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');

  // Récupérer les infos de l'utilisateur qui a commenté
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (comment.userId) {
          const userDoc = await getDoc(doc(firestore, 'users', comment.userId));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
    };

    fetchUser();
  }, [comment.userId]);

  // Calculer le temps écoulé depuis le commentaire
  useEffect(() => {
    if (comment.createdAt) {
      const formatTimeAgo = (timestamp) => {
        try {
          const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
          const now = new Date();
          const diffInSeconds = Math.floor((now - date) / 1000);

          if (diffInSeconds < 60) {
            return 'à l\'instant';
          } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `il y a ${minutes} min`;
          } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `il y a ${hours}h`;
          } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `il y a ${days}j`;
          } else {
            return format(date, 'dd MMM yyyy', { locale: fr });
          }
        } catch (error) {
          console.error('Erreur lors du formatage de la date:', error);
          return '';
        }
      };

      setTimeAgo(formatTimeAgo(comment.createdAt));
    }
  }, [comment.createdAt]);

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user?.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Contenu du commentaire */}
      <View style={styles.contentContainer}>
        <View style={styles.commentBubble}>
          <Text style={styles.userName}>{user?.displayName || 'Utilisateur'}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>

        {/* Footer avec les actions et la date */}
        <View style={styles.footer}>
          <Text style={styles.timeText}>{timeAgo}</Text>
          
          <TouchableOpacity style={styles.likeButton}>
            <Text style={styles.likeText}>J'aime</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.replyButton}>
            <Text style={styles.replyText}>Répondre</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingVertical: 5,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  placeholderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#BBBBBB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#F0F2F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 12,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  likeButton: {
    marginRight: 10,
  },
  likeText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  replyButton: {
    marginRight: 10,
  },
  replyText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
});

export default CommentItem;