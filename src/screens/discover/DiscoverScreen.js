// src/screens/discover/DiscoverScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchBergeries } from '../../services/bergeries';
import BergerieCard from '../../components/bergeries/BergerieCard';
import FilterChip from '../../components/common/FilterChip';

const DiscoverScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bergeries, setBergeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Types de bergeries pour les filtres
  const bergerieTypes = [
    { id: 'all', label: 'Toutes' },
    { id: 'ovin', label: 'Ovins' },
    { id: 'caprin', label: 'Caprins' },
    { id: 'bovin', label: 'Bovins' },
    { id: 'fromage', label: 'Fromagers' }
  ];

  // Régions pour les filtres
  const regions = [
    { id: 'all_regions', label: 'Toutes régions' },
    { id: 'alpes', label: 'Alpes' },
    { id: 'pyrenees', label: 'Pyrénées' },
    { id: 'jura', label: 'Jura' },
    { id: 'corse', label: 'Corse' },
    { id: 'auvergne', label: 'Auvergne' }
  ];

  // Filtres de tri
  const sortOptions = [
    { id: 'popular', label: 'Popularité' },
    { id: 'recent', label: 'Récent' },
    { id: 'nearest', label: 'Proximité' }
  ];

  const [activeRegion, setActiveRegion] = useState('all_regions');
  const [activeSort, setActiveSort] = useState('popular');

  useEffect(() => {
    loadBergeries();
  }, [activeFilter, activeRegion, activeSort]);

  // Fonction pour charger les bergeries selon les filtres
  const loadBergeries = async () => {
    try {
      setLoading(true);
      
      // Préparation des filtres
      const filters = {};
      
      if (activeFilter !== 'all') {
        filters.type = activeFilter;
      }
      
      if (activeRegion !== 'all_regions') {
        filters.region = activeRegion;
      }
      
      // Recherche des bergeries
      const results = await searchBergeries(searchTerm, filters, 20);
      
      // Tri des résultats
      let sortedResults = [...results];
      if (activeSort === 'popular') {
        sortedResults.sort((a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0));
      } else if (activeSort === 'recent') {
        sortedResults.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      }
      // Note: La proximité nécessiterait la géolocalisation de l'utilisateur
      
      setBergeries(sortedResults);
    } catch (error) {
      console.error('Erreur lors du chargement des bergeries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rechercher selon le terme saisi
  const handleSearch = () => {
    loadBergeries();
  };

  // Fonction pour gérer le clic sur une bergerie
  const handleBergeriePress = (bergerieId, name) => {
    navigation.navigate('BergerieDetail', { bergerieId, name });
  };

  // Fonction pour basculer l'affichage des filtres
  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };

  // Rendu de l'écran vide
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={60} color="#BBB" />
        <Text style={styles.emptyText}>Aucune bergerie trouvée</Text>
        <Text style={styles.emptySubtext}>Essayez de modifier vos filtres ou votre recherche</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une bergerie..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchTerm('');
                handleSearch();
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
          <Ionicons name="options-outline" size={22} color="#3F72AF" />
        </TouchableOpacity>
      </View>
      
      {/* Filtres */}
      {filterOpen && (
        <View style={styles.filtersContainer}>
          {/* Types de bergeries */}
          <Text style={styles.filterTitle}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {bergerieTypes.map(type => (
              <FilterChip
                key={type.id}
                label={type.label}
                active={activeFilter === type.id}
                onPress={() => setActiveFilter(type.id)}
              />
            ))}
          </ScrollView>
          
          {/* Régions */}
          <Text style={styles.filterTitle}>Région</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {regions.map(region => (
              <FilterChip
                key={region.id}
                label={region.label}
                active={activeRegion === region.id}
                onPress={() => setActiveRegion(region.id)}
              />
            ))}
          </ScrollView>
          
          {/* Options de tri */}
          <Text style={styles.filterTitle}>Trier par</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {sortOptions.map(option => (
              <FilterChip
                key={option.id}
                label={option.label}
                active={activeSort === option.id}
                onPress={() => setActiveSort(option.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Liste des bergeries */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F72AF" />
        </View>
      ) : (
        <FlatList
          data={bergeries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BergerieCard 
              bergerie={item} 
              onPress={() => handleBergeriePress(item.id, item.name)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 46,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    marginLeft: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginLeft: 5,
  },
  filterRow: {
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
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

export default DiscoverScreen;