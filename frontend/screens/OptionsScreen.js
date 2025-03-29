import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeadNav from '../header/HeadNav';

const OptionsScreen = ({ navigation }) => {
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
  
    const checkToken = async () => {
      console.log('[OptionsScreen] Checking for token...');
      const token = await AsyncStorage.getItem('userToken');
      console.log('[OptionsScreen] Token:', token?.slice(0, 15) + '...');
      if (isMounted) {
        setTokenChecked(true);
      }
    };
  
    checkToken();
  
    return () => {
      isMounted = false;
      console.log('[OptionsScreen] Unmounted');
    };
  }, []);

  if (!tokenChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D4976' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <HeadNav navigation={navigation} currentScreen="OptionsScreen" />
        <View style={styles.container}>
          <Text style={styles.title}>Select a Home Screen to get Started:</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('LostAndFoundScreen')}
          >
            <Text style={styles.buttonText}>Lost & Found</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SellTradeLendScreen')}
          >
            <Text style={styles.buttonText}>Sell/Trade/Lend</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1D4976',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginBottom: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default OptionsScreen;
