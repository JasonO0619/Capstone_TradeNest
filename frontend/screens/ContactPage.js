import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function ContactPage({navigation}) {
  const user = { name: 'admin' }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <FontAwesome name="arrow-left" size={24} color="#000" />
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.profileSection} 
        onPress={() => navigation.navigate('UserPage',{ user: user})}>
        <View style={styles.avatarPlaceholder}>
        <FontAwesome name="user-circle" size={100} color="#5C6BC0" />
        </View>
        <Text style={styles.userName}>Name</Text>
      </TouchableOpacity>

      <View style={styles.messageInputSection}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton}>
          <FontAwesome name="send" size={24} color="#8e8e93" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e6dfff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    marginTop: 10,
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  messageInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  sendButton: {
    padding: 10,
  },
});
