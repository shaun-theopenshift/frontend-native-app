import type { StackNavigationProp } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import auth0Config from './auth0Config';
import InboxScreen from './staff/InboxScreen';
import JobScreen from './staff/JobScreen';
import AccountScreen from './staff/AccountScreen.js';
import ProfileScreen from './staff/ProfileScreen.js';

// Get device width for responsive design
const { width } = Dimensions.get('window');

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fcf4f2',
    justifyContent: 'flex-start',
    overflow:"hidden"
  },
  splashImage: {
    width: '80%',
    height: '50%',
    resizeMode: 'contain',
  },
  buttonContainer: {
    marginTop: 150,
    width: '90%', // Use more of screen width
    maxWidth: 400, // Optional max width for large screens
    paddingHorizontal: 50,
  },
  commonButtonStyle: {
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60, // Uniform height for both buttons
    width: '100%', // Full width inside the container
  },
  getStartedButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334eb8',
    backgroundColor: '#334eb8', // Primary theme color
  },
  loginButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334eb8',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  getStartedButtonText: {
    color: '#fff',
  },
  loginButtonText: {
    fontSize: 18,
    letterSpacing: 1,
    color: '#334eb8',
    fontWeight: 'bold',
  },
  backgroundCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 600,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#334eb8',
    zIndex: 1,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 160, // space below the semi-circle
    width: '100%',
    zIndex :1,
    position:"relative",
  },
});

type RootStackParamList = {
  Splash: undefined;
  MainTabs: { access_token: string };
};

const Stack = createStackNavigator<RootStackParamList>();

interface SplashScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const images = [
    require('../assets/images/2.png'),
    require('../assets/images/1.png'),
    require('../assets/images/7.png'),
  ];

  // Animation of the background
  const curveScale = useRef(new Animated.Value(1)).current;
  const animateCurve = () => {
    Animated.timing(curveScale, {
      toValue: 5, // Large enough to cover screen
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      console.log('Animation done');
    });
  };

  // State to track the current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Ref for the opacity animation
  const opacity = useRef(new Animated.Value(1)).current;

  // Function to handle image transitions
  const transitionImages = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 0);
    });
  };

  // Auth0 setup
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'theopenshiftapp' });
  const discovery = {
    authorizationEndpoint: `https://${auth0Config.domain}/authorize`,
    tokenEndpoint: `https://${auth0Config.domain}/oauth/token`,
    revocationEndpoint: `https://${auth0Config.domain}/v2/logout`,
  };
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: auth0Config.clientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      extraParams: { audience: 'https://api.theopenshift.com' },
    },
    discovery
  );
  const handleLogin = async () => {
    const result = await promptAsync();
    if (result?.type === 'success') {
      const { access_token } = result.params;
      navigation.replace('MainTabs', { access_token });
    }
  };
  WebBrowser.maybeCompleteAuthSession();

  useEffect(() => {
    const intervalId = setInterval(() => {
      transitionImages();
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.backgroundCurve, { transform: [{ scale: curveScale }] }]}
      />

      <View style={styles.contentWrapper}>
        <Animated.Image
          source={images[currentImageIndex]}
          style={[styles.splashImage, { opacity }]}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.commonButtonStyle, styles.getStartedButton]}
            onPress={handleLogin}
          >
            <Text style={[styles.buttonText, styles.getStartedButtonText]}>
              Get Started
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.commonButtonStyle, styles.loginButton]}
            onPress={handleLogin}
          >
            <Text style={[styles.buttonText, styles.loginButtonText]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Tab = createBottomTabNavigator();

function MainTabs(props: any) {
  // Defensive: support both destructured and props.route
  const route = props.route || { params: {} };
  const { access_token } = route.params;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse';
          if (route.name === 'Profile') {
            iconName = 'person-circle-outline';
          } else if (route.name === 'Inbox') {
            iconName = 'mail-outline';
          } else if (route.name === 'Job') {
            iconName = 'briefcase-outline';
          } else if (route.name === 'Account') {
            iconName = 'settings-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ access_token }} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Job" component={JobScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}