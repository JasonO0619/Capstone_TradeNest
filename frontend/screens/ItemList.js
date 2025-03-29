import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image} from "react-native";
import HeadNav from "../header/HeadNav";
import BASE_URL from "../BaseUrl";

const ItemList = ({ route, navigation }) => {
  const { typeOfPost } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!typeOfPost) return;

    const fetchItemsByCategory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/type/${typeOfPost}`);
        const data = await response.json();

        if (response.ok) {
          setItems(data.posts);
        } else {
          console.error("Error fetching posts:", data.error);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
      setLoading(false);
    };

    fetchItemsByCategory();
  }, [typeOfPost]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate("PostDetailPage", { item })}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.itemImage}
      />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemText}>{item.title || "Untitled Item"}</Text>
        <Text style={styles.itemSubText}>
          {item.typeOfPost === "sell"
            ? `Price: $${item.price || "N/A"}`
            : item.typeOfPost === "lend"
            ? `Lending Period: ${item.lendingPeriod || "N/A"}`
            : item.typeOfPost === "trade"
            ? `Trade Interest: ${item.tradeInterest || "N/A"}`
            : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeadNav navigation={navigation} currentScreen="ItemList" />
      <Text style={styles.title}>{typeOfPost.toUpperCase()} POSTS</Text>
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
    marginVertical: 16,
    textAlign: "center",
    color: "#fff",
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemSubText: {
    fontSize: 14,
    color: "#666",
  },
});

export default ItemList;
