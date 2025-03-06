import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Easing,
  useWindowDimensions
} from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useTheme } from '../theme/theme';

export default function UserProfile({ route, navigation }) {
  const theme = useTheme();
  const { userId } = route.params;
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const isOwnProfile = userId === currentUser.uid;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexDirection: isLandscape ? 'row' : 'column',
      padding: isLandscape ? 24 : 16,
      flexWrap: 'wrap',
    },
    profileHeader: {
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      width: isLandscape ? '40%' : '100%',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    avatarText: {
      fontSize: 40,
      fontWeight: 'bold',
    },
    displayName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    email: {
      fontSize: 16,
    },
    statsContainer: {
      width: isLandscape ? '40%' : '100%',
      padding: 20,
      borderRadius: 16,
      marginBottom: isLandscape ? 0 : 16,
    },
    contentContainer: {
      width: isLandscape ? '58%' : '100%',
      marginLeft: isLandscape ? '2%' : 0,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 14,
    },
    actionButtons: {
      padding: 20,
      gap: 10,
    },
    button: {
      padding: 15,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    bioContainer: {
      padding: 20,
      borderBottomWidth: 1,
    },
    bioLabel: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '500',
    },
    bioText: {
      fontSize: 16,
      lineHeight: 22,
    },
  });

  useEffect(() => {
    loadUserProfile();

    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRequest = async () => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pendingFollowRequests: arrayUnion(currentUser.uid)
      });
      Alert.alert('Success', 'Follow request sent!');
      loadUserProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to send follow request');
    }
  };

  const handleUnfollow = async () => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        followers: arrayRemove(currentUser.uid)
      });

      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayRemove(userId)
      });

      loadUserProfile();
      Alert.alert('Success', 'Unfollowed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to unfollow user');
    }
  };

  const handleFollowBack = async () => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        followers: arrayUnion(currentUser.uid)
      });

      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayUnion(userId)
      });

      loadUserProfile();
      Alert.alert('Success', 'Followed back successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to follow back user');
    }
  };

  const startChat = () => {
    if (!userProfile.followers?.includes(currentUser.uid) ||
      !userProfile.following?.includes(currentUser.uid)) {
      Alert.alert('Error', 'You need to follow each other to start a chat');
      return;
    }
    navigation.navigate('Chat', { otherUser: userProfile });
  };

  const renderActionButton = () => {
    if (isOwnProfile) return null;

    const theyFollowYou = userProfile.following?.includes(currentUser.uid);
    const youFollowThem = userProfile.followers?.includes(currentUser.uid);
    const isPending = userProfile.pendingFollowRequests?.includes(currentUser.uid);

    if (isPending) {
      return (
        <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
          Follow Request Pending
        </Text>
      );
    }

    if (theyFollowYou && !youFollowThem) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleFollowBack}
        >
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
            Follow Back
          </Text>
        </TouchableOpacity>
      );
    }

    if (theyFollowYou && youFollowThem) {
      return (
        <>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.success }]}
            onPress={startChat}
          >
            <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
              Start Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            onPress={() => {
              Alert.alert(
                'Unfollow User',
                'Are you sure you want to unfollow this user?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Unfollow', onPress: handleUnfollow, style: 'destructive' }
                ]
              );
            }}
          >
            <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
              Unfollow
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (!theyFollowYou && youFollowThem) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={() => {
            Alert.alert(
              'Unfollow User',
              'Are you sure you want to unfollow this user?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Unfollow', onPress: handleUnfollow, style: 'destructive' }
              ]
            );
          }}
        >
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
            Unfollow
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleFollowRequest}
      >
        <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
          Follow
        </Text>
      </TouchableOpacity>
    );
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileHeader, {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border
        }]}>
          <Animated.View style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
              {userProfile?.displayName?.[0]?.toUpperCase()}
            </Text>
          </Animated.View>

          <Animated.Text style={[
            styles.displayName,
            {
              color: theme.colors.text,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {userProfile?.displayName}
          </Animated.Text>
        </View>

        <View style={styles.contentContainer}>
          {userProfile.bio && (
            <View style={[styles.bioContainer, {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border
            }]}>
              <Text style={[styles.bioLabel, { color: theme.colors.textSecondary }]}>Bio</Text>
              <Text style={[styles.bioText, { color: theme.colors.text }]}>
                {userProfile.bio}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {renderActionButton()}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}