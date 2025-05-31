import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';

const StoriesBar = () => {
  const [loading, setLoading] = useState(true);
  const [bergeries, setBergeries] = useState([]);
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  // Récupérer les bergeries populaires pour les stories
  useEffect(() => {
    const fetchPopularBergeries = async () => {
      try {
        const bergeriesRef = collection(firestore, 'bergeries');
        const popularQuery = query(
          bergeriesRef,
          orderBy('stats.likesCount', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(popularQuery);
        const bergeriesList = [];
        
        querySnapshot.forEach((doc) => {
          bergeriesList.push({ id: doc.id, ...doc.data() });
        });
        
        setBergeries(bergeriesList);
      } catch (error) {
        console.error('Erreur lors de la récupération des bergeries populaires :', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularBergeries();
  }, []);
  
  // Navigation vers la création d'une bergerie
  const handleCreateBergerie = () => {
    navigation.navigate('ProfileTab', {
      screen: 'CreateBergerie'
    });
  };
  
  // Navigation vers le détail d'une bergerie
  const handleBergeriePress = (bergerieId, name) => {
    navigation.navigate('BergerieDetail', { bergerieId, name });
  };
  
  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3F72AF" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Item pour créer une bergerie */}
        <TouchableOpacity 
          style={styles.storyItem}
          onPress={handleCreateBergerie}
        >
          <View style={styles.createStoryContainer}>
            <View style={styles.createIconContainer}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Image 
              source={
                userProfile?.photoURL 
                  ? { uri: userProfile.photoURL }
                  : require('../../assets/placeholder-user.png')
              }
              style={styles.createStoryImage}
            />
          </View>
          <Text style={styles.storyUsername} numberOfLines={1}>
            Ajouter
          </Text>
        </TouchableOpacity>
        
        {/* Liste des bergeries populaires */}
        {bergeries.map((bergerie) => (
          <TouchableOpacity 
            key={bergerie.id}
            style={styles.storyItem}
            onPress={() => handleBergeriePress(bergerie.id, bergerie.name)}
          >
            <View style={styles.storyImageContainer}>
              <Image 
                source={
                  bergerie.coverPhoto 
                    ? { uri: bergerie.coverPhoto }
                    : require('../../assets/placeholder-bergerie.png')
                }
                style={styles.storyImage}
              />
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {bergerie.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  storyImageContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    borderWidth: 2,
    borderColor: '#3F72AF',
    marginBottom: 5,
  },
  storyImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  createStoryContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 5,
    position: 'relative',
  },
  createStoryImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  createIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3F72AF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    width: '100%',
  },
});

export default StoriesBar;