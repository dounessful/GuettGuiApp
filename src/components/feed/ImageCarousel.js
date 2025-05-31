import React, { useState, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');

const ImageCarousel = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Gérer le changement d'image
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };
  
  // Rendu d'un élément média (image ou vidéo)
  const renderMediaItem = ({ item }) => {
    if (item.type === 'video') {
      return (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: item.url }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            shouldPlay={false}
            isLooping
            useNativeControls
            style={styles.video}
          />
          <View style={styles.videoIndicator}>
            <Ionicons name="play-circle" size={40} color="#FFFFFF" />
          </View>
        </View>
      );
    } else {
      return (
        <Image 
          source={{ uri: item.url }} 
          style={styles.image}
          resizeMode="cover"
        />
      );
    }
  };
  
  // Naviguer vers l'image précédente
  const goToPrevious = () => {
    if (activeIndex > 0) {
      flatListRef.current.scrollToIndex({
        index: activeIndex - 1,
        animated: true
      });
    }
  };
  
  // Naviguer vers l'image suivante
  const goToNext = () => {
    if (activeIndex < images.length - 1) {
      flatListRef.current.scrollToIndex({
        index: activeIndex + 1,
        animated: true
      });
    }
  };
  
  // Ne pas afficher les contrôles si une seule image
  const showControls = images.length > 1;
  
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      />
      
      {/* Indicateurs de page */}
      {showControls && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex ? styles.paginationDotActive : {}
              ]}
            />
          ))}
        </View>
      )}
      
      {/* Boutons de navigation */}
      {showControls && activeIndex > 0 && (
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonLeft]}
          onPress={goToPrevious}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {showControls && activeIndex < images.length - 1 && (
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonRight]}
          onPress={goToNext}
        >
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width,
    position: 'relative',
  },
  image: {
    width: width,
    height: width,
  },
  videoContainer: {
    width: width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
});

export default ImageCarousel;