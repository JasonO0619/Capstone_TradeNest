import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './firebaseConfig';  


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
import EditPostPage from './screens/EditPostPage';
import ReviewsPage from './screens/ReviewsPage';
import Settings from './screens/Settings';
import ProfilePictureUpload from './screens/ProfilePictureUpload';
import OptionsScreen from './screens/OptionsScreen';
import LostAndFoundScreen from './screens/LostAndFoundHomeScreen';
import SellTradeLendScreen from './screens/Sell-Trade-Lend-HomeScreen';
import Search from './header/Search';
import Notifications from './header/Notifications';
import ContactBase from './screens/ContactBase';
import ContactLend from './screens/ContactLend';
import ContactSell from './screens/ContactSell';
import ContactTrade from './screens/ContactTrade';
import ContactLost from './screens/ContactLost';
import ConfirmTradeScreen from './screens/ConfirmTradeScreen';
import ClaimForm from './screens/ClaimForm';


const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);  
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);  
      setLoading(false);  
    });

    return () => unsubscribe();  
  }, []);

  if (loading) {
    return null;  
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={"Login"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ProfilePage" component={ProfilePage} />
        <Stack.Screen name="ItemList" component={ItemList} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="ClaimForm" component={ClaimForm} />
        <Stack.Screen name="ContactBase" component={ContactBase}/>
        <Stack.Screen name="ContactSell" component={ContactSell}/>
        <Stack.Screen name="ContactTrade" component={ContactTrade}/>
        <Stack.Screen name="ContactLend" component={ContactLend}/>
        <Stack.Screen name="ContactLost" component={ContactLost}/>
        <Stack.Screen name="ConfirmTradeScreen" component={ConfirmTradeScreen}/>
        <Stack.Screen name="Notifications" component={Notifications}/>
        <Stack.Screen name="EditPostPage" component={EditPostPage}/>
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
