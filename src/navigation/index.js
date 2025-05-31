import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Contexte d'authentification
import { useAuth } from '../context/AuthContext';

// Écrans d'authentification
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Écrans principaux
import FeedScreen from '../screens/feed/FeedScreen';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import CreatePostScreen from '../screens/media/CreatePostScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Écrans de détail
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import BergerieDetailScreen from '../screens/bergerie/BergerieDetailScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import CreateBergerieScreen from '../screens/bergerie/CreateBergerieScreen';
import EditBergerieScreen from '../screens/bergerie/EditBergerieScreen';
import CommentsScreen from '../screens/feed/CommentsScreen';

// Stacks de navigation
const AuthStack = createStackNavigator();
const FeedStack = createStackNavigator();
const DiscoverStack = createStackNavigator();
const PostStack = createStackNavigator();
const NotificationsStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const MainTab = createBottomTabNavigator();

// Configuration des options de navigation
const screenOptions = {
  headerStyle: {
    backgroundColor: '#F9F7F7', // Fond clair
  },
  headerTintColor: '#3F72AF', // Couleur principale
  headerTitleStyle: {
    fontWeight: '600',
  },
  headerBackTitleVisible: false,
};

// Navigation pour les utilisateurs non authentifiés
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={screenOptions}>
    <AuthStack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ title: 'Connexion' }}
    />
    <AuthStack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{ title: 'Inscription' }}
    />
    <AuthStack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordScreen} 
      options={{ title: 'Mot de passe oublié' }}
    />
  </AuthStack.Navigator>
);

// Stack du flux d'actualités
const FeedStackNavigator = () => (
  <FeedStack.Navigator screenOptions={screenOptions}>
    <FeedStack.Screen 
      name="Feed" 
      component={FeedScreen} 
      options={{ title: 'Fil d\'actualités' }}
    />
    <FeedStack.Screen 
      name="PostDetail" 
      component={PostDetailScreen} 
      options={{ title: 'Publication' }}
    />
    <FeedStack.Screen 
      name="BergerieDetail" 
      component={BergerieDetailScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Bergerie' })}
    />
    <FeedStack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Profil' })}
    />
    <FeedStack.Screen 
      name="Comments" 
      component={CommentsScreen} 
      options={{ title: 'Commentaires' }}
    />
  </FeedStack.Navigator>
);

// Stack de découverte
const DiscoverStackNavigator = () => (
  <DiscoverStack.Navigator screenOptions={screenOptions}>
    <DiscoverStack.Screen 
      name="Discover" 
      component={DiscoverScreen} 
      options={{ title: 'Découvrir' }}
    />
    <DiscoverStack.Screen 
      name="BergerieDetail" 
      component={BergerieDetailScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Bergerie' })}
    />
    <DiscoverStack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Profil' })}
    />
    <DiscoverStack.Screen 
      name="PostDetail" 
      component={PostDetailScreen} 
      options={{ title: 'Publication' }}
    />
  </DiscoverStack.Navigator>
);

// Stack de création de post
const PostStackNavigator = () => (
  <PostStack.Navigator screenOptions={screenOptions}>
    <PostStack.Screen 
      name="CreatePost" 
      component={CreatePostScreen} 
      options={{ title: 'Nouvelle publication' }}
    />
  </PostStack.Navigator>
);

// Stack de notifications
const NotificationsStackNavigator = () => (
  <NotificationsStack.Navigator screenOptions={screenOptions}>
    <NotificationsStack.Screen 
      name="Notifications" 
      component={NotificationsScreen} 
      options={{ title: 'Notifications' }}
    />
    <NotificationsStack.Screen 
      name="PostDetail" 
      component={PostDetailScreen} 
      options={{ title: 'Publication' }}
    />
    <NotificationsStack.Screen 
      name="BergerieDetail" 
      component={BergerieDetailScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Bergerie' })}
    />
    <NotificationsStack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Profil' })}
    />
  </NotificationsStack.Navigator>
);

// Stack de profil
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={screenOptions}>
    <ProfileStack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Mon profil' }}
    />
    <ProfileStack.Screen 
      name="EditProfile" 
      component={EditProfileScreen} 
      options={{ title: 'Modifier le profil' }}
    />
    <ProfileStack.Screen 
      name="CreateBergerie" 
      component={CreateBergerieScreen} 
      options={{ title: 'Créer une bergerie' }}
    />
    <ProfileStack.Screen 
      name="EditBergerie" 
      component={EditBergerieScreen} 
      options={{ title: 'Modifier la bergerie' }}
    />
    <ProfileStack.Screen 
      name="BergerieDetail" 
      component={BergerieDetailScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Bergerie' })}
    />
    <ProfileStack.Screen 
      name="PostDetail" 
      component={PostDetailScreen} 
      options={{ title: 'Publication' }}
    />
  </ProfileStack.Navigator>
);

// Navigation principale avec onglets
const MainTabNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'FeedTab') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'DiscoverTab') {
          iconName = focused ? 'compass' : 'compass-outline';
        } else if (route.name === 'PostTab') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'NotificationsTab') {
          iconName = focused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={route.name === 'PostTab' ? size + 8 : size} color={color} />;
      },
      tabBarActiveTintColor: '#3F72AF',
      tabBarInactiveTintColor: '#888',
      tabBarStyle: {
        height: 60,
        paddingBottom: 10,
        paddingTop: 5,
      },
      headerShown: false,
    })}
  >
    <MainTab.Screen 
      name="FeedTab" 
      component={FeedStackNavigator} 
      options={{ title: 'Accueil' }}
    />
    <MainTab.Screen 
      name="DiscoverTab" 
      component={DiscoverStackNavigator} 
      options={{ title: 'Découvrir' }}
    />
    <MainTab.Screen 
      name="PostTab" 
      component={PostStackNavigator} 
      options={{ 
        title: 'Publier',
        tabBarLabel: () => null // Pas de texte sous l'icône
      }}
    />
    <MainTab.Screen 
      name="NotificationsTab" 
      component={NotificationsStackNavigator} 
      options={{ title: 'Notifications' }}
    />
    <MainTab.Screen 
      name="ProfileTab" 
      component={ProfileStackNavigator} 
      options={{ title: 'Profil' }}
    />
  </MainTab.Navigator>
);

// Navigateur principal de l'application
const AppNavigator = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null; // Ou un écran de chargement
  }

  return (
    <NavigationContainer>
      {currentUser ? <MainTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};
export default AppNavigator;