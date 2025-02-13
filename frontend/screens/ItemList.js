import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator} from "react-native";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore"; // 
import { firestore } from "../firebaseConfig"; 
import HeadNav from "../header/HeadNav";

const ItemList = ({ route, navigation }) => {
  const { category } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;

    const q = query(collection(firestore, "items"), where("category", "==", category));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, [category]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate("PostDetailPage", { item })}
    >
      <Text style={styles.itemText}>{item.title}</Text>
      <Text style={styles.itemSubText}>Price: {item.price || "N/A"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <FontAwesome name="arrow-left" size={25} color="#fff" left='10' />      
              </TouchableOpacity>
      <HeadNav navigation={navigation} />
      <Text style={styles.title}>{category} ITEMS LIST</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1D4976",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#fff",
  },
  listContainer: {
    paddingVertical: 8,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  itemText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  itemSubText: {
    fontSize: 14,
    color: "#666",
  },
});

export default ItemList;
