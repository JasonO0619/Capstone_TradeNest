import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import HeadNav from './HeadNav'; 

export default function CreatePost({navigation}) {
  const [selectedForm, setSelectedForm] = useState('sell');
  const [images, setImages] = useState([]);

  const pickImage = async () => {
    if (images.length >= 5) {
      alert('You can only upload up to 5 images.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
  };

  const renderForm = () => {
    switch (selectedForm) {
      case 'sell':
        return (
          <View style={styles.formSection}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} placeholder="Enter title" />
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} placeholder="Enter description" multiline />
            <Text style={styles.label}>Price</Text>
            <TextInput style={styles.input} placeholder="$" keyboardType="numeric" />
            <Text style={styles.label}>Category</Text>
            <Picker style={styles.picker} selectedValue="Value">
              <Picker.Item label="Select" value="Value" />
              <Picker.Item label="Electronics" value="electronics" />
              <Picker.Item label="Clothing" value="clothing" />
              <Picker.Item label="Home Goods" value="homegoods" />
            </Picker>
            <TouchableOpacity style={styles.postButton}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        );
        case 'trade':
          return (
            <View style={styles.formSection}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} placeholder="Enter title" />
              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="Enter description" multiline />
              <Text style={styles.label}>Category</Text>
              <Picker style={styles.picker} selectedValue="Value">
                <Picker.Item label="Select" value="Value" />
                <Picker.Item label="Electronics" value="electronics" />
                <Picker.Item label="Clothing" value="clothing" />
                <Picker.Item label="Home Goods" value="homegoods" />
              </Picker>
              <Text style={styles.label}>Available</Text>
              <TextInput style={styles.input} placeholder="Enter availability" />
              <TouchableOpacity style={styles.postButton}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          );
          case 'found':
            return (
              <View style={styles.formSection}>
                <Text style={styles.label}>Title</Text>
                <TextInput style={styles.input} placeholder="Enter title" />
                <Text style={styles.label}>Description</Text>
                <TextInput style={styles.input} placeholder="Enter description" multiline />
                <Text style={styles.label}>Category</Text>
                <Picker style={styles.picker} selectedValue="Value">
                  <Picker.Item label="Select" value="Value" />
                  <Picker.Item label="Electronics" value="electronics" />
                  <Picker.Item label="Clothing" value="clothing" />
                  <Picker.Item label="Home Goods" value="homegoods" />
                </Picker>
                <Text style={styles.label}>Location Found</Text>
                <TextInput style={styles.input} placeholder="Enter location found" />
                <Text style={styles.label}>Current Location</Text>
                <TextInput style={styles.input} placeholder="Enter current location" />
                <TouchableOpacity style={styles.postButton}>
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            );
            case 'lend':
              return (
                <View style={styles.formSection}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput style={styles.input} placeholder="Enter title" />
                  <Text style={styles.label}>Description</Text>
                  <TextInput style={styles.input} placeholder="Enter description" multiline />
                  <Text style={styles.label}>Price</Text>
                  <TextInput style={styles.input} placeholder="$" keyboardType="numeric" />
                  <Text style={styles.label}>Category</Text>
                  <Picker style={styles.picker} selectedValue="Value">
                    <Picker.Item label="Select" value="Value" />
                    <Picker.Item label="Electronics" value="electronics" />
                    <Picker.Item label="Clothing" value="clothing" />
                    <Picker.Item label="Home Goods" value="homegoods" />
                  </Picker>
                  <TouchableOpacity style={styles.postButton}>
                    <Text style={styles.postButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
              );
     default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedForm}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedForm(itemValue)}
      >
        <Picker.Item label="SELL" value="sell" />
        <Picker.Item label="TRADE" value="trade" />
        <Picker.Item label="FOUND" value="found" />
        <Picker.Item label="LEND" value="lend" />
      </Picker>
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePlaceholder}>
          <FontAwesome name="image" size={100} color="#8e8e93" />
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.uploadedImage} />
          ))}
        </View>
      </View>
      {renderForm()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'left'
  },
  picker: {
    height: 50,
    width: '50%',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#b2dfdb',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  uploadedImage: {
    width: 70,
    height: 70,
    margin: 5,
    borderRadius: 10,
  },
  formSection: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  postButton: {
    backgroundColor: '#f28b82',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});