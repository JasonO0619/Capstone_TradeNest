import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function TradeToggleViewScreen({ route, navigation }) {
  const { convoId, postId, isPoster } = route.params;
  const [post, setPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('Gently Used');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('poster');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);

      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists()) setPost(postDoc.data());

      const draft = await AsyncStorage.getItem(`tradeDraft-${convoId}-${userId}`);
      if (draft) {
        const { title, condition, imageUri } = JSON.parse(draft);
        setTitle(title);
        setCondition(condition);
        setImageUri(imageUri);
      }

      const convoRef = doc(firestore, 'conversations', convoId);
      const convoSnap = await getDoc(convoRef);
      const tradeItems = convoSnap.data()?.tradeItems || {};
      if (tradeItems[userId]?.title && tradeItems[userId]?.condition && tradeItems[userId]?.imageUri) {
        setIsCompleted(true);
      }

      setLoading(false);
    };
    fetchInitial();
  }, [postId]);

  useEffect(() => {
    const saveDraft = async () => {
      if (!currentUserId) return;
      const draft = { title, condition, imageUri };
      await AsyncStorage.setItem(`tradeDraft-${convoId}-${currentUserId}`, JSON.stringify(draft));
    };

    const unsubscribe = navigation.addListener('blur', () => {
      saveDraft();
    });

    return unsubscribe;
  }, [navigation, convoId, currentUserId, title, condition, imageUri]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCompleteOffer = async () => {
    if (!title || !condition || !imageUri) {
      Alert.alert('Please fill out all fields before completing your offer.');
      return;
    }

    try {
      const convoRef = doc(firestore, 'conversations', convoId);
      const convoSnap = await getDoc(convoRef);
      const data = convoSnap.data() || {};

      const updatedTradeItems = {
        ...(data.tradeItems || {}),
        [currentUserId]: { title, condition, imageUri },
      };

      await updateDoc(convoRef, { tradeItems: updatedTradeItems });
      setIsCompleted(true);
      Alert.alert("✅ Offer saved!");
    } catch (err) {
      console.error("❌ Failed to save trade offer:", err);
      Alert.alert("Failed to save your trade offer.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <FontAwesome name="arrow-left" size={24} color="#fff" />
  </TouchableOpacity>
</View>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'poster' && styles.activeToggle]}
          onPress={() => setViewMode('poster')}
        >
          <Text style={styles.toggleText}>Poster</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'user' && styles.activeToggle]}
          onPress={() => setViewMode('user')}
        >
          <Text style={styles.toggleText}>You</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'poster' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poster’s Item</Text>
          <Image source={{ uri: post.images?.[0] }} style={styles.image} />
          <Text style={styles.label}>Title: {post.title}</Text>
          <Text style={styles.label}>Condition: {post.condition}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Offer</Text>
          <TextInput
            placeholder="Item Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Text style={styles.imagePickerText}>Select Image</Text>
            )}
          </TouchableOpacity>

          <Picker
            selectedValue={condition}
            style={styles.picker}
            onValueChange={(value) => setCondition(value)}
          >
            <Picker.Item label="Brand New" value="Brand New" />
            <Picker.Item label="Like New" value="Like New" />
            <Picker.Item label="Gently Used" value="Gently Used" />
            <Picker.Item label="Used" value="Used" />
            <Picker.Item label="For Parts" value="For Parts" />
          </Picker>

          <TouchableOpacity
            style={[styles.completeButton, isCompleted && styles.completedButton]}
            onPress={handleCompleteOffer}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <FontAwesome name="check-circle" size={24} color="white" />
            ) : (
              <Text style={styles.completeButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976', padding: 20, justifyContent:'center' },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2F5D8A',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  activeToggle: {
    backgroundColor: '#4CAF50',
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: { backgroundColor: '#2F5D8A', padding: 16, borderRadius: 10 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  label: { color: '#ddd', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 6, padding: 10, marginBottom: 10 },
  picker: { backgroundColor: '#fff', borderRadius: 6, marginBottom: 10 },
  image: { width: '100%', height: 150, resizeMode: 'cover', borderRadius: 8, marginBottom: 10 },
  imagePicker: { backgroundColor: '#eee', borderRadius: 6, padding: 10, alignItems: 'center', marginBottom: 10 },
  imagePickerText: { color: '#333' },
  tradeButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  tradeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  completeButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  completedButton: { backgroundColor: '#2ecc71' },
  completeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});