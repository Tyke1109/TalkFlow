import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/theme';
import DotLoader from '../components/dot_loder';
import Logo from '../components/Logo';
import * as ImagePicker from 'expo-image-picker';

export default function SplashScreen() {
  const theme = useTheme();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Logo size={120} showText={true} />
        <View style={styles.loaderContainer}>
          <DotLoader />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  loaderContainer: {
    marginTop: 20,
  },
});