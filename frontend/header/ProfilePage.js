import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import HeadNav from '../header/HeadNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
const DEFAULT_PROFILE_PIC_URL = "https://firebasestorage.googleapis.com/v0/b/tradenest-afc77.appspot.com/o/profile_pictures%2Fdefault_pro_pic.jpg?alt=media&token=c65c9f67-5e05-4310-91dd-9995551d9407";
import BASE_URL from '../BaseUrl';

export default function ProfilePage({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/users/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error.message);
      Alert.alert('Error', 'Could not load user data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('token'); // Clear stored JWT
            navigation.replace('Login');
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeadNav navigation={navigation} currentScreen="ProfilePage" />
      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholderContainer}>
         <Image
          source={{ uri: `${user?.profilePicture || DEFAULT_PROFILE_PIC_URL}?t=${Date.now()}` }}
          style={styles.avatarImage}
        />
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="list" title="My List" navigation={navigation} target="MyListPage" />
          <MenuItem icon="heart" title="Favourites" navigation={navigation} target="FavouritesPage" />
          <MenuItem icon="cog" title="Settings" navigation={navigation} target="Settings" />
          <MenuItem icon="comment" title="Announcements" navigation={navigation} target="AnnouncementsPage" />
          <MenuItem icon="pencil" title="Reviews" navigation={navigation} target="ReviewsPage" />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, title, navigation, target }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => navigation.navigate(target)}
    >
      <FontAwesome name={icon} size={24} color="#fff" />
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D4976',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  avatarPlaceholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 10,
    borderRadius: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfoContainer: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    color: '#5C6BC0',
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#5C6BC0',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 5, 
  },
  editButton: {
    backgroundColor: '#f28b82',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  shareButton: {
    backgroundColor: '#ea80fc',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  menuSection: {
    marginTop: 20,
    alignItems:'center'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 20,
  },
  logoutContainer: {
    marginTop: 30,
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
});


