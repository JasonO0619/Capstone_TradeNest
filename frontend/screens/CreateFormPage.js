import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth } from "../firebaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import HeadNav from '../header/HeadNav';
import BASE_URL from '../BaseUrl';

export default function CreateFormPage() {
  const navigation = useNavigation();
  const [typeOfPost, setTypeOfPost] = useState('sale');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [foundDate, setFoundDate] = useState(new Date());
  const [showFoundPicker, setShowFoundPicker] = useState(false);
  const [lendStartDate, setLendStartDate] = useState(new Date());
  const [lendEndDate, setLendEndDate] = useState(new Date());
  const [activePicker, setActivePicker] = useState(null); // 'start' or 'end'

  const showDatePicker = (type) => setActivePicker(type);
  const hideDatePicker = () => setActivePicker(null);

  const handleConfirmDateTime = (date) => {
    if (activePicker === 'start') setLendStartDate(date);
    else if (activePicker === 'end') setLendEndDate(date);
    hideDatePicker();
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    itemCategory: '',
    condition: '',
    price: '',
    tradeInterest: '',
    tradeTerms: '',
    locationFound: '',
    currentLocation: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (event?.type === "dismissed") {
      setShowFoundPicker(false);
      return;
    }
    if (selectedDate) setFoundDate(selectedDate);
    setShowFoundPicker(false);
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

  const handlePostSubmission = async () => {
    const requiredFields = ["title", "description", "itemCategory", "condition"];
    if (typeOfPost === "sell") requiredFields.push("price");
    if (typeOfPost === "lend") {
      if (!lendStartDate || !lendEndDate) {
        return Alert.alert("Missing lending dates", "Please select both start and end date/time for lending.");
      }
    }
    if (typeOfPost === "trade") requiredFields.push("tradeInterest", "tradeTerms");
    if (typeOfPost === "found") requiredFields.push("locationFound", "currentLocation");

    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    if (missingFields.length > 0) {
      return Alert.alert("Missing fields", `Please fill in: ${missingFields.join(", ")}`);
    }

    if (images.length === 0) {
      return Alert.alert("Image Required", "Please upload at least one image.");
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in.");

      const token = await AsyncStorage.getItem('userToken');
      const uploadedImageUrls = await Promise.all(images.map(async (uri) => {
        const formDataImg = new FormData();
        formDataImg.append('file', {
          uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
        formDataImg.append('postType', typeOfPost);

        const res = await fetch(`${BASE_URL}/uploadFile`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImg
        });

        const data = await res.json();
        return data.url;
      }));

      const postPayload = {
        userId: user.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        typeOfPost,
        itemCategory: formData.itemCategory,
        images: uploadedImageUrls,
        condition: formData.condition,
        price: formData.price || null,
        lendStartDate: typeOfPost === 'lend' ? lendStartDate.toISOString() : null,
        lendEndDate: typeOfPost === 'lend' ? lendEndDate.toISOString() : null,
        tradeInterest: formData.tradeInterest || null,
        tradeTerms: formData.tradeTerms || null,
        locationFound: formData.locationFound || null,
        currentLocation: formData.currentLocation || null,
        foundDate: typeOfPost === 'found' ? new Date(foundDate).toISOString() : null,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`${BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postPayload)
      });

      if (!response.ok) throw new Error("Failed to submit post.");

      Alert.alert("Success", "Post created successfully!");
      navigation.navigate(typeOfPost === "found" ? "LostAndFoundScreen" : "SellTradeLendScreen");

      setFormData({
        title: '', description: '', itemCategory: '', condition: '',
        price: '', tradeInterest: '', tradeTerms: '',
        locationFound: '', currentLocation: ''
      });
      setLendStartDate(null);
      setLendEndDate(null);
      setImages([]);
      setTypeOfPost('sell');

    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <HeadNav navigation={navigation} currentScreen="CreateFormPage" />
     
      <ScrollView style={styles.container}
      contentContainerStyle={[styles.innerContainer, { paddingBottom: 30 }]}>
        
        <View style={styles.innerContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Form Type:</Text>
            <View style={styles.pickerContainer_type}>
              <Picker
                selectedValue={typeOfPost}
                style={styles.picker}
                onValueChange={(itemValue) => setTypeOfPost(itemValue)}
              >
                <Picker.Item label="(Select One)" value="" />
                <Picker.Item label="SELL" value="sell" />
                <Picker.Item label="LEND" value="lend" />
                <Picker.Item label="TRADE" value="trade" />
                <Picker.Item label="LOST & FOUND" value="found" />
              </Picker>
            </View>
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
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Text style={styles.removeImageText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title:</Text>
            <TextInput style={styles.input} placeholder="Enter the name of the item..." value={formData.title} onChangeText={(text) => handleInputChange("title", text)} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description:</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Enter description of the item..." value={formData.description} onChangeText={(text) => handleInputChange("description", text)} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category:</Text>
            <View style={styles.pickerContainer}>
            <Picker selectedValue={formData.itemCategory} style={styles.picker} onValueChange={(itemValue) => handleInputChange("itemCategory", itemValue)}>
              <Picker.Item label="(Select One)" value="" />
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
            <Picker selectedValue={formData.condition} style={styles.picker} onValueChange={(itemValue) => handleInputChange("condition", itemValue)}>
              <Picker.Item label="(Select One)" value="" />
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
  <>
    <Text style={styles.label}>Lending Start Time:</Text>
    <TouchableOpacity style={styles.dateInput} onPress={() => showDatePicker('start')}>
      <Text style={styles.dateText}>{lendStartDate.toLocaleString()}</Text>
    </TouchableOpacity>

    <Text style={styles.label}>Lending End Time:</Text>
    <TouchableOpacity style={styles.dateInput} onPress={() => showDatePicker('end')}>
      <Text style={styles.dateText}>{lendEndDate.toLocaleString()}</Text>
    </TouchableOpacity>

    <DateTimePickerModal
      isVisible={!!activePicker}
      mode="datetime"
      date={activePicker === 'start' ? lendStartDate : lendEndDate}
      onConfirm={handleConfirmDateTime}
      onCancel={hideDatePicker}
    />
  </>
)}

          {typeOfPost === 'trade' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Trade Interest:</Text>
                <TextInput style={styles.input} placeholder="What item do you want to trade for?" value={formData.tradeInterest} onChangeText={(text) => handleInputChange("tradeInterest", text)} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Trade Terms:</Text>
                <TextInput style={styles.input} placeholder="Enter trade terms..." value={formData.tradeTerms} onChangeText={(text) => handleInputChange("tradeTerms", text)} />
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




          <TouchableOpacity style={styles.postButton} onPress={handlePostSubmission}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
          </TouchableOpacity>
        </View>
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
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 5, 
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
    height: '60',
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333', 
  },

  picker: { 
    height: 'auto', 
    width: '100%', 
    color: '#333', 
  },
  pickerContainer_type:{
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
    height: '60',
    width: '65%',
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

  postButton: { 
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

  postButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
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
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
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


