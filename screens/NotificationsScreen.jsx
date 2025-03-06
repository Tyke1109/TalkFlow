import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { db, auth } from '../firebase/config';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const containerWidth = useRef(new Animated.Value(screenWidth)).current;
  const contentScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.scaleXY
    ));

    Animated.parallel([
      Animated.spring(containerWidth, {
        toValue: screenWidth,
        friction: 8,
        tension: 40,
        useNativeDriver: false
      }),
      Animated.sequence([
        Animated.timing(contentScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();

    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      try {
        const userData = snapshot.data();
        const notificationsList = [];

        if (userData?.pendingFollowRequests?.length > 0) {
          for (const uid of userData.pendingFollowRequests) {
            const requesterRef = doc(db, 'users', uid);
            const requesterDoc = await getDoc(requesterRef);
            if (requesterDoc.exists()) {
              notificationsList.push({
                id: `request_${uid}`,
                type: 'follow_request',
                timestamp: new Date(),
                sender: {
                  id: uid,
                  ...requesterDoc.data()
                }
              });
            }
          }
        }

        notificationsList.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notificationsList);
        setLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser, isLandscape, screenWidth]);

  const handleAcceptRequest = async (senderId) => {
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const senderRef = doc(db, 'users', senderId);

      await updateDoc(currentUserRef, {
        followers: arrayUnion(senderId),
        pendingFollowRequests: arrayRemove(senderId)
      });

      await updateDoc(senderRef, {
        following: arrayUnion(currentUser.uid)
      });

      Alert.alert('Success', 'Follow request accepted');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (senderId) => {
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        pendingFollowRequests: arrayRemove(senderId)
      });

      Alert.alert('Success', 'Follow request rejected');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
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

  const renderNotification = ({ item }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          transform: [{ scale: contentScale }],
          width: isLandscape ? '50%' : '100%',
          alignSelf: isLandscape ? 'flex-start' : 'center'
        }
      ]}
    >
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.sender.id })}
      >
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
            {item.sender.displayName?.[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.sender.displayName}
          </Text>
          <Text style={[styles.notificationText, { color: theme.colors.textSecondary }]}>
            wants to follow you
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.colors.success }]}
          onPress={() => handleAcceptRequest(item.sender.id)}
        >
          <Ionicons name="checkmark" size={20} color={theme.colors.buttonText} />
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleRejectRequest(item.sender.id)}
        >
          <Ionicons name="close" size={20} color={theme.colors.buttonText} />
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Reject</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.contentContainer, { width: containerWidth }]}>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          key={isLandscape ? 'landscape' : 'portrait'}
          numColumns={isLandscape ? 2 : 1}
          columnWrapperStyle={isLandscape && styles.row}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No notifications
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  row: {
    flex: 1,
    justifyContent: 'space-around',
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    margin: 8,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
  },
});