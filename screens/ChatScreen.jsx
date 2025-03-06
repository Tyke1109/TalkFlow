import { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Animated,
    Easing,
    ImageBackground,
    LayoutAnimation,
    UIManager,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db, auth, storage } from '../firebase/config';
import ChatMessage from '../components/ChatMessage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatScreen({ route }) {
    const { otherUser } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [placeholder, setPlaceholder] = useState('');
    const fullPlaceholder = "Type a message...";
    const placeholderIndex = useRef(0);
    const currentUser = auth.currentUser;
    const navigation = useNavigation();
    const theme = useTheme();
    const flatListRef = useRef(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isLandscape = screenWidth > screenHeight;
    const [isUploading, setIsUploading] = useState(false);

    const headerScale = useRef(new Animated.Value(0.95)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const inputScale = useRef(new Animated.Value(1)).current;

    const onlinePulse = useRef(new Animated.Value(1)).current;
    const sendWave = useRef(new Animated.Value(0)).current;
    const scrollIndicator = useRef(new Animated.Value(1)).current;

    const containerScale = useRef(new Animated.Value(1)).current;
    const contentSlide = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!currentUser) return;

        const chatId = [currentUser.uid, otherUser.id].sort().join('_');

        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messageList = [];
            snapshot.forEach((doc) => {
                messageList.push({ id: doc.id, ...doc.data() });
            });
            setMessages(messageList);
        });

        return () => unsubscribe();
    }, [currentUser, otherUser]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 10 }}>
                        <View style={{
                            width: 35,
                            height: 35,
                            borderRadius: 17.5,
                            backgroundColor: theme.colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: theme.colors.buttonText, fontSize: 16, fontWeight: 'bold' }}>
                                {otherUser.displayName?.[0]?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View>
                        <Text style={styles.headerUserName}>{otherUser.displayName}</Text>
                        <View style={styles.statusContainer}>
                            <Animated.View style={[
                                styles.statusDot,
                                {
                                    backgroundColor: otherUser.status === 'online' ? theme.colors.success : theme.colors.textSecondary,
                                    transform: [{ scale: onlinePulse }]
                                }
                            ]} />
                            <Text style={styles.headerUserStatus}>
                                {otherUser.status === 'online' ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                </View>
            ),
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 10 }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
            ),
            headerStyle: {
                backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerShadowVisible: false,
        });

        Animated.parallel([
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }),
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            })
        ]).start();
    }, [navigation, otherUser, theme]);

    useEffect(() => {
        if (otherUser.status === 'online') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(onlinePulse, {
                        toValue: 1.2,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(onlinePulse, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        }
    }, [otherUser.status]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (placeholderIndex.current < fullPlaceholder.length) {
                setPlaceholder(prev => prev + fullPlaceholder[placeholderIndex.current]);
                placeholderIndex.current++;
            } else {
                setTimeout(() => {
                    setPlaceholder('');
                    placeholderIndex.current = 0;
                }, 2000);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
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
                })
            ])
        ]).start();
    }, [isLandscape]);

    const sendMessage = async () => {
        if (newMessage.trim() === '' || !currentUser) return;

        const chatId = [currentUser.uid, otherUser.id].sort().join('_');

        try {
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text: newMessage,
                sender: currentUser.email,
                userId: currentUser.uid,
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(inputScale, {
                toValue: 0.95,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }),
            Animated.timing(sendWave, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.spring(inputScale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true
        }).start();
    };

    const handleScroll = (event) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        if (scrollY > 0) {
            Animated.spring(scrollIndicator, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(scrollIndicator, {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    };

    async function uploadImage(uri) {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const imageRef = ref(storage, `images/${Date.now()}`);
            await uploadBytes(imageRef, blob);

            return await getDownloadURL(imageRef);
        } catch (error) {
            alert("Error", "Failed to upload image. Please try again.");
            console.error(error);
            throw error;
        }
    }

    const handleImagePick = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 4],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0].uri) {
                setIsUploading(true);
                const imageUrl = await uploadImage(result.assets[0].uri);
                // Simulate image upload process
                setTimeout(async () => {
                    const chatId = [currentUser.uid, otherUser.id].sort().join('_');
                    await addDoc(collection(db, 'chats', chatId, 'messages'), {
                        userId: currentUser.uid,
                        timestamp: serverTimestamp(),
                        imageUrl: imageUrl,
                    });
                    setIsUploading(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
            setIsUploading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        messagesContainer: {
            flex: 1,
            maxWidth: isLandscape ? 800 : '100%',
            alignSelf: 'center',
            width: '100%',
        },
        messageList: {
            flex: 1,
            paddingHorizontal: isLandscape ? 20 : 10,
        },
        inputContainer: {
            flexDirection: 'row',
            padding: isLandscape ? 16 : 10,
            borderTopWidth: 1,
            alignItems: 'center',
            minHeight: 60,
            maxWidth: isLandscape ? 800 : '100%',
            alignSelf: 'center',
            width: '100%',
        },
        input: {
            flex: 1,
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 8,
            marginRight: 10,
            maxHeight: 100,
            minHeight: 40,
            fontSize: isLandscape ? 16 : 14,
        },
        sendButton: {
            width: isLandscape ? 48 : 44,
            height: isLandscape ? 48 : 44,
            borderRadius: isLandscape ? 24 : 22,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerUserName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        statusContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 6,
        },
        headerUserStatus: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        waveEffect: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: isLandscape ? 24 : 22,
            backgroundColor: theme.colors.primary,
        },
        scrollIndicator: {
            position: 'absolute',
            bottom: 80,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        contentContainer: {
            flex: 1,
        },
        imageButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        messageImage: {
            width: 200,
            height: 200,
            borderRadius: 12,
            marginVertical: 2,
        },
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ImageBackground
                source={require('../assets/lightbgc.png')}
                style={[styles.container, { opacity: 0.99 }]}
                resizeMode='cover'
            >
                <Animated.View style={[
                    styles.contentContainer,
                    {
                        transform: [
                            { scale: containerScale },
                            {
                                translateX: contentSlide.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, isLandscape ? 20 : 0]
                                })
                            }
                        ]
                    }
                ]}>
                    <View style={styles.messagesContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={({ item }) => (
                                <ChatMessage
                                    message={item}
                                    isOwn={item.userId === currentUser?.uid}
                                />
                            )}
                            keyExtractor={(item) => item.id}
                            inverted
                            style={styles.messageList}
                            onScroll={handleScroll}
                            onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                        />
                    </View>
                </Animated.View>
            </ImageBackground>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border
                }]}>
                    <TouchableOpacity
                        style={[styles.imageButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleImagePick}
                    >
                        <Ionicons name="image-outline" size={24} color={theme.colors.buttonText} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                        }]}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />

                    <Animated.View style={{ transform: [{ scale: inputScale }] }}>
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                            onPress={sendMessage}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                        >
                            {isUploading ? (
                                <ActivityIndicator color={theme.colors.buttonText} />
                            ) : (
                                <Ionicons name="send" size={24} color={theme.colors.buttonText} />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>

            <Animated.View style={[
                styles.headerContainer,
                {
                    opacity: headerOpacity,
                    transform: [{ scale: headerScale }]
                }
            ]}>
            </Animated.View>

            <Animated.View style={[
                styles.scrollIndicator,
                {
                    opacity: scrollIndicator,
                    transform: [
                        {
                            translateY: scrollIndicator.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }
                    ]
                }
            ]}>
                <TouchableOpacity
                    onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="chevron-down" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}