import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../theme/theme';

export default function Logo({ size = 120, showText = false, textStyle }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {theme.colors.text === '#ffffff' ? (
        <Image source={require('../assets/darklogo.png')} style={[styles.logo, { width: size, height: size }]} />
      ) : (
        <Image source={require('../assets/lightlogo.png')} style={[styles.logo, { width: size, height: size }]} />
      )}
      {showText && (
        <Text style={[
          styles.text,
          { color: theme.colors.text },
          textStyle
        ]}>
          TalkFlow
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 10,
  }
}); 