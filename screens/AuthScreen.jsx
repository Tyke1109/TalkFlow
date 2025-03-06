import { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Image,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { useTheme } from '../theme/theme';
import DotLoader from '../components/dot_loder';
import Logo from '../components/Logo';
import Ionicons from 'react-native-vector-icons/Ionicons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

async function generateUniqueUsername() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';

  let isUnique = false;
  let username = '';

  while (!isUnique) {
    username = letters[Math.floor(Math.random() * letters.length)].toUpperCase();

    const letterCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < letterCount; i++) {
      username += letters[Math.floor(Math.random() * letters.length)];
    }

    username += '_';

    const digitLength = Math.floor(Math.random() * 6) + 1;
    const minNum = Math.pow(10, digitLength - 1);
    const maxNum = Math.pow(10, digitLength) - 1;
    const randomNum = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    username += randomNum;

    const q = query(
      collection(db, 'users'),
      where('displayName', '==', username)
    );
    const querySnapshot = await getDocs(q);
    isUnique = querySnapshot.empty;
  }

  return username;
}

export default function AuthScreen() {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const containerScale = useRef(new Animated.Value(1)).current;
  const formPosition = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.scaleXY
    ));

    Animated.sequence([
      Animated.timing(containerScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.parallel([
        Animated.spring(containerScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(formPosition, {
          toValue: isLandscape ? 1 : 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();

    generateUniqueUsername().then(newUsername => setUsername(newUsername));
  }, [isLandscape]);

  const regenerateUsername = async () => {
    const newUsername = await generateUniqueUsername();
    setUsername(newUsername);
  };

  const checkDuplicateName = async (name) => {
    const q = query(
      collection(db, 'users'),
      where('displayName', '==', name)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleAuth = async (isSigningUp) => {
    if (!email || !password || (isSigningUp && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSigningUp) {
      if (!username.startsWith('') || username.length !== 8) {
        Alert.alert('Error', 'Invalid username format');
        return;
      }
    }

    try {
      let userCredential;

      if (isSigningUp) {
        const isDuplicate = await checkDuplicateName(username);
        if (isDuplicate) {
          Alert.alert('Error', 'This username is already taken. Please generate a new one.');
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(userCredential.user, {
          displayName: username
        });

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: username,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          photoURL: null,
          status: 'online',
          userId: userCredential.user.uid,
          followers: [],
          following: [],
          pendingFollowRequests: []
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lastSeen: serverTimestamp(),
          status: 'online'
        }, { merge: true });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        Alert.alert('Error', 'Image upload is not available.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    contentContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    formContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputContainer: {
      width: '100%',
      maxWidth: 400,
      gap: 15,
    },
    input: {
      width: '100%',
      height: 50,
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 20,
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 10,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
      backgroundColor: '#666',
    },
    activeButton: {
      backgroundColor: '#8A2BE2',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    usernameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    regenerateButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[
          styles.contentContainer,
          {
            flexDirection: isLandscape ? 'row' : 'column',
            transform: [{ scale: containerScale }]
          }
        ]}>
          <View style={[
            styles.logoContainer,
            { width: isLandscape ? '45%' : '100%' }
          ]}>
            <Logo />
          </View>

          <Animated.View style={[
            styles.formContainer,
            {
              width: isLandscape ? '55%' : '100%',
              transform: [{
                translateX: formPosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20]
                })
              }]
            }
          ]}>
            <View style={styles.inputContainer}>
              {isSignUp && (
                <View style={styles.usernameContainer}>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      flex: 1
                    }]}
                    placeholder="Username"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={username}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={[styles.regenerateButton, { backgroundColor: theme.colors.primary }]}
                    onPress={regenerateUsername}
                  >
                    <Ionicons name="refresh" size={20} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, !isSignUp && styles.activeButton]}
                onPress={() => {
                  setIsSignUp(false);
                  handleAuth(false);
                }}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isSignUp && styles.activeButton]}
                onPress={() => {
                  setIsSignUp(true);
                  handleAuth(true);
                }}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}