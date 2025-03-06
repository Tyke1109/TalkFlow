import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';

const DotLoader = () => {
  const theme = useTheme();
  const dot1 = new Animated.Value(0);
  const dot1Color = dot1.interpolate({
    inputRange: [-10, 0],
    outputRange: [theme.colors.primary, theme.colors.text]
  });
  const dot1Rotation = new Animated.Value(0);

  const dot2 = new Animated.Value(0);
  const dot2Color = dot2.interpolate({
    inputRange: [-10, 0],
    outputRange: [theme.colors.primary, theme.colors.text]
  });
  const dot2Rotation = new Animated.Value(0);

  const dot3 = new Animated.Value(0);
  const dot3Color = dot3.interpolate({
    inputRange: [-10, 0],
    outputRange: [theme.colors.primary, theme.colors.text]
  });
  const dot3Rotation = new Animated.Value(0);

  const bounce = (dot, rotation) => {
    return Animated.sequence([
      Animated.parallel([
        Animated.timing(dot, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]);
  };

  useEffect(() => {
    const sequence = Animated.sequence([
      bounce(dot1, dot1Rotation),
      Animated.delay(100), 
      bounce(dot2, dot2Rotation),
      Animated.delay(100), 
      bounce(dot3, dot3Rotation),
    ]);

    
    Animated.loop(sequence).start();
  }, []);

  const styles = StyleSheet.create({
    loaderContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      margin: 6,
    },
    square: {
      width: 12,
      height: 12,
      margin: 6,
    },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 12,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      margin: 6,
    }
  });

  return (
    <View style={styles.loaderContainer}>
      <Animated.View
        style={[
          styles.dot, 
          { 
            backgroundColor: dot1Color,
            transform: [
              { translateY: dot1 },
              { rotate: dot1Rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              }) }
            ] 
          }
        ]}
      />
      <Animated.View
        style={[
          styles.square, 
          { 
            backgroundColor: dot2Color,
            transform: [
              { translateY: dot2 },
              { rotate: dot2Rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              }) }
            ] 
          }
        ]}
      />
      <Animated.View
        style={[
          styles.triangle, 
          { 
            borderBottomColor: dot3Color,
            transform: [
              { translateY: dot3 },
              { rotate: dot3Rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              }) }
            ] 
          }
        ]}
      />
    </View>
  );
};

export default DotLoader;