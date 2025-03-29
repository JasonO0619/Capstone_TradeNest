import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditPostPage from '../screens/EditPostPage';
import ItemList from '../screens/ItemList';
import { useFocusEffect } from '@react-navigation/native';
import BASE_URL from '../BaseUrl';



const HeadNav = ({ navigation, currentScreen }) => {

  const [profilePic, setProfilePic] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profilePicTimestamp, setProfilePicTimestamp] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[HeadNav] useFocusEffect: Fetching profile picture');
  
      const fetchProfilePicture = async () => {
        try {
          const cached = await AsyncStorage.getItem('profilePic');
          if (cached) {
            setProfilePic(cached);
          }
  
          const token = await AsyncStorage.getItem('userToken');
          if (!token) return;
  
          const response = await fetch(`${BASE_URL}/api/users/myProfile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          if (response.ok) {
            const data = await response.json();
            const pic = data.profilePicture || DEFAULT_PROFILE_PIC_URL;
          
            if (pic !== profilePic) {
            setProfilePic(pic)
            setProfilePicTimestamp(Date.now());
            await AsyncStorage.setItem('profilePic', pic);
            } 
          } else {
            console.warn('[HeadNav] Failed to fetch profile (response not OK)');
          }
        } catch (err) {
          console.error('[HeadNav] Error fetching user avatar:', err);
        }
      };
  
      fetchProfilePicture();
    }, [])
  );

  useEffect(() => {
    console.log('[HeadNav] useEffect: Listening for notifications...');
    let isMounted = true;

    const listenForNotifications = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const userId = JSON.parse(atob(token.split('.')[1])).user_id;

      const q = query(
        collection(firestore, 'conversations'),
        where('participants', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;

        let count = 0;
snapshot.forEach((doc) => {
  const data = doc.data();
  if (
    data.lastMessage &&
    data.isRead?.[userId] === false &&
    data.lastMessageSenderId !== userId
  ) {
    count += 1;
  }
});
setUnreadCount(count);
      });

      return () => unsubscribe();
    };

    listenForNotifications();

    return () => {
      console.log('[HeadNav] Cleaning up notification listener');
      isMounted = false;
    };
  }, []);

  const isBackButton = ['Search', 'ProfilePage', 'CreateFormPage'].includes(currentScreen);

  const handleHomeOrBackPress = () => {
    if (isBackButton) {
      navigation.goBack();
    } else {
      if (currentScreen === "LostAndFoundScreen") {
        navigation.replace("SellTradeLendScreen");
      } else {
        navigation.replace("LostAndFoundScreen");
      }
    }
  };

  const screenTitleMap = {
    SellTradeLendScreen: "Marketplace",
    LostAndFoundScreen: "Lost & Found",
    Search: "Search Items",
    ProfilePage: "Your Profile",
    CreateFormPage: "Create a Post",
    OptionsScreen: "Choose a Section",
    EditPostPage: "Edit your Post",
    ItemList: "Item Lists"
  };

  const screenTitle = screenTitleMap[currentScreen] || "";

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleHomeOrBackPress}>
        <FontAwesome
          name={isBackButton ? "chevron-left" : "home"}
          size={30}
          color="#333"
          style={styles.icon}
        />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>{screenTitle}</Text>

      <View style={styles.rightIcons}>
        {currentScreen !== "Search" && (
          <TouchableOpacity onPress={() => navigation.navigate("Search")}>
            <Ionicons name="search" size={30} color="#333" style={styles.icon} />
          </TouchableOpacity>
        )}

        {currentScreen !== "CreateFormPage" && currentScreen !== "OptionsScreen" && (
          <TouchableOpacity onPress={() => navigation.navigate("CreateFormPage")}>
            <MaterialIcons name="add-box" size={30} color="#FF4081" style={styles.icon} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <View>
            <Ionicons name="notifications-outline" right='4' size={30} color="#333" style={styles.icon} />
            {unreadCount > 0 && (
  <View style={styles.notificationBadge}>
    <Text style={styles.notificationCount}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </Text>
  </View>
)}
          </View>
        </TouchableOpacity>

        {currentScreen !== "ProfilePage" && (
          <TouchableOpacity onPress={() => navigation.navigate("ProfilePage")}>
            {profilePic ? (
             <Image
             source={{ uri: profilePicTimestamp ? `${profilePic}?t=${profilePicTimestamp}` : profilePic }}
             style={styles.profileImage}
           />
            ) : (
              <Ionicons name="person-circle" size={32} color="#8A2BE2" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between', 
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 10, 
    height: '12%',
    paddingTop: 25
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  rightIcons: {
    flexDirection: 'row', 
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 16, 
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HeadNav;
