import { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Animated,
  useWindowDimensions
} from 'react-native';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import UserProfilePopover from '../components/UserProfilePopover';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import Popover from 'react-native-popover-view';
import Entypo from '@expo/vector-icons/Entypo';
import DotLoader from '../components/dot_loder';

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const theme = useTheme();
  const containerScale = useRef(new Animated.Value(1)).current;
  const listSlide = useRef(new Animated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    userItem: {
      padding: isLandscape ? 20 : 15,
      borderBottomWidth: 1,
      width: isLandscape ? '48%' : '100%',
      margin: isLandscape ? '1%' : 0,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
    },
    followSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    followButton: {
      padding: 8,
      borderRadius: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    followIcon: {
      marginRight: 4,
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    pendingText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    followingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    listContainer: {
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: isLandscape ? 10 : 0,
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const userList = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          if (doc.id !== currentUser.uid) {
            if (userData.followers?.includes(currentUser.uid) &&
              userData.following?.includes(currentUser.uid)) {
              userList.push(userData);
            }
          }
        });

        userList.sort((a, b) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return (b.lastSeen?.toDate?.() || 0) - (a.lastSeen?.toDate?.() || 0);
        });

        setUsers(userList);
      } catch (error) {
        console.error("Error processing users:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

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
        Animated.spring(listSlide, {
          toValue: isLandscape ? 1 : 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [isLandscape]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FFC107';
      default: return '#9E9E9E';
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) {
        return 'Just now';
      }
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const searchUsers = async (name) => {
    if (!name.trim()) {
      setSearchResults([]);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('displayName', '>=', name),
      where('displayName', '<=', name + '\uf8ff')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          results.push({ id: doc.id, ...doc.data() });
        }
      });
      setSearchResults(results);
    });

    return unsubscribe;
  };

  const sendFollowRequest = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pendingFollowRequests: arrayUnion(currentUser.uid)
      });
      Alert.alert('Success', 'Follow request sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send follow request');
    }
  };

  const acceptFollowRequest = async (userId) => {
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(currentUserRef, {
        followers: arrayUnion(userId),
        pendingFollowRequests: arrayRemove(userId)
      });

      const otherUserRef = doc(db, 'users', userId);
      await updateDoc(otherUserRef, {
        following: arrayUnion(currentUser.uid)
      });

      Alert.alert('Success', 'Follow request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  const startChat = (user) => {
    const currentUserDoc = users.find(u => u.id === currentUser.uid);

    const isUserFollowingMe = user.following?.includes(currentUser.uid);
    const amIFollowingUser = user.followers?.includes(currentUser.uid);

    if (!isUserFollowingMe || !amIFollowingUser) {
      Alert.alert('Error', 'You need to follow each other to start a chat');
      return;
    }

    navigation.navigate('Chat', { otherUser: user });
  };

  const handleLongPress = (user) => {
    setSelectedUser(user);
    setShowPopover(true);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
    setSelectedUser(null);
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

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderRadius: 8, marginVertical: 3, marginHorizontal: 5,
        }
      ]}
      onPress={() => startChat(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={2000}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ position: 'relative', marginRight: 15 }}>
          {item.photoURL ? (
            <Image
              source={{ uri: item.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
                {item.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.displayName}
          </Text>
        </View>
        <View>
          <Popover
            from={
              <TouchableOpacity style={{ padding: 10 }}>
                <Entypo name="dots-three-vertical" size={20} color={theme.colors.buttonText} style={{ marginRight: 8 }} />
              </TouchableOpacity>}
            style={{ backgroundColor: theme.colors.background }}
          >
            <ScrollView style={{ width: 150, backgroundColor: theme.colors.background }}>
              <TouchableOpacity style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5 }}>
                <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
                  Mute
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Popover>

        </View>
      </View>
      <View style={styles.followSection}>
        {item.pendingFollowRequests?.includes(currentUser.uid) ? (
          <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>
            Request Pending
          </Text>
        ) : item.followers?.includes(currentUser.uid) ? (
          <Text style={[styles.followingText, { color: theme.colors.success }]}>
            Following
          </Text>

        ) : (
          <TouchableOpacity
            onPress={() => sendFollowRequest(item.id)}
            style={[styles.followButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons
              name="person-add"
              size={16}
              color={theme.colors.buttonText}
              style={styles.followIcon}
            />
            <Text style={[styles.followButtonText, { color: theme.colors.buttonText }]}>
              Follow
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <DotLoader />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[
        styles.listContainer,
        {
          transform: [
            { scale: containerScale },
            {
              translateX: listSlide.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isLandscape ? 10 : 0]
              })
            }
          ]
        }
      ]}>
        {users.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' }}>
              No chats yet. Search for users and follow each other to start chatting.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: theme.colors.primary,
                padding: 15,
                borderRadius: 25,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={20} color={theme.colors.buttonText} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.colors.buttonText, fontSize: 16 }}>Search Users</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            key={isLandscape ? 'landscape' : 'portrait'}
            numColumns={isLandscape ? 2 : 1}
            columnWrapperStyle={isLandscape && styles.row}
          />
        )}
      </Animated.View>

      <UserProfilePopover
        visible={showPopover}
        user={selectedUser}
        onClose={handleClosePopover}
        onStartChat={() => {
          handleClosePopover();
          startChat(selectedUser);
        }}
        onViewFullProfile={() => {
          handleClosePopover();
          navigation.navigate('UserProfile', { userId: selectedUser.id });
        }}
      />
    </View>
  );
}