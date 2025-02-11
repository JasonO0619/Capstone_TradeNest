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
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { firestore, storage, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation } from '@react-navigation/native';
import HeadNav from '../header/HeadNav';

export default function CreateFormPage() {
  const navigation = useNavigation();
  const [formType, setFormType] = useState('sell'); 
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    lendingPeriod: '',
    tradeInterest: '',
    tradeTerms: '',
    locationFound: '',
    currentLocation: '',
  });

 
  const handleInputChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };


  const pickImage = async () => {
    if (images.length >= 5) {
      alert('You can only upload up to 5 images.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

 
  const handlePostSubmission = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in all required fields.");
      return;
    }
  
    setLoading(true);
  
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to post.");
        setLoading(false);
        return;
      }
  
      const uploadedImageUrls = await Promise.all(images.map(async (imageUri, index) => {
        const response = await fetch(imageUri);
        const blob = await response.blob();
  
        const imageRef = ref(storage, `posts/${formType}/${user.uid}_${Date.now()}_${index}`);
        await uploadBytes(imageRef, blob);
        return await getDownloadURL(imageRef);
      }));
  
  
      const postData = {
        userId: user.uid,
        title: formData.title,
        description: formData.description,
        category: formType,
        condition: formData.condition,
        images: uploadedImageUrls,
        createdAt: new Date().toISOString(),
      };
      
    
      if (formType === "sell") {
        postData.price = formData.price;
      }
      if (formType === "lend") {
        postData.lendingPeriod = formData.lendingPeriod;
      }
      if (formType === "trade") {
        postData.tradeInterest = formData.tradeInterest;
        postData.tradeTerms = formData.tradeTerms;
      }
      if (formType === "lost") {
        postData.locationFound = formData.locationFound;
        postData.currentLocation = formData.currentLocation;
      }
      
      await addDoc(collection(firestore, `posts/${formType}/items`), postData);
  
      alert("Post submitted successfully!");
      navigation.navigate(formType === "lost" ? "LostAndFoundScreen" : "SellTradeLendScreen");
      setImages([]); 
  
    } catch (error) {
      console.error("Error adding post:", error);
      alert("Error submitting post. Please try again.");
    }
  
    setLoading(false);
  };
  return (


    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}>

        <HeadNav navigation={navigation} currentScreen="CreateFormPage" />
     
      <ScrollView style={styles.container}>
        <View style={styles.innerContainer}>
  
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Form Type:</Text>
            <View style={styles.pickerContainer_type}>
              <Picker
                selectedValue={formType}
                style={styles.picker}
                itemStyle={styles.pickerItem} 
                onValueChange={(itemValue) => setFormType(itemValue)}
              >
                <Picker.Item label="SELL" value="sell" />
                <Picker.Item label="LEND" value="lend" />
                <Picker.Item label="TRADE" value="trade" />
                <Picker.Item label="LOST & FOUND" value="lost" />
              </Picker>
            </View>
          </View>
  
         
          <Text style={styles.label}>Upload Image:</Text>
          <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            <Text style={styles.imageText}>img</Text>
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
              placeholder="Enter title..."
              placeholderTextColor="#333"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
            />
          </View>
  
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description of the item..."
              placeholderTextColor="#333"
              multiline
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
            />
          </View>
  
        
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                style={styles.picker}
                onValueChange={(itemValue) => handleInputChange("category", itemValue)}
              >
                <Picker.Item label="Electronics" value="electronics" />
                <Picker.Item label="Furniture" value="furniture" />
                <Picker.Item label="Books" value="books" />
              </Picker>
            </View>
          </View>
  
         
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Condition:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.condition}
                style={styles.picker}
                onValueChange={(itemValue) => handleInputChange("condition", itemValue)}
              >
                
                <Picker.Item label="New" value="new" />
                <Picker.Item label="Used" value="used" />
              </Picker>
            </View>
          </View>
  
          
          {formType === 'sell' && (
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
  
          {formType === 'lend' && (
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
  
          
          {formType === 'trade' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Trade Interest:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter what item you're looking to trade with..."
                  value={formData.tradeInterest}
                  onChangeText={(text) => handleInputChange('tradeInterest', text)}
                />
              </View>
  
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Trade Terms:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter any trade terms..."
                  value={formData.tradeTerms}
                  onChangeText={(text) => handleInputChange('tradeTerms', text)}
                />
              </View>
            </>
          )}
  

          {formType === 'lost' && (
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
    paddingTop: 20,
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
});


