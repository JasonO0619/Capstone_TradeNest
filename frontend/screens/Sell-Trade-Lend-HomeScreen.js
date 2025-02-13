import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import HeadNav from '../header/HeadNav';

const SellTradeLendScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categories = ["sell", "trade", "lend"];
    const unsubscribeFns = [];

    try {
      categories.forEach((formType) => {
        const q = query(
          collection(firestore, `posts/${formType}/items`),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const formTypeItems = snapshot.docs.map((doc) => ({
            id: doc.id,
            formType,
            ...doc.data(),
          }));

          setItems((prevItems) => {
            const filteredItems = prevItems.filter((item) => item.formType !== formType);
            return [...filteredItems, ...formTypeItems];
          });

          setLoading(false);
        });

        unsubscribeFns.push(unsubscribe);
      });
    } catch (error) {
      console.error("Error fetching items:", error);
      setLoading(false);
    }

    return () => unsubscribeFns.forEach((unsubscribe) => unsubscribe());
  }, []);

  const categorizedItems = useMemo(() => ({
    sell: items.filter((item) => item.formType === "sell"),
    lend: items.filter((item) => item.formType === "lend"),
    trade: items.filter((item) => item.formType === "trade"),
  }), [items]);

  const renderPostCard = ({ item }) => {
    const displayInfo = item.formType === "sell"
      ? `$${item.price || "N/A"}`
      : item.formType === "lend"
      ? `Lending Period: ${item.lendingPeriod || "N/A"}`
      : `Looking for: ${item.tradeInterest || "N/A"}`;

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate("PostDetailPage", { item })}
      >
        <Image
          source={{ uri: item.images?.length ? item.images[0] : "https://via.placeholder.com/150" }}
          style={styles.postImage}
        />
        <Text style={styles.postTitle}>{item.title || "Untitled Post"}</Text>
        <Text style={styles.postPrice}>{displayInfo}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (categoryTitle, categoryType) => {
    const filteredItems = categorizedItems[categoryType];

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{categoryTitle}</Text>
          {filteredItems.length > 4 && (
            <TouchableOpacity onPress={() => navigation.navigate('CategoryList', { formType: categoryType })}>
              <Text style={styles.viewMore}>View More →</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <Text style={styles.noItemsText}>No posts available.</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeadNav navigation={navigation} currentScreen="SellTradeLendScreen" />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View>
          {renderCategorySection("Items for Sale", "sell")}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection("Items for Lending", "lend")}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection("Items for Trading", "trade")}
        </View>
      )}
    </View>
  );
};


// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
  },
  categoryContainer: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#fff",
  },
  viewMore: {
    fontSize: 14,
    color: 'lightblue',
  },
  postCard: {
    width: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
    resizeMode: "cover",
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  postPrice: {
    fontSize: 12,
    color: '#008000',
    fontWeight: 'bold',
  },
  likes: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 5,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default SellTradeLendScreen;
