import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore, storage } from '../firebaseConfig';


const DEFAULT_PROFILE_PIC_URL = "https://firebasestorage.googleapis.com/v0/b/tradenest-afc77.appspot.com/o/profile_pictures%2Fdefault_pro_pic.jpg?alt=media&token=c65c9f67-5e05-4310-91dd-9995551d9407";

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
      const userId = userCredential.user.uid;
      let profilePicUrl = DEFAULT_PROFILE_PIC_URL; 

      
      if (profilePic) {
        const uploadedUrl = await uploadImageToFirebase(profilePic, userId);
        if (uploadedUrl) {
          profilePicUrl = uploadedUrl;
        }
      }

  
      await setDoc(doc(firestore, "users", userId), {
        firstName,
        lastName,
        email,
        profilePic: profilePicUrl, 
      });

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

// 🔹 Styles
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
