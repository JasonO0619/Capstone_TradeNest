import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker"; 
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons"; 
import HeadNav from "../header/HeadNav"; 
import { FontAwesome } from '@expo/vector-icons';

export default function Search({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("sell"); 
  const [searchHistory, setSearchHistory] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [results, setResults] = useState([]);
  
  
  const [open, setOpen] = useState(false); 
  const [items, setItems] = useState([
    { label: "Sell", value: "sell" },
    { label: "Trade", value: "trade" },
    { label: "Lend", value: "lend" },
    { label: "Found", value: "lost" },
  ]);

  
  useEffect(() => {
    fetchRecommendedItems();
  }, [category]); 

 
  const fetchRecommendedItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, `posts/${category}/items`));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecommendedItems(items.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

 
  const handleSearch = async () => {
    if (!searchText.trim()) return;

    if (!searchHistory.includes(searchText)) {
      setSearchHistory([searchText, ...searchHistory]);
    }

    try {
      const querySnapshot = await getDocs(collection(firestore, `posts/${category}/items`));
      const items = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) => item.title.toLowerCase().includes(searchText.toLowerCase()));

      setResults(items);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >

        <HeadNav navigation={navigation} currentScreen="Search" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          
         
          <View style={styles.searchContainer}>
            <DropDownPicker
              open={open}
              value={category}
              items={items}
              setOpen={setOpen}
              setValue={setCategory}
              setItems={setItems}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownStyle={styles.dropdownList}
            />

            
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search in ${category.toUpperCase()}...`} 
                value={searchText}
                onChangeText={setSearchText}
              />
              <TouchableOpacity onPress={handleSearch}>
                <Ionicons name="search" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => alert("Filter options coming soon!")} style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>

          <Text style={styles.historyHeader}>History:</Text>
          <View style={styles.historyContainer}>
            {searchHistory.length > 0 ? (
              searchHistory.slice(0, 5).map((term, index) => (
                <TouchableOpacity key={index} style={styles.historyItem} onPress={() => setSearchText(term)}>
                  <Text>{term}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No history available...</Text> 
            )}
          </View>

         
          <Text style={styles.recommendHeader}>Recommended:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendContainer}>
            {recommendedItems.length > 0 ? (
              recommendedItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.recommendItem}>
                  <Image source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }} style={styles.recommendImage} />
                  <Text style={styles.recommendTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No posts available...</Text> 
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,  backgroundColor: '#1D4976', padding: 15 },

  
  searchContainer: {
    backgroundColor: "#EEE",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%'
  },

  
  dropdownContainer: { width: "30%", marginBottom: 10 },
  dropdown: { backgroundColor: "#FFF", borderRadius: 5 },
  dropdownList: { backgroundColor: "#FFF" },

  
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: { flex: 1, padding: 8 },

 
  filterButton: { alignSelf: "center", marginVertical: 5 },
  filterText: { color: "#fff", fontSize: 14 },


  historyHeader: { fontSize: 18, fontWeight: "bold", marginTop: 10,  marginBottom: 10, color: '#fff' },
  historyContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 5, marginBottom: 19},
  historyItem: {
    backgroundColor: "#EEE",
    padding: 8,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  noDataText: { color: "#999", fontSize: 14, marginTop: 5 },


  recommendHeader: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: '#fff' },
  recommendContainer: { flexDirection: "row", marginTop: 5 },
  recommendItem: { width: 120, marginRight: 10, alignItems: "center" },
  recommendImage: { width: 100, height: 100, borderRadius: 10 },
  recommendTitle: { fontSize: 14, marginTop: 5, textAlign: "center", color: '#fff' },
});


