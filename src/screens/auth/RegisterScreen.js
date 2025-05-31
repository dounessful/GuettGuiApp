import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  // États pour les champs du formulaire
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Utilisation du contexte d'authentification
  const { signup } = useAuth();
  
  // Fonction d'inscription
  const handleRegister = async () => {
    // Validation des champs
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    try {
      setLoading(true);
      await signup(email, password, displayName);
      // La navigation vers l'écran principal se fait automatiquement 
      // via le navigateur principal lorsque currentUser est défini
    } catch (error) {
      let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mot de passe trop faible.';
      }
      
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo et titre */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/react-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Rejoignez BergerieApp</Text>
          <Text style={styles.subtitle}>Créez votre compte</Text>
        </View>
        
        {/* Formulaire d'inscription */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          {/* Bouton d'inscription */}
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Lien vers connexion */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
        
        {/* Texte de confidentialité */}
        <Text style={styles.privacyText}>
          En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F9F7F7',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3F72AF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DBE2EF',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#3F72AF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#555',
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: '#3F72AF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 20,
  },
});

export default RegisterScreen;