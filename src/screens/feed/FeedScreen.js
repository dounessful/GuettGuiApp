import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getFeedPosts } from '../../services/posts';
import PostCard from '../../components/feed/PostCard';
import StoriesBar from '../../components/feed/StoriesBar';

const FeedScreen = ({ navigation }) => {
  // États pour la gestion des données
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  
  // Contexte d'authentification
  const { currentUser } = useAuth();
  
  // Fonction pour charger les publications
  const loadPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setAllLoaded(false);
      } else if (!refresh && !loading) {
        setLoadingMore(true);
      }
      
      const lastDoc = refresh ? null : lastVisible;
      const { posts: newPosts, lastVisible: newLastVisible } = await getFeedPosts(10, lastDoc);
      
      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      setLastVisible(newLastVisible);
      
      // Vérifier si toutes les publications ont été chargées
      if (newPosts.length < 10) {
        setAllLoaded(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des publications :', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };
  
  // Charger les publications au montage et à chaque focus de l'écran
  useEffect(() => {
    loadPosts();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadPosts(true);
    }, [])
  );
  
  // Fonction pour rafraîchir les publications
  const handleRefresh = () => {
    loadPosts(true);
  };
  
  // Fonction pour charger plus de publications
  const handleLoadMore = () => {
    if (!loadingMore && !allLoaded) {
      loadPosts();
    }
  };
  
  // Rendu du pied de liste (indicateur de chargement ou message de fin)
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#3F72AF" />
        </View>
      );
    } else if (allLoaded && posts.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.endText}>Vous avez tout vu !</Text>
        </View>
      );
    }
    return null;
  };
  
  // Rendu lorsqu'il n'y a pas de publications
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={60} color="#BBB" />
        <Text style={styles.emptyText}>Aucune publication pour le moment</Text>
        <Text style={styles.emptySubtext}>Les publications des bergeries que vous suivez apparaîtront ici</Text>
        <TouchableOpacity 
          style={styles.discoverButton}
          onPress={() => navigation.navigate('DiscoverTab')}
        >
          <Text style={styles.discoverButtonText}>Découvrir des bergeries</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Fonction pour gérer l'appui sur une publication
  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };
  
  // Fonction pour gérer l'appui sur une bergerie
  const handleBergeriePress = (bergerieId, name) => {
    navigation.navigate('BergerieDetail', { bergerieId, name });
  };
  
  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F72AF" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              onPress={() => handlePostPress(item)} 
              onBergeriePress={(bergerieId, name) => handleBergeriePress(bergerieId, name)}
              currentUserId={currentUser.uid}
            />
          )}
          ListHeaderComponent={<StoriesBar />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3F72AF']}
              tintColor="#3F72AF"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
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
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  endText: {
    color: '#888',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
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
    marginBottom: 20,
  },
  discoverButton: {
    backgroundColor: '#3F72AF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default FeedScreen;