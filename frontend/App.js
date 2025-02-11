import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './firebaseConfig';  // Import Firebase authentication

// Import screens
import LoginPage from './screens/LoginPage';
import HomeScreen from './screens/HomeScreen';
import ForgetPassword from './screens/ForgetPassword';
import Register from './screens/Register';
import ProfilePage from './header/ProfilePage';
import ItemList from './screens/ItemList';
import ContactPage from './screens/ContactPage';
import CreateFormPage from './screens/CreateFormPage';
import MyListPage from './screens/MyListPage';
import FavouritesPage from './screens/FavouritesPage';
import PostDetailPage from './screens/PostDetailPage';
import UserPage from './screens/UserPage';
import AnnouncementsPage from './screens/AnnouncementPage';
import EditProfile from './screens/EditProfile';
import ReviewsPage from './screens/ReviewsPage';
import Settings from './screens/Settings';
import ProfilePictureUpload from './screens/ProfilePictureUpload';
import OptionsScreen from './screens/OptionsScreen';
import LostAndFoundScreen from './screens/LostAndFoundHomeScreen';
import SellTradeLendScreen from './screens/Sell-Trade-Lend-HomeScreen';

const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);  // Loading state while checking auth status
  const [user, setUser] = useState(null);  // Store the authenticated user

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);  // Set user based on auth state
      setLoading(false);  // Stop loading once auth state is ready
    });

    return () => unsubscribe();  // Cleanup listener on unmount
  }, []);

  if (loading) {
    return null;  // You can show a loading spinner or splash screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "OptionsScreen" : "Login"}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ProfilePage" component={ProfilePage} />
        <Stack.Screen name="ItemList" component={ItemList} />
        <Stack.Screen name="OptionsScreen" component={OptionsScreen} />
        <Stack.Screen name="LostAndFoundScreen" component={LostAndFoundScreen} />
        <Stack.Screen name="SellTradeLendScreen" component={SellTradeLendScreen} />
        <Stack.Screen name="CreateFormPage" component={CreateFormPage} />
        <Stack.Screen name="MyListPage" component={MyListPage} />
        <Stack.Screen name="FavouritesPage" component={FavouritesPage} />
        <Stack.Screen name="PostDetailPage" component={PostDetailPage} />
        <Stack.Screen name="ProfilePictureUpload" component={ProfilePictureUpload} />
        <Stack.Screen name="ContactPage" component={ContactPage} />
        <Stack.Screen name="AnnouncementsPage" component={AnnouncementsPage} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="ReviewsPage" component={ReviewsPage} />
        <Stack.Screen name="UserPage" component={UserPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
