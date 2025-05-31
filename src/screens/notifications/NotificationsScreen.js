// src/screens/notifications/NotificationsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!currentUser) return;
        
        const notificationsRef = collection(firestore, 'notifications');
        const q = query(
          notificationsRef,
          where('recipientId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const notificationsList = [];
        
        querySnapshot.forEach((doc) => {
          notificationsList.push({ id: doc.id, ...doc.data() });
        });
        
        setNotifications(notificationsList);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [currentUser]);

  // Format date
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
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
        return format(date, 'dd MMM', { locale: fr });
      }
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };

  // Fonction pour obtenir l'icône et la couleur selon le type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#E74C3C' };
      case 'comment':
        return { name: 'chatbubble', color: '#3498DB' };
      case 'follow':
        return { name: 'person-add', color: '#2ECC71' };
      case 'new_post':
        return { name: 'image', color: '#9B59B6' };
      default:
        return { name: 'notifications', color: '#F39C12' };
    }
  };

  // Navigation vers l'élément concerné
  const handleNotificationPress = (notification) => {
    switch (notification.type) {
      case 'like':
      case 'comment':
        navigation.navigate('PostDetail', { postId: notification.refId });
        break;
      case 'follow':
        navigation.navigate('UserProfile', { 
          userId: notification.senderId,
          name: 'Profil' 
        });
        break;
      case 'new_post':
        navigation.navigate('PostDetail', { postId: notification.refId });
        break;
      default:
        break;
    }
  };

  // Rendu d'un élément de notification
  const renderNotificationItem = ({ item }) => {
    const { name, color } = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadItem]} 
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={name} size={18} color="#FFFFFF" />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.notificationText}>{item.message}</Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#BBB" />
          <Text style={styles.emptyText}>Aucune notification</Text>
          <Text style={styles.emptySubtext}>
            Les interactions avec vos publications et bergeries apparaîtront ici
          </Text>
        </View>
      )}
    </View>
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
  listContainer: {
    padding: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: '#EBF5FF',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});

export default NotificationsScreen;