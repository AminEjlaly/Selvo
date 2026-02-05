// src/navigation/AppNavigator.js
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// صفحات اپت رو وارد کن 👇
import CartScreen from "../screens/CartScreen";
import DeliveryOrdersScreen from "../screens/DeliveryOrdersScreen"; // ✅ اضافه کردن
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 🔹 تب‌های پایین صفحه برای کاربران لاگین‌شده
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Cart") iconName = "cart-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          else if (route.name === "DeliveryOrders") iconName = "exit-outline"; // ✅ برای تحویل‌دار
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {/* ✅ اضافه کردن تب برای تحویل‌دار - اما بهتر است شرطی باشد */}
      <Tab.Screen 
        name="DeliveryOrders" 
        component={DeliveryOrdersScreen}
      />
    </Tab.Navigator>
  );
}

// 🔹 استک نویگیتور برای صفحاتی که در تب‌ها نیستند
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* ✅ ثبت صفحه DeliveryOrdersScreen در استک */}
      <Stack.Screen 
        name="DeliveryOrdersScreen" 
        component={DeliveryOrdersScreen} 
      />
    </Stack.Navigator>
  );
}

// 🔹 ناویگیشن اصلی: اگر لاگین کرده → تب‌ها، وگرنه → لاگین
export default function AppNavigator({ isLoggedIn }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainStack" component={MainStack} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}