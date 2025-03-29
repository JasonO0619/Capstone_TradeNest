import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import HeadNav from "../header/HeadNav";

export default function Search({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("sell");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [conditionFilter, setConditionFilter] = useState(null);
  const [itemCategoryFilter, setItemCategoryFilter] = useState(null);
  const [openStatus, setOpenStatus] = useState(false);
  const [openCondition, setOpenCondition] = useState(null);
  const [openItemCategory, setOpenItemCategory] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);

  const categories = [
    { label: "Sell", value: "sell" },
    { label: "Trade", value: "trade" },
    { label: "Lend", value: "lend" },
    { label: "Found", value: "lost" },
  ];
  const statusOptions = [
    { label: "Filter by Status (Default)", value: null },
    { label: "For Sale", value: "For Sale" },
    { label: "Available", value: "Available" },
    { label: "Pending", value: "Pending" },
  ];

  const conditionOptions = [
    { label: "Filter by Condition (Default)", value: null },
    { label: "Brand New (Unopened)", value: "brand new" },
    { label: "Like New (Barely Used)", value: "like new" },
    { label: "Gently Used (Minimal Signs of Wear)", value: "gently used" },
    { label: "Used (Some Wear & Tear)", value: "used" },
    { label: "Heavily Used (Visible Damage or Wear)", value: "heavily used" },
    { label: "For Parts or Repair", value: "for parts" },
  ];

  const itemCategoryOptions = [
    { label: "Filter by  (Default)", value: null },
    { label: "Electronics", value: "electronics" },
    { label: "Furniture", value: "furniture" },
    { label: "Books", value: "books" },
    { label: "Clothing & Accessories", value: "clothing" },
    { label: "Sports & Outdoors", value: "sports" },
    { label: "Home Appliances", value: "home appliances" },
    { label: "Toys & Games", value: "toys & games" },
    { label: "Beauty & Personal Care", value: "beauty" },
    { label: "Health & Wellness", value: "health" },
    { label: "Musical Instruments", value: "musical instruments" },
    { label: "Vehicles & Auto Parts", value: "vehicles" },
    { label: "Collectibles & Art", value: "collectibles" },
    { label: "Jewelry & Watches", value: "jewelry" },
    { label: "Baby & Kids", value: "baby kids" },
    { label: "Pet Supplies", value: "pet supplies" },
    { label: "Office Supplies", value: "office supplies" },
    { label: "DIY & Tools", value: "diy tools" },
    { label: "Garden & Outdoor", value: "garden & outdoor" },
    { label: "Gadgets & Wearables", value: "gadgets & wearables" },
    { label: "Photography & Videography", value: "photography" },
    { label: "Tickets & Vouchers", value: "tickets & vouchers" },
    { label: "Other", value: "other" },
  ];

  useEffect(() => {
    if (searchText) handleSearch();
  }, [category, statusFilter, conditionFilter, itemCategoryFilter]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, "posts"));
      const allItems = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = allItems.filter((item) => {
        const matchesCategory = item.typeOfPost === category;
        const matchesSearch =
          item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter ? item.status === statusFilter : true;
        const matchesCondition = conditionFilter ? item.condition === conditionFilter : true;
        const matchesItemCategory = itemCategoryFilter ? item.itemCategory === itemCategoryFilter : true;
        return matchesCategory && matchesSearch && matchesStatus && matchesCondition && matchesItemCategory;
      });
      setResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => navigation.navigate("PostDetailPage", { item })}>
      <Image
        source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
        style={styles.resultImage}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultDetails}>{item.itemCategory} | {item.condition}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <HeadNav navigation={navigation} currentScreen="Search" />
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category.toLowerCase()}...`}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close" size={20} color="#666" style={{ marginHorizontal: 8 }} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <DropDownPicker
          open={openCategory}
          value={category}
          items={categories}
          setOpen={setOpenCategory}
          setValue={setCategory}
          style={styles.dropdown}
          containerStyle={{ marginBottom: 10 }}
        />
        <TouchableOpacity
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={styles.advancedToggle}
            >
              <Text style={styles.advancedToggleText}>
                {showAdvancedFilters ? 'Hide Filters ▲' : 'Advanced Filters ▼'}
              </Text>
            </TouchableOpacity>
            {showAdvancedFilters && (
  <View style={styles.advancedFiltersContainer}>
    {/* Status Filter */}
    <DropDownPicker
      placeholder="Filter by Status"
      open={openStatus}
      setOpen={setOpenStatus}
      value={statusFilter}
      setValue={setStatusFilter}
      items={statusOptions}
      style={styles.dropdown}
      containerStyle={{ marginBottom: 10 }}
      zIndex={3000}

    />

    {/* Condition Filter */}
    <DropDownPicker
      placeholder="Filter by Condition"
      open={openCondition}
      setOpen={setOpenCondition}
      value={conditionFilter}
      setValue={setConditionFilter}
      items={conditionOptions}
      style={styles.dropdown}
      containerStyle={{ marginBottom: 10 }}
      zIndex={2000}
    />

    {/* Item Category Filter */}
          <DropDownPicker
            placeholder="Item Category"
            open={openItemCategory}
            setOpen={setOpenItemCategory}
            value={itemCategoryFilter}
            setValue={setItemCategoryFilter}
            items={itemCategoryOptions}
            style={styles.dropdown}
            containerStyle={{ marginBottom: 10 }}
            zIndex={1000}
          />
        </View>
          )}
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResultItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1D4976",
    padding: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderRadius: 5,
    width: '80%',
    alignSelf: 'center',
  },
  resultItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultDetails: {
    fontSize: 14,
    color: "#666",
  },
  advancedToggle: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
    marginBottom: 10
  },
  advancedToggleText: {
    fontWeight: 'bold',
    color: '#1D4976',
  },
  advancedFiltersContainer: {
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '80%',
    alignSelf: 'center',
  },
});