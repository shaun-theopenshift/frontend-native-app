import type { StackNavigationProp } from "@react-navigation/stack";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import auth0Config from "./auth0Config";

import ManageJobScreen from "./organization/ManageJobScreen";
import ProfileScreenOrg from "./organization/ProfileScreenOrg.js";
import UserProfileScreen from "./organization/UserProfileScreen";
import RoleSelectionScreen from "./RoleSelectionScreen.js";
import AccountScreen from "./staff/AccountScreen.js";
import ComplianceScreen from "./staff/ComplianceScreen.js";
import IncidentReportScreen from "./staff/IncidentReportScreen";
import JobScreenStaff from "./staff/JobScreenStaff.js";
import ProfileCreateScreen from "./staff/ProfileCreateScreen.js";
import ProfileScreen from "./staff/ProfileScreen.js";
import StartJob from "./staff/StartJob.js";


const DOOR_ORANGE = "#fff5e2";
const SOFT_YELLOW = "#ffe4bc";
// Get device dimensions for responsive design
const { width, height } = Dimensions.get("window");

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fcf4f2",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  splashImage: {
    width: "80%",
    height: "50%",
    resizeMode: "contain",
  },
  buttonContainer: {
    marginTop: 50,
    width: "100%", 
    maxWidth: 500, 
    paddingHorizontal: 50,
  },
  commonButtonStyle: {
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 60, 
    width: "100%", 
  },
  getStartedButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3565b4",
    backgroundColor: "#3565b4", // Primary theme color
  },
  loginButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3565b4",
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Ubuntu-Medium",
    fontWeight: "bold",
  },
  getStartedButtonText: {
    color: "#fff",
  },
  loginButtonText: {
    fontSize: 18,
    letterSpacing: 1,
    color: "#3565b4",
    fontWeight: "bold",
    fontFamily: "Ubuntu-Medium",
  },
  backgroundCurve: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: 600,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: "#334eb8",
    zIndex: 1,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 160,
    width: "100%",
    zIndex: 1,
    position: "relative",
  },
  tagLine:{
    fontSize: 18,
    color: "#1a4154",
    textAlign: "center",
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
    fontFamily: "Ubuntu-Regular",
  },
  versionText: {
    fontSize: 12,
    color: "#1a4154",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Ubuntu-Regular",
  },
});

type RootStackParamList = {
  Splash: undefined;
  StartJob: { booking: any };
  Job: undefined;
  Account: undefined;
  Inbox: undefined;
  MainTabs: { access_token: string; role: string };
  RoleSelection: { access_token: string };
  Profile: { access_token: string };
  ProfileOrg: { access_token: string; role: string };
  ProfileCreate: { access_token: string };
  IncidentReport: undefined;
  serProfile: { userId: string };
  UserProfile: { userId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const JobStack = createStackNavigator();

function JobStackScreen() {
  return (
    <JobStack.Navigator screenOptions={{ headerShown: false }}>
      <JobStack.Screen name="Job" component={JobScreenStaff} />
      <JobStack.Screen name="StartJob" component={StartJob} />
    </JobStack.Navigator>
  );
}
function JobStackScreenOrg() {
  return (
    <JobStack.Navigator screenOptions={{ headerShown: false }}>
      <JobStack.Screen name="OrgJobList" component={ManageJobScreen} />
    </JobStack.Navigator>
  );
}

// const ComplianceScreen: React.FC = () => {
//   return (
//     <View
//       style={{
//         flex: 1,
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "#fcf4f2",
//       }}
//     >
//       <Text style={{ fontSize: 18, color: "#3565b4", fontFamily: "Ubuntu-Medium" }}>
//         Compliance
//       </Text>
//     </View>
//   );
// };

const SearchWorkerScreen: React.FC = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fcf4f2",
      }}
    >
      <Text style={{ fontSize: 18, color: "#3565b4", fontFamily: "Ubuntu-Medium" }}>
        Search Worker
      </Text>
    </View>
  );
};

