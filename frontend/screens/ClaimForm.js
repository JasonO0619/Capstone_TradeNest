import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const ClaimForm = ({ navigation, route, onSuccess }) => {
const { convoId, postOwnerId } = route.params;
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

      
      await setDoc(doc(firestore, `conversations/${convoId}/claim`, 'meta'), {
        when,
        where,
        details,
        approved: false,
        submittedBy: userId,
        submittedAt: new Date(),
      });


      await updateDoc(doc(firestore, `conversations/${convoId}`), {
        lastMessage: '[Claim Submitted]',
        lastMessageTimestamp: new Date(),
        isRead: {
          [userId]: true,
          [postOwnerId]: false,
        },
        lastMessageSenderId: userId,
      });

      Alert.alert("✅ Claim Submitted", "The post owner will review your claim.");
      navigation.goBack();

    } catch (err) {
      console.error("❌ Claim submission error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" bottom='120' />
        </TouchableOpacity>
      <Text style={styles.label}>When did you lost it?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. March 25, 2pm"
        value={form.when}
        onChangeText={(text) => handleChange('when', text)}
      />

      <Text style={styles.label}>Where did you lost it?</Text>
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
  });
  