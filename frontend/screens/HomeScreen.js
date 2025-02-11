import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getFirestore, collection, onSnapshot } from "firebase/firestore"; // ✅ Use Web SDK
import { firestore } from "../firebaseConfig"; // ✅ Import from firebaseConfig.js
import HeadNav from "../header/HeadNav";

const HomeScreen = ({ navigation, route }) => {
  const { selectedOption } = route.params; // Get selected option
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine the collection based on selectedOption
    let collectionName = "";

    if (selectedOption === "Lost and Found") {
      collectionName = "foundItems";
    } else if (selectedOption === "Sell, Trade, Lend") {
      collectionName = "sellTradeLendItems";
    }

    if (!collectionName) return;


    const unsubscribe = onSnapshot(collection(firestore, collectionName), (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [selectedOption]);

  const renderSquare = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.square}
      onPress={() => navigation.navigate("PostDetailPage", { item })}
    >
      <Text style={styles.itemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeadNav navigation={navigation} />
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            {selectedOption === "Lost and Found" && (
              <>
                <Text style={styles.headerTitle}>FOUND</Text>
                <FlatList
                  data={items}
                  renderItem={renderSquare}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </>
            )}

            {selectedOption === "Sell, Trade, Lend" && (
              <>
                <Text style={styles.headerTitle}>SELL</Text>
                <FlatList
                  data={items.filter((item) => item.category === "sell")}
                  renderItem={renderSquare}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />

                <Text style={styles.headerTitle}>TRADE</Text>
                <FlatList
                  data={items.filter((item) => item.category === "trade")}
                  renderItem={renderSquare}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />

                <Text style={styles.headerTitle}>LEND</Text>
                <FlatList
                  data={items.filter((item) => item.category === "lend")}
                  renderItem={renderSquare}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1D4976" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", margin: 10 },
  square: {
    width: 100,
    height: 100,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemText: { fontSize: 16, fontWeight: "bold", color: "#333" },
});

export default HomeScreen;
