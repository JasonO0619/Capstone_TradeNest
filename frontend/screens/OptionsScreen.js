import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeadNav from '../header/HeadNav';

const OptionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setLoading(false);  
    };

    checkToken();
  }, []);  

  if (loading) {
    
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <HeadNav navigation={navigation} currentScreen="OptionsScreen" />

        <View style={styles.contentContainer}>
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
      </View>
    </TouchableWithoutFeedback>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60, 
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D4976',
  },
});

export default OptionsScreen;
