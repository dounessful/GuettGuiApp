// src/screens/profile/UserProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import PostThumbnail from '../../components/feed/PostThumbnail';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId, name } = route.params;
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bergeries, setBergeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { currentUser } = useAuth();

  // Chargement des données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Récupérer les informations de l'utilisateur
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (userDoc.exists()) {
          setUser(userDoc.data());
          
          // Récupérer les bergeries de l'utilisateur
          const bergeriesQuery = query(
            collection(firestore, 'bergeries'),
            where('ownerId', '==', userId)
          );
          
          const bergeriesSnapshot = await getDocs(bergeriesQuery);
          const bergeriesList = [];
          
          bergeriesSnapshot.forEach((doc) => {
            bergeriesList.push({ id: doc.id, ...doc.data() });
          });
          
          setBergeries(bergeriesList);
          
          // Récupérer les publications de l'utilisateur
          const postsQuery = query(
            collection(firestore, 'posts'),
            where('userId', '==', userId)
          );
          
          const postsSnapshot = await getDocs(postsQuery);
          const postsList = [];
          
          postsSnapshot.forEach((doc) => {
            postsList.push({ id: doc.id, ...doc.data() });
          });
          
          setPosts(postsList);
          
          // Vérifier si l'utilisateur courant suit cet utilisateur
          // Cette partie devrait être implémentée avec un service de suivi
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  // Fonction pour suivre/ne plus suivre
  const handleFollow = () => {
    // TODO: Implémenter la fonctionnalité de suivi
    setIsFollowing(!isFollowing);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F72AF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#BBB" />
        <Text style={styles.errorText}>Utilisateur non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tête du profil */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        {/* Informations utilisateur */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.displayName || 'Utilisateur'}</Text>
          
          {/* Type de compte */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {user.role === 'berger' ? 'Éleveur' : 'Visiteur'}
            </Text>
          </View>
          
          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bergeries.length}</Text>
              <Text style={styles.statLabel}>Bergeries</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Abonnements</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Bouton d'action */}
      {userId !== currentUser?.uid && (
        <TouchableOpacity 
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : {}
          ]}
          onPress={handleFollow}
        >
          <Text style={[
            styles.followButtonText,
            isFollowing ? styles.followingButtonText : {}
          ]}>
            {isFollowing ? 'Abonné' : 'Suivre'}
          </Text>
          {isFollowing && (
            <Ionicons name="checkmark" size={16} color="#3F72AF" style={styles.followingIcon} />
          )}
        </TouchableOpacity>
      )}
      
      {/* Section des bergeries */}
      {bergeries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bergeries</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bergeriesList}
          >
            {bergeries.map((bergerie) => (
              <TouchableOpacity 
                key={bergerie.id}
                style={styles.bergerieItem}
                onPress={() => navigation.navigate('BergerieDetail', {
                  bergerieId: bergerie.id,
                  name: bergerie.name
                })}
              >
                <Image
                  source={
                    bergerie.coverPhoto
                      ? { uri: bergerie.coverPhoto }
                      : require('../../assets/placeholder-bergerie.png')
                  }
                  style={styles.bergerieImage}
                />
                <Text style={styles.bergerieName} numberOfLines={1}>
                  {bergerie.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Section des publications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Publications</Text>
        
        {posts.length > 0 ? (
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <PostThumbnail
                key={post.id}
                post={post}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={40} color="#BBB" />
            <Text style={styles.emptyText}>Aucune publication</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#555',
    marginTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#BBB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleContainer: {
    backgroundColor: '#E6EEF7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  roleText: {
    fontSize: 12,
    color: '#3F72AF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#3F72AF',
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3F72AF',
  },
  followingButtonText: {
    color: '#3F72AF',
  },
  followingIcon: {
    marginLeft: 5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bergeriesList: {
    paddingBottom: 10,
  },
  bergerieItem: {
    width: 100,
    marginRight: 15,
    alignItems: 'center',
  },
  bergerieImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  bergerieName: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
});

export default UserProfileScreen;