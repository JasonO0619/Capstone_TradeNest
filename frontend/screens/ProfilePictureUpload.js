import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';


const DEFAULT_PROFILE_PIC_URL = "https://firebasestorage.googleapis.com/v0/b/tradenest-afc77.firebasestorage.app/o/profile_pictures%2FDefault-profile.jpg?alt=media&token=69582c18-56a2-46f0-a8e0-f29340a9ebc9";


const ProfilePictureUpload = ({ navigation, route }) => {
  const { firstName, lastName, email, password } = route.params;
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri); 
    }
  };


  const uploadImageToFirebase = async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_pictures/${userId}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading image: ", error);
      return null;
    }
  };


  const handleRegister = async () => {
    setUploading(true);
    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;
  

      let profilePicUrl = DEFAULT_PROFILE_PIC_URL;
      if (profilePic) {
        const uploadedUrl = await uploadImageToFirebase(profilePic, userId);
        if (uploadedUrl) {
          profilePicUrl = uploadedUrl;
          await AsyncStorage.setItem('profilePic', profilePicUrl);
        }
      }
  

      const token = await user.getIdToken();
      console.log('✅ Token saved:', token);
      await AsyncStorage.setItem('userToken', token); // ✅ Ensure token is stored
  

      const registerRes = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          username: `${firstName} ${lastName}`,
          phoneNumber: '',
          profilePicture: profilePicUrl,
        }),
      });
  
      if (!registerRes.ok) {
        const errorText = await registerRes.text();
        console.error("Backend responded with:", errorText);
        throw new Error('Failed to register user in backend.');
      }
  

      const profileRes = await fetch(`${BASE_URL}/api/users/myProfile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (profileRes.ok) {
        const userData = await profileRes.json();
        if (userData.profilePicture) {
          await AsyncStorage.setItem('profilePic', userData.profilePicture);
        }
      } else {
        console.warn('⚠️ Could not fetch user profile after registration');
      }
  
      Alert.alert("Success", "Registration complete!");
      navigation.navigate("OptionsScreen");
  
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error(error);
    }
    setUploading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Profile Picture</Text>

    
      <Image source={{ uri: profilePic || DEFAULT_PROFILE_PIC_URL }} style={styles.image} />

      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? "Uploading..." : "Pick an Image"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? "Registering..." : "Register"}</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 32,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF8B94',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
  },
});

export default ProfilePictureUpload;
