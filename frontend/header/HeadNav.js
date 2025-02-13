import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const HeadNav = ({ navigation, currentScreen }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const newProfilePic = userDoc.exists() && userDoc.data().profilePic ? userDoc.data().profilePic : user.photoURL;

        if (newProfilePic !== profilePic) { 
          setProfilePic(newProfilePic);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profilePic]);

  if (loading) {
    return <View style={{ height: 50 }} />;
  }

  
  const isBackButton = ["Search", "ProfilePage", "CreateFormPage"].includes(currentScreen);

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
    "SellTradeLendScreen": "Marketplace Home",
    "LostAndFoundScreen": "Lost & Found Home",
    "Search": "Search Items",
    "ProfilePage": "Your Profile",
    "CreateFormPage": "Create a Post",
  };

  const screenTitle = screenTitleMap[currentScreen] || "";

  return (
    <View style={styles.header}>
      {/* 🏠 Home or 🔙 Back Button */}
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
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={30} color="#333" style={styles.icon} />
          </TouchableOpacity>
        )}

        {currentScreen !== "CreateFormPage" && currentScreen !== "OptionsScreen" && (
          <TouchableOpacity onPress={() => navigation.navigate('CreateFormPage')}>
            <MaterialIcons name="add-box" size={30} color="#FF4081" style={styles.icon} />
          </TouchableOpacity>
        )}

        {currentScreen !== "ProfilePage" && (
          <TouchableOpacity onPress={() => navigation.navigate('ProfilePage')}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle" size={32} color="#8A2BE2" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// 🔹 Styles
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
});

export default HeadNav;
