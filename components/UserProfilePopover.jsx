import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
  LayoutAnimation,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';

export default function UserProfilePopover({ visible, user, onClose, onStartChat, onViewFullProfile, isLandscape }) {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const avatarRotate = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      LayoutAnimation.configureNext(LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleXY
      ));

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: isLandscape ? 1.05 : 1,
            friction: 12,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        ])
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          friction: 12,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, isLandscape]);

  const spin = avatarRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.9,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleViewProfile = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
      onViewFullProfile();
    });
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

  if (!user) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.popover,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              opacity: fadeAnim,
              width: isLandscape ? '50%' : '80%',
              transform: [
                { scale: scaleAnim },
                {
                  translateX: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, isLandscape ? 20 : 0]
                  })
                }
              ]
            }
          ]}
        >
          <Pressable>
            <View style={styles.content}>
              <Animated.View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.colors.primary,
                    transform: [{ rotate: spin }]
                  }
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.colors.buttonText }]}>
                  {user.displayName?.[0]?.toUpperCase()}
                </Text>
              </Animated.View>

              <Animated.Text
                style={[
                  styles.name,
                  {
                    color: theme.colors.text,
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                {user.displayName}
              </Animated.Text>

              <Animated.View
                style={[
                  styles.stats,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                    {user.followers?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Followers
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                    {user.following?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Following
                  </Text>
                </View>
              </Animated.View>

              {user.bio && (
                <Animated.Text
                  style={[
                    styles.bio,
                    {
                      color: theme.colors.text,
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }]
                    }
                  ]}
                >
                  {user.bio}
                </Animated.Text>
              )}

              <View style={styles.buttons}>
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={onStartChat}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Ionicons
                      name="chatbubble"
                      size={20}
                      color={theme.colors.buttonText}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                      Message
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.success }]}
                    onPress={handleViewProfile}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color={theme.colors.buttonText}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popover: {
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 340,
  },
  content: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});