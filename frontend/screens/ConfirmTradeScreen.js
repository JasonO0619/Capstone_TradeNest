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
  ScrollView, 
  Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ConfirmTradeScreen({ route, navigation }) {
  const { convoId, postId, isPoster, posterId } = route.params;
  const [post, setPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('Gently Used');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tradeItems, setTradeItems] = useState({});
  const [isOfferSubmitted, setIsOfferSubmitted] = useState(false);
  const [posterName, setPosterName] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserId, setOtherUserId] = useState(null);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [isTradeCompleted, setIsTradeCompleted] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userId = JSON.parse(atob(token.split('.')[1])).user_id;
        setCurrentUserId(userId);

        const postDoc = await getDoc(doc(firestore, 'posts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setPost(postData);

          const posterDoc = await getDoc(doc(firestore, 'users', posterId));
          if (posterDoc.exists()) {
            setPosterName(`${posterDoc.data().firstName} ${posterDoc.data().lastName}`);
          }
        }

        const convoRef = doc(firestore, 'conversations', convoId);
        const convoSnap = await getDoc(convoRef);
        const convoData = convoSnap.data();

        if (convoData?.status === 'completed' || postData?.status === 'Traded') {
          setIsTradeCompleted(true);
        }

        if (convoData) {
          const participants = convoData.participants || [];
          const otherId = participants.find(id => id !== userId);
          if (otherId) {
            setOtherUserId(otherId);
            const userDoc = await getDoc(doc(firestore, 'users', otherId));
            if (userDoc.exists()) {
              setOtherUserName(`${userDoc.data().firstName} ${userDoc.data().lastName}`);
            }
          }
        }

        setTradeItems(convoData?.tradeItems || {});

        if (convoData?.tradeItems) {
          const currentTradeItem = convoData.tradeItems[userId];
          if (currentTradeItem) {
            setTitle(currentTradeItem.title || '');
            setCondition(currentTradeItem.condition || 'Gently Used');
            setImageUri(currentTradeItem.imageUri || null);
            setIsOfferSubmitted(true);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
        Alert.alert("Failed to load data");
      }
    };

    fetchInitial();
  }, [postId, convoId]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
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
      const uploadedImageUrl = await uploadImageAsync(imageUri, currentUserId);
      if (!uploadedImageUrl) {
        Alert.alert('Image upload failed. Try again.');
        return;
      }
  
      const convoRef = doc(firestore, 'conversations', convoId);
      const convoSnap = await getDoc(convoRef);
      const data = convoSnap.data() || {};
  
      const updatedTradeItems = {
        ...(data.tradeItems || {}),
        [currentUserId]: { title, condition, imageUri: uploadedImageUrl },
      };
  
      await updateDoc(convoRef, { tradeItems: updatedTradeItems });
      setIsOfferSubmitted(true);
      Alert.alert("✅ Offer saved!");
    } catch (err) {
      console.error("❌ Failed to save trade offer:", err);
      Alert.alert("Failed to save your trade offer.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />;

  const offerToDisplay = isPoster ? tradeItems[otherUserId] : { title, condition, imageUri };

  const uploadImageAsync = async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `trade_offers/${userId}_${Date.now()}.jpg`;
  
      const storageRef = ref(getStorage(), filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err) {
      console.error('❌ Upload failed:', err);
      return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
  <Text style={styles.title}>{posterName}'s Offer (Poster):</Text>

  <Text style={styles.label}>Item Title</Text>
  <TextInput
    value={post?.title || ''}
    editable={false}
    style={[styles.input, styles.readOnlyText]}
  />

  <Text style={styles.label}>Condition</Text>
  <TextInput
    value={post?.condition || ''}
    editable={false}
    style={[styles.input, styles.readOnlyText]}
  />

  {post?.images?.[0] ? (
    <Image source={{ uri: post.images[0] }} style={styles.itemImage} />
  ) : (
    <Text style={styles.imagePickerText}>No image available</Text>
  )}
</View>


        <View style={[styles.circle, isOfferSubmitted && styles.circleGreen]} />

        <View style={styles.section}>
          <Text style={styles.title}>{currentUserId === posterId ? otherUserName : "Your"} Offer:</Text>

          {!isPoster ? (
  !isTradeCompleted ? (
    <>
      <TextInput
        placeholder="Item Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        editable={!isTradeCompleted}
      />
      <Picker
        selectedValue={condition}
        style={styles.picker}
        onValueChange={(value) => setCondition(value)}
        enabled={!isTradeCompleted}
      >
        <Picker.Item label="Brand New" value="Brand New" />
        <Picker.Item label="Like New" value="Like New" />
        <Picker.Item label="Gently Used" value="Gently Used" />
        <Picker.Item label="Used" value="Used" />
        <Picker.Item label="For Parts" value="For Parts" />
      </Picker>

      <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.itemImage} />
        ) : (
          <Text style={styles.imagePickerText}>Select Image</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleCompleteOffer}>
        <Text style={styles.submitButtonText}>
          {isOfferSubmitted ? "Update Offer" : "Submit Offer"}
        </Text>
      </TouchableOpacity>
    </>
  ) : (
    <>
      <Text style={styles.readOnlyText}>Title: {offerToDisplay?.title || '-'}</Text>
      <Text style={styles.readOnlyText}>Condition: {offerToDisplay?.condition || '-'}</Text>
      {offerToDisplay?.imageUri ? (
        <Image source={{ uri: offerToDisplay.imageUri }} style={styles.itemImage} />
      ) : (
        <Text style={styles.readOnlyText}>No image submitted</Text>
      )}
    </>
  )
) : (
  <>
    <Text style={styles.label}>Item Title:</Text>
    <Text style={styles.readOnlyText}>{offerToDisplay?.title || 'No title submitted'}</Text>

    <Text style={styles.label}>Condition:</Text>
    <Text style={styles.readOnlyText}>{offerToDisplay?.condition || 'No condition submitted'}</Text>

    {offerToDisplay?.imageUri ? (
      <TouchableOpacity onPress={() => setPreviewImageUri(offerToDisplay.imageUri)}>
        <Image source={{ uri: offerToDisplay.imageUri }} style={styles.itemImage} />
      </TouchableOpacity>
    ) : (
      <Text style={styles.readOnlyText}>No image submitted</Text>
    )}
  </>
)}

        </View>
      </View>

      {previewImageUri && (
        <Modal visible transparent animationType="fade">
          <TouchableOpacity
            style={styles.fullImageOverlay}
            onPress={() => setPreviewImageUri(null)}
            activeOpacity={1}
          >
            <Image source={{ uri: previewImageUri }} style={styles.fullImage} resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976', padding: 20, justifyContent: 'center' },
  scrollContainer: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  section: { backgroundColor: '#2F5D8A', padding: 16, borderRadius: 10, marginBottom: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemTitle: { color: '#fff', marginBottom: 6 },
  itemImage: { width: '100%', height: 150, resizeMode: 'cover', borderRadius: 8, marginBottom: 10 },
  condition: { color: '#fff', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 6, padding: 10, marginBottom: 10 },
  imagePicker: { backgroundColor: '#eee', borderRadius: 6, padding: 10, alignItems: 'center', marginBottom: 10 },
  imagePickerText: { color: '#333' },
  picker: { backgroundColor: '#fff', borderRadius: 6, marginBottom: 10 },
  submitButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff', backgroundColor: 'transparent', left: '45%', marginBottom: 15 },
  circleGreen: { backgroundColor: '#4CAF50' },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '90%' },
  label: { color: '#ccc', marginBottom: 4, marginTop: 10 },
  readOnlyText: { color: '#fff', backgroundColor: '#3C6E91', padding: 10, borderRadius: 6, marginBottom: 10 },
  
});
