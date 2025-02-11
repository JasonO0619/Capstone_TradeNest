import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';  
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const HeadNav = ({ navigation, currentScreen }) => {
  const [selectedScreen, setSelectedScreen] = useState(currentScreen || "SellTradeLendScreen");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profilePic) {
          setProfilePic(userDoc.data().profilePic);
        } else {
          setProfilePic(user.photoURL); 
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleScreenChange = (screen) => {
    setSelectedScreen(screen);
    navigation.navigate(screen);
  };

  const handleHomePress = () => {
    if (currentScreen !== "LostAndFoundScreen") {
      navigation.navigate("SellTradeLendScreen");
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleHomePress}>
        <FontAwesome name="home" size={24} color="#333" style={styles.icon} />
      </TouchableOpacity>

      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={selectedScreen}
          style={styles.picker}
          itemStyle={styles.pickerItem} 
          onValueChange={(itemValue) => handleScreenChange(itemValue)}
        >
          <Picker.Item label="Sell / Trade / Lend" value="SellTradeLendScreen" />
          <Picker.Item label="Lost & Found" value="LostAndFoundScreen" />
        </Picker>
      </View>

      <View style={styles.rightIcons}>
        {/* 🔍 Search */}
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={24} color="#333" style={styles.icon} />
        </TouchableOpacity>

        {currentScreen !== "CreateFormPage" && (
          <TouchableOpacity onPress={() => navigation.navigate('CreateFormPage')}>
            <MaterialIcons name="add-box" size={24} color="#FF4081" style={styles.icon} />
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


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between', 
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 16, 
  },
  picker: {
    height: 60,
    width: '100%',
    color: '#333',
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16, 
  },
  pickerItem: {
    fontSize: 16,
    color: '#333', 
  },
});

export default HeadNav;
