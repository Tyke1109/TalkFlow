import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, FlatList, StyleSheet, ScrollView, Animated, useWindowDimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { auth, db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = auth.currentUser;
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestUsers, setRequestUsers] = useState([]);
  const [bio, setBio] = useState('');
  const [pressedButton, setPressedButton] = useState(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const containerScale = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;
  const bioScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      loadPendingRequests();

      const userRef = doc(db, 'users', currentUser.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists()) {
          setBio(doc.data().bio || '');
        }
      });
    }

    LayoutAnimation.configureNext(LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.scaleXY
    ));

    Animated.sequence([
      Animated.timing(containerScale, {
        toValue: 0.97,
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
        Animated.spring(contentSlide, {
          toValue: isLandscape ? 1 : 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(bioScale, {
          toValue: isLandscape ? 0.98 : 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [currentUser, isLandscape]);

  const loadPendingRequests = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData?.pendingFollowRequests?.length > 0) {
        setPendingRequests(userData.pendingFollowRequests);

        const userPromises = userData.pendingFollowRequests.map(uid =>
          getDoc(doc(db, 'users', uid))
        );

        const userDocs = await Promise.all(userPromises);
        const users = userDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRequestUsers(users);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const requestingUserRef = doc(db, 'users', userId);

      await updateDoc(currentUserRef, {
        followers: arrayUnion(userId),
        pendingFollowRequests: arrayRemove(userId)
      });

      await updateDoc(requestingUserRef, {
        following: arrayUnion(currentUser.uid)
      });

      Alert.alert('Success', 'Follow request accepted');
      loadPendingRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        pendingFollowRequests: arrayRemove(userId)
      });

      Alert.alert('Success', 'Follow request rejected');
      loadPendingRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        bio: bio
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: new Date()
      });

      await auth.signOut();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePressIn = (buttonId) => {
    setPressedButton(buttonId);
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressedButton(null);
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
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
      padding: isLandscape ? 24 : 16,
    },
    contentWrapper: {
      flex: 1,
      gap: 24,
    },
    profileHeader: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    avatar: {
      width: isLandscape ? 160 : 120,
      height: isLandscape ? 160 : 120,
      borderRadius: isLandscape ? 80 : 60,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 4,
      borderColor: theme.colors.background,
    },
    avatarText: {
      fontSize: isLandscape ? 60 : 45,
      fontWeight: 'bold',
      color: theme.colors.buttonText,
    },
    displayName: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    email: {
      fontSize: 15,
      opacity: 0.8,
      marginBottom: 16,
      textAlign: 'center',
    },
    mainContent: {
      gap: 20,
    },
    bioContainer: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    bioLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bioText: {
      fontSize: 16,
      lineHeight: 24,
    },
    bioInput: {
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
    },
    requestsContainer: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    requestsTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },
    requestItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    requestUser: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    requestAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    requestAvatarText: {
      fontSize: 18,
      fontWeight: '600',
    },
    requestUserInfo: {
      flex: 1,
    },
    requestUserName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButtons: {
      gap: 12,
    },
    button: {
      padding: 16,
      borderRadius: 25,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonText: {
      color: theme.colors.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.contentWrapper,
          {
            flexDirection: isLandscape ? 'row' : 'column',
            transform: [{ scale: containerScale }]
          }
        ]}>
          <Animated.View style={[
            styles.profileHeader,
            {
              width: isLandscape ? '35%' : '100%',
              transform: [{
                translateX: contentSlide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20]
                })
              }]
            }
          ]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
                {displayName[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.displayName, { color: theme.colors.text }]}>
              {displayName}
            </Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
              {email}
            </Text>
          </Animated.View>

          <Animated.View style={[
            styles.mainContent,
            {
              width: isLandscape ? '63%' : '100%',
              transform: [
                { scale: bioScale },
                {
                  translateX: contentSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20]
                  })
                }
              ]
            }
          ]}>
            <View style={[styles.bioContainer, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.bioLabel, { color: theme.colors.textSecondary }]}>Bio</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.bioInput, { color: theme.colors.text }]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  placeholder="Write something about yourself..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={[styles.bioText, { color: theme.colors.text }]}>
                  {bio || "No bio yet"}
                </Text>
              )}
            </View>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <Animated.View style={[
                styles.requestsContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  transform: [{ scale: bioScale }]
                }
              ]}>
                <Text style={[styles.requestsTitle, { color: theme.colors.text }]}>
                  Follow Requests
                </Text>
                <FlatList
                  data={requestUsers}
                  renderItem={({ item }) => (
                    <View style={styles.requestItem}>
                      <View style={styles.requestUser}>
                        <View style={styles.requestAvatar}>
                          <Text style={styles.requestAvatarText}>
                            {item.displayName?.[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.requestUserInfo}>
                          <Text style={styles.requestUserName}>{item.displayName}</Text>
                          <Text style={styles.requestUserEmail}>{item.email}</Text>
                        </View>
                      </View>
                      <View style={styles.requestActions}>
                        <Animated.View style={[
                          styles.actionButton,
                          styles.acceptButton,
                          {
                            transform: [{ scale: buttonScale }],
                            shadowOpacity: pressedButton === `accept-${item.id}` ? 0.4 : 0.25,
                            shadowRadius: pressedButton === `accept-${item.id}` ? 12 : 8,
                          }
                        ]}>
                          <TouchableOpacity
                            onPressIn={() => handlePressIn(`accept-${item.id}`)}
                            onPressOut={handlePressOut}
                            onPress={() => handleAcceptRequest(item.id)}
                          >
                            <Text style={[styles.actionButtonText, styles.acceptButtonText]}>Accept</Text>
                          </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleRejectRequest(item.id)}
                        >
                          <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </Animated.View>
            )}

            <View style={styles.actionButtons}>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.success }]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                onPress={handleSignOut}
              >
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}