interface MyTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const MyTabBar: React.FC<MyTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#3565b4",
        marginHorizontal: 5,
        marginBottom: 5,
        borderRadius: 40,
        paddingVertical: 12,
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };


        let iconName: string = "ellipse";
        switch (route.name) {
          case "Profile":
            iconName = "person-outline";
            break;
          case "Job":
          case "OrgJobs":
            iconName = "briefcase-outline";
            break;
          case "Account":
            iconName = "settings-outline";
            break;
          case "Compliance":
            // Use a generic shield icon to represent compliance tasks
            iconName = "shield-outline";
            break;
          case "OrgProfile":
            iconName = "business-outline";
            break;
          case "SearchWorker":
            iconName = "search-outline";
            break;
          default:
            iconName = "ellipse";
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: "center", justifyContent: "center",  }}
          >
            {isFocused ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#254a91",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                }}
              >
                <Ionicons name={iconName as any} size={18} color="#ffffff" />
                <Text style={{ color: "#ffffff", marginLeft: 6, fontSize: 12, fontFamily: "Ubuntu-Medium" }}>
                  {label}
                </Text>
              </View>
            ) : (
              <Ionicons name={iconName as any} size={22} color="#dbe4ff" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface SplashScreenProps {
  navigation: StackNavigationProp<RootStackParamList, "Splash">;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const images = [
    require("../assets/images/2.png"),
    require("../assets/images/1.png"),
    require("../assets/images/7.png"),
  ];


  // Animation of the background
  const curveScale = useRef(new Animated.Value(1)).current;
  const animateCurve = () => {
    Animated.timing(curveScale, {
      toValue: 5, // Large enough to cover screen
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      console.log("Animation done");
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
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "theopenshiftapp",
  });
  const discovery = {
    authorizationEndpoint: `https://${auth0Config.domain}/authorize`,
    tokenEndpoint: `https://${auth0Config.domain}/oauth/token`,
    revocationEndpoint: `https://${auth0Config.domain}/v2/logout`,
  };
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: auth0Config.clientId,
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Token,
      extraParams: {
        audience: "https://api.theopenshift.com",
        prompt: "login",
      },
    },
    discovery
  );
  const handleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === "success") {
        const { access_token } = result.params;
        await SecureStore.setItemAsync("access_token", access_token);
        animateCurve();
        fetch("https://api.theopenshift.com/v1/roles/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data && data.role) {
                if (data.role === "organisation") {
                  navigation.replace("ProfileOrg", {
                    access_token,
                    role: data.role,
                  });
                } else {
                  navigation.replace("MainTabs", {
                    access_token,
                    role: data.role,
                  });
                }
                return;
              }
            }
            navigation.replace("RoleSelection", { access_token });
          })
          .catch((e) => {
            console.log("Login Error", "Could not fetch user role.");
            navigation.replace("RoleSelection", { access_token });
          });
      } else {
        console.log("Login Cancelled", "User cancelled the login process.");
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log("Login Error", e.message || "Unknown error");
      } else {
        console.log("Login Error", "Unknown error");
      }
    }
  };
  WebBrowser.maybeCompleteAuthSession();

  useEffect(() => {
    const intervalId = setInterval(() => {
      transitionImages();
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const semicircleRadius = width * 0.13;

  return (
    <View style={[styles.container, { backgroundColor: DOOR_ORANGE }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Large right curve touching left edge */}
        <Path
  d={`
    M${width},0
    A${width} ${width} 0 0 0 0,${width * 0.7
    }
    L0,${width * 0.7}
    L${width},${width * 0.7}
    Z
  `}
  fill={SOFT_YELLOW}
/>
        <Rect
          x={0}
          y={width * 0.7}
          width={width}
          height={height - width * 0.7}
          fill={SOFT_YELLOW}
        />
        {/* Centered circle */}
       <Circle
  cx={width} 
  cy={height /2} 
  r={width * 0.2}
  fill={DOOR_ORANGE}
/>
      </Svg>

      <View style={styles.contentWrapper}>
        <Animated.Image
          source={images[currentImageIndex]}
          style={[styles.splashImage, { opacity }]}
        />
          <Text style={styles.tagLine}>
            Thoughtful care for every life - powered by purpose and intelligence
          </Text>
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
      <Text style={styles.versionText}>
            The Open Shift v1.0
          </Text>
    </View>
  );
};

function TabsWrapper({
  route,
}: {
  route: { params: { access_token: string; role: string } };
}) {
  const { access_token, role } = route.params;
  if (role === "organisation" || role === "org") {
    return <OrgTabs route={{ params: { access_token, role } }} />;
  }
  return <MainTabs route={{ params: { access_token, role } }} />;
}

function MainTabs({
  route,
}: {
  route: { params: { access_token: string; role: string } };
}) {
  const { access_token, role } = route.params;

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}
      // Provide simple header options; icons are handled in custom tab bar
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Profile" }}
      />
      <Tab.Screen
        name="Job"
        component={JobStackScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Jobs" }}
      />
      {/* New Compliance tab inserted before Account */}
      <Tab.Screen
        name="Compliance"
        component={ComplianceScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Compliant" }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Account" }}
      />
    </Tab.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function OrgTabs({
  route,
}: {
  route: { params: { access_token: string; role: string } };
}) {
  const { access_token, role } = route.params;

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}
      // Provide simple header options; icons are handled in custom tab bar
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="OrgProfile"
        component={ProfileScreenOrg}
        initialParams={{ access_token, role }}
        options={{ title: "Profile" }}
      />
      <Tab.Screen
        name="OrgJobs"
        component={JobStackScreenOrg}
        initialParams={{ access_token, role }}
        options={{ title: "Manage Jobs" }}
      />
      {/* New Search Worker tab */}
      <Tab.Screen
        name="SearchWorker"
        component={SearchWorkerScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Search" }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        initialParams={{ access_token, role }}
        options={{ title: "Account" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
        const [fontsLoaded] = useFonts({
    "Ubuntu-Regular": require("../assets/fonts/Ubuntu-Regular.ttf"),
    "Ubuntu-Medium": require("../assets/fonts/Ubuntu-Medium.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileOrg" component={ProfileScreenOrg} />
      <Stack.Screen name="MainTabs" component={TabsWrapper} />
      <Stack.Screen name="ProfileCreate" component={ProfileCreateScreen} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "User Profile" }} />
    </Stack.Navigator>
  );
}
