import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'; 

const ClaimForm = ({ navigation, route }) => {
  const { postId, postOwnerId, itemTitle } = route.params;
  const [form, setForm] = useState({
    when: '',
    where: '',
    details: ''
  });


  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    const { when, where, details } = form;

    
    if (!when || !where || !details) {
      Alert.alert("Incomplete", "Please fill out all fields.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;


      const response = await fetch(`${BASE_URL}/api/messages/conversations/submit-claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: { when, where, details },
          postId,
          recipientId: postOwnerId, 
        }),
      });

      const result = await response.json();
      if (response.ok) {
        const newConvoId = result.convoId;  
      
        const messageText = `A claim was submitted for "${itemTitle || 'your item'}" you found.`;
      
        await addDoc(collection(firestore, `conversations/${newConvoId}/messages`), {
          message: messageText,
          senderId: userId,
          createdAt: serverTimestamp(),
          type: 'system',
        });
      
        Alert.alert("✅ Claim Submitted", "The post owner will review your claim.");
        const postRes = await fetch(`${BASE_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fullPost = await postRes.json();
        
        navigation.navigate('PostDetailLost', {
          fromClaimSuccess: true,
          convoData: result, 
          item: fullPost,
        });
      }else {
        Alert.alert("Error", result.error || "Something went wrong. Try again.");
      }

    } catch (err) {
      console.error("❌ Claim submission error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <FontAwesome name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.label}>When did you lose it?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. March 25, 2pm"
        value={form.when}
        onChangeText={(text) => handleChange('when', text)}
      />

      <Text style={styles.label}>Where did you lose it?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Library, 3rd floor"
        value={form.where}
        onChangeText={(text) => handleChange('where', text)}
      />

      <Text style={styles.label}>Describe the item</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Black umbrella with a sticker"
        value={form.details}
        onChangeText={(text) => handleChange('details', text)}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Claim</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ClaimForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D4976',
    padding: 16,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
});
