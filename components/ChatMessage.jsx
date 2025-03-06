import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/theme';

export default function ChatMessage({ message, isOwn }) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(isOwn ? 50 : -50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 15,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
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

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={{ padding: 8, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
        <Animated.View
          style={[
            {
              maxWidth: '80%',
              padding: 12,
              borderRadius: 20,
              marginBottom: 4,
              backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface,
              borderBottomRightRadius: isOwn ? 4 : 20,
              borderBottomLeftRadius: isOwn ? 20 : 4,
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
                { scale: pressScale },
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5]
                  })
                }
              ],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 2,
            }
          ]}
        >
          {message.imageUrl ? (
            <Image
              source={{ uri: message.imageUrl }}
              style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 4 }}
              resizeMode="cover"
            />
          ) : (
            <Animated.Text
              style={{
                fontSize: 16,
                marginBottom: 4,
                color: isOwn ? theme.colors.buttonText : theme.colors.text,
                opacity: contentOpacity
              }}
            >
              {message.text}
            </Animated.Text>
          )}

          <Animated.Text
            style={{
              fontSize: 11,
              color: isOwn ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary,
              textAlign: isOwn ? 'right' : 'left',
              opacity: contentOpacity
            }}
          >
            {message.timestamp?.toDate().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Animated.Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}