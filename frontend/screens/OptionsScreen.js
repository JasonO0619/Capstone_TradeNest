import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OptionsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Option to get Started</Text>

      
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
    color: '#fff'
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default OptionsScreen;
