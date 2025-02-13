import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const Settings = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const handleLogOut = () => {
    Alert.alert('Notification', 'You have been logged out.');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                       <FontAwesome name="arrow-left" size={25} color="#fff" left='10' />      
                     </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={(value) => setIsDarkMode(value)} />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Enable Notifications</Text>
        <Switch value={isNotificationsEnabled} onValueChange={(value) => setIsNotificationsEnabled(value)} />
      </View>
      <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => Alert.alert('Are you sure?', 'This action cannot be undone.', [{ text: 'Cancel' }, { text: 'Delete Account', onPress: () => Alert.alert('Account deleted') }])}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1D4976',
      padding: 16,
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 32,
      textAlign: 'center',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
      elevation: 1,
    },
    settingText: {
      fontSize: 18,
      color: '#333',
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
    deleteButton: {
      backgroundColor: '#FF6F61',
    },
  });

  export default Settings;
