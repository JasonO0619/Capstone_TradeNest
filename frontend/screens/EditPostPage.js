import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import HeadNav from '../header/HeadNav';
import BASE_URL from '../BaseUrl';

export default function EditPostPage({ route, navigation }) {
  const { item } = route.params;

  const [formData, setFormData] = useState({ ...item });
  const [typeOfPost, setTypeOfPost] = useState(item.typeOfPost);
  const [images, setImages] = useState(item.images || []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [foundDate, setFoundDate] = useState(
    item.foundDate ? new Date(item.foundDate) : new Date()
  );

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || foundDate;
    setShowDatePicker(false);
    setFoundDate(currentDate);
    handleInputChange('foundDate', currentDate.toISOString());
  };

  const handleTypeChange = (value) => {
    setTypeOfPost(value);
    setFormData((prev) => {
      const base = {
        ...prev,
        typeOfPost: value,
      };
      switch (value) {
        case 'sell':
          return { ...base, price: '', tradeInterest: undefined, lendingPeriod: undefined, locationFound: undefined, currentLocation: undefined, foundDate: undefined };
        case 'lend':
          return { ...base, lendingPeriod: '', price: undefined, tradeInterest: undefined, locationFound: undefined, currentLocation: undefined, foundDate: undefined };
        case 'trade':
          return { ...base, tradeInterest: '', tradeTerms: '', price: undefined, lendingPeriod: undefined, locationFound: undefined, currentLocation: undefined, foundDate: undefined };
        case 'found':
          return { ...base, locationFound: '', currentLocation: '', foundDate: new Date().toISOString(), price: undefined, tradeInterest: undefined, lendingPeriod: undefined };
        default:
          return base;
      }
    });
  };
  
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const body = {
        ...formData,
        typeOfPost,
        images,
        foundDate: formData.foundDate || foundDate.toISOString(),
      };

      const res = await fetch(`${BASE_URL}/api/posts/${formData.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update post');

      Alert.alert('Success', 'Post updated!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Upload Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) return Alert.alert('Permission denied to access camera.');
  
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });
  
            if (!result.canceled) {
              setImages((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) return Alert.alert('Permission denied to access gallery.');
  
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });
  
            if (!result.canceled) {
              setImages((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };
  
    const removeImage = (index) => {
      setImages(images.filter((_, i) => i !== index));
    };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <HeadNav navigation={navigation} currentScreen="EditPostPage" />
    <ScrollView style={styles.container}
    contentContainerStyle={[styles.innerContainer, { paddingBottom: 30 }]}>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Form Type:</Text>
        {item.typeOfPost === 'found' ? (
          <Text style={styles.disabledText}>Lost & Found</Text>
        ) : (
          <View style={styles.pickerContainer_type}>
            <Picker
              selectedValue={typeOfPost}
              style={styles.picker}
              onValueChange={handleTypeChange}
            >
              <Picker.Item label="SELL" value="sell" />
              <Picker.Item label="LEND" value="lend" />
              <Picker.Item label="TRADE" value="trade" />
            </Picker>
          </View>
        )}
      </View>

      <Text style={styles.label}>Upload Images ({images.length}/5):</Text>
      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        <Text style={styles.imageText}>Image(s)</Text>
        <Text style={styles.imageCount}>{images.length}/5</Text>
      </TouchableOpacity>

      <View style={styles.imagePreviewContainer}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeImageText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Title:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the name of the item..."
          value={formData.title}
          onChangeText={(text) => handleInputChange('title', text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description of the item..."
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          multiline
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.itemCategory}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('itemCategory', value)}
          >
            <Picker.Item label="Electronics" value="electronics" />
            <Picker.Item label="Furniture" value="furniture" />
            <Picker.Item label="Books" value="books" />
            <Picker.Item label="Clothing & Accessories" value="clothing" />
            <Picker.Item label="Sports & Outdoors" value="sports" />
            <Picker.Item label="Home Appliances" value="home appliances" />
            <Picker.Item label="Toys & Games" value="toys & games" />
            <Picker.Item label="Beauty & Personal Care" value="beauty" />
            <Picker.Item label="Health & Wellness" value="health" />
            <Picker.Item label="Musical Instruments" value="musical instruments" />
            <Picker.Item label="Vehicles & Auto Parts" value="vehicles" />
            <Picker.Item label="Collectibles & Art" value="collectibles" />
            <Picker.Item label="Jewelry & Watches" value="jewelry" />
            <Picker.Item label="Baby & Kids" value="baby kids" />
            <Picker.Item label="Pet Supplies" value="pet supplies" />
            <Picker.Item label="Office Supplies" value="office supplies" />
            <Picker.Item label="DIY & Tools" value="diy tools" />
            <Picker.Item label="Garden & Outdoor" value="garden & outdoor" />
            <Picker.Item label="Gadgets & Wearables" value="gadgets & wearables" />
            <Picker.Item label="Photography & Videography" value="photography" />
            <Picker.Item label="Tickets & Vouchers" value="tickets & vouchers" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Condition:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.condition}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('condition', value)}
          >
            <Picker.Item label="Brand New (Unopened)" value="brand new" />
            <Picker.Item label="Like New (Barely Used)" value="like new" />
            <Picker.Item label="Gently Used (Minimal Signs of Wear)" value="gently used" />
            <Picker.Item label="Used (Some Wear & Tear)" value="used" />
            <Picker.Item label="Heavily Used (Visible Damage or Wear)" value="heavily used" />
            <Picker.Item label="For Parts or Repair" value="for parts" />
          </Picker>
        </View>
      </View>

      {typeOfPost === 'sell' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price ($):</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter the price of the item..."
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
          />
        </View>
      )}

      {typeOfPost === 'lend' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Lending Period:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter lending period..."
            value={formData.lendingPeriod}
            onChangeText={(text) => handleInputChange('lendingPeriod', text)}
          />
        </View>
      )}

      {typeOfPost === 'trade' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Trade Interest:</Text>
            <TextInput
              style={styles.input}
              placeholder="What item do you want to trade for?"
              value={formData.tradeInterest}
              onChangeText={(text) => handleInputChange('tradeInterest', text)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Trade Terms:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter trade terms..."
              value={formData.tradeTerms}
              onChangeText={(text) => handleInputChange('tradeTerms', text)}
            />
          </View>
        </>
      )}

      {typeOfPost === 'found' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location Found:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter where the item was found..."
              value={formData.locationFound}
              onChangeText={(text) => handleInputChange('locationFound', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Location:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter where the item is currently..."
              value={formData.currentLocation}
              onChangeText={(text) => handleInputChange('currentLocation', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>When did you find this?</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{foundDate.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={foundDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    paddingHorizontal: 20,
  },

  innerContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },

  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    padding: 15,
    marginBottom: 15,
    fontSize: 15,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#FFF',
    color: '#000',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },

  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 60,
    width: '100%',
    justifyContent: 'center',
  },

  pickerContainer_type: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 60,
    width: '65%',
    justifyContent: 'center',
  },

  picker: {
    height: '100%',
    width: '100%',
    color: '#333',
  },

  saveButton: {
    backgroundColor: '#f28b82',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  imageBox: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },

  imageText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },

  imageCount: {
    fontSize: 12,
    color: '#999',
  },

  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },

  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },

  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 15,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  dateInput: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 15,
  },

  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
});