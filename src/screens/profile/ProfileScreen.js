// src/screens/profile/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUserBergeries } from '../../services/bergeriesOLD';
import BergeriePreviewCard from '../../components/bergeries/BergeriePreviewCard';

const ProfileScreen = ({ navigation }) => {
  const [userBergeries, setUserBergeries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Contexte d'authentification
  const { userProfile, currentUser, logout } = useAuth();
  
  // Charger les bergeries de l'utilisateur
  useEffect(() => {
    const fetchUserBergeries = async () => {
      try {
        if (currentUser) {
          const bergeries = await getUserBergeries(currentUser.uid);
          setUserBergeries(bergeries);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des bergeries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserBergeries();
  }, [currentUser]);
  
  // Fonction pour se déconnecter
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de vous déconnecter.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Fonction pour naviguer vers l'écran de création de bergerie
  const handleCreateBergerie = () => {
    navigation.navigate('CreateBergerie');
  };
  
  // Fonction pour naviguer vers l'écran de modification du profil
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* En-tête du profil */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {userProfile?.photoURL ? (
            <Image
              source={{ uri: userProfile.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        {/* Informations utilisateur */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {userProfile?.displayName || 'Utilisateur'}
          </Text>
          <Text style={styles.userEmail}>
            {userProfile?.email || currentUser?.email || 'Pas d\'email'}
          </Text>
          
          {/* Type de compte */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {userProfile?.role === 'berger' ? 'Éleveur' : 'Utilisateur'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Boutons d'action */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="person-outline" size={20} color="#3F72AF" />
          <Text style={styles.actionButtonText}>Modifier le profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
          <Text style={[styles.actionButtonText, styles.logoutText]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      
      {/* Section des bergeries */}
      <View style={styles.bergeriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes bergeries</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleCreateBergerie}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3F72AF" />
            <Text style={styles.loadingText}>Chargement de vos bergeries...</Text>
          </View>
        ) : userBergeries.length > 0 ? (
          <View style={styles.bergeriesList}>
            {userBergeries.map((bergerie) => (
              <BergeriePreviewCard
                key={bergerie.id}
                bergerie={bergerie}
                onPress={() => navigation.navigate('BergerieDetail', { 
                  bergerieId: bergerie.id,
                  name: bergerie.name
                })}
                onEdit={() => navigation.navigate('EditBergerie', { 
                  bergerieId: bergerie.id 
                })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={50} color="#BBB" />
            <Text style={styles.emptyText}>Aucune bergerie</Text>
            <Text style={styles.emptySubtext}>
              Créez votre première bergerie pour commencer à partager du contenu
            </Text>
            <TouchableOpacity 
              style={styles.createBergerieButton}
              onPress={handleCreateBergerie}
            >
              <Text style={styles.createBergerieButtonText}>Créer une bergerie</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Section des paramètres (à développer) */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color="#555" style={styles.settingIcon} />
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#BBB" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="shield-outline" size={24} color="#555" style={styles.settingIcon} />
          <Text style={styles.settingText}>Confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="#BBB" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle-outline" size={24} color="#555" style={styles.settingIcon} />
          <Text style={styles.settingText}>Aide et assistance</Text>
          <Ionicons name="chevron-forward" size={20} color="#BBB" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color="#555" style={styles.settingIcon} />
          <Text style={styles.settingText}>À propos</Text>
          <Ionicons name="chevron-forward" size={20} color="#BBB" />
        </TouchableOpacity>
      </View>
      
      {/* Version de l'application */}
      <Text style={styles.versionText}>BergerieApp v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F7',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    backgroundColor: '#E6EEF7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#3F72AF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3F72AF',
  },
  logoutText: {
    color: '#E74C3C',
  },
  bergeriesSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F72AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  bergeriesList: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  createBergerieButton: {
    backgroundColor: '#3F72AF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  createBergerieButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 30,
  },
});

export default ProfileScreen;