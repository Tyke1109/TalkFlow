import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  LayoutAnimation,
  Animated
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  // Add animation refs
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const resultsSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.scaleXY
    ));

    Animated.sequence([
      Animated.timing(searchBarScale, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.parallel([
        Animated.spring(searchBarScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(resultsSlide, {
          toValue: isLandscape ? 1 : 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [isLandscape]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const searchResults = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          searchResults.push({ id: doc.id, ...doc.data() });
        }
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border
      }]}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
            {item.displayName?.[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.displayName}
          </Text>

          {/* Follow Status/Button */}
          <View style={styles.followContainer}>
            {item.pendingFollowRequests?.includes(currentUser.uid) ? (
              <View style={styles.pendingContainer}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>
                  {' Request Pending'}
                </Text>
              </View>
            ) : item.followers?.includes(currentUser.uid) ? (
              <View style={[styles.followingBadge, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.colors.success}
                />
                <Text style={[styles.followingText, { color: theme.colors.success }]}>
                  {' Following'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.followButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleFollowRequest(item.id)}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color={theme.colors.buttonText}
                />
                <Text style={[styles.followButtonText, { color: theme.colors.buttonText }]}>
                  Follow
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleFollowRequest = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pendingFollowRequests: arrayUnion(currentUser.uid)
      });
      Alert.alert('Success', 'Follow request sent!');

      handleSearch();
    } catch (error) {
      Alert.alert('Error', 'Failed to send follow request');
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
    searchContainer: {
      padding: isLandscape ? 16 : 10,
      maxWidth: isLandscape ? 800 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 12,
      width: '100%',
      height: 46,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      fontSize: isLandscape ? 16 : 14,
      padding: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.6,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
    },
    userItem: {
      padding: isLandscape ? 20 : 15,
      maxWidth: isLandscape ? 800 : '100%',
      alignSelf: 'center',
      width: '100%',
      borderBottomWidth: 1,
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
      marginRight: 15,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    userDetails: {
      flex: 1,
      justifyContent: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    followContainer: {
      marginTop: 8,
    },
    followButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
    },
    followingBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
      alignSelf: 'flex-start',
    },
    followingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    pendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pendingText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[
        styles.searchContainer,
        { transform: [{ scale: searchBarScale }] }
      ]}>
        <View style={[styles.searchInputWrapper, {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }]}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {
              color: theme.colors.text
            }]}
            placeholder="Search by username..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setResults([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.View style={[
        styles.resultsContainer,
        {
          transform: [
            {
              translateX: resultsSlide.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isLandscape ? 15 : 0]
              })
            }
          ]
        }
      ]}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            key={isLandscape ? 'landscape' : 'portrait'}
            numColumns={isLandscape ? 2 : 1}
            columnWrapperStyle={isLandscape && styles.row}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={searchQuery ? "search" : "people-outline"}
                  size={48}
                  color={theme.colors.textSecondary}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {searchQuery ? 'No users found' : 'Search for users by their username'}
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}