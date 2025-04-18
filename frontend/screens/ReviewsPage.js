import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';

export default function ReviewsPage({ navigation }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const uid = JSON.parse(atob(token.split('.')[1])).user_id;
        setUserId(uid);
  
        const res = await fetch(`${BASE_URL}/api/reviews/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const data = await res.json();
        setReviews(data.reviews || []); 
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setLoading(false);
      }
    };
  
    fetchReviews();
  }, []);

  const handleSubmitReview = async () => {
    try {
      if (!review || !rating) return Alert.alert('Error', 'Please provide both rating and review');

      const token = await AsyncStorage.getItem('userToken');
      const uid = JSON.parse(atob(token.split('.')[1])).user_id;

      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revieweeId: userId, 
          rating,
          text: review,
          postId: null,
          convoId: null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Submission failed');
      }

      const newReview = await res.json();
      setReviews([newReview, ...reviews]);
      setReview('');
      setRating(0);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
        <FontAwesome name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>My Reviews</Text>
      <Text style={styles.reviewCount}>Based on {reviews.length} reviews</Text>

      {/* <View style={styles.ratingSection}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <FontAwesome
              name={star <= rating ? 'star' : 'star-o'}
              size={30}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View> */}

      {/* <TextInput
        style={styles.textInput}
        placeholder="Write a review here..."
        multiline
        value={review}
        onChangeText={setReview}
      /> */}

      {/* <TouchableOpacity onPress={handleSubmitReview} style={styles.submitButton}>
        <Text style={styles.submitText}>Submit Review</Text>
      </TouchableOpacity> */}

<View style={styles.reviewsList}>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : reviews.length === 0 ? (
    <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
      You have no reviews yet.
    </Text>
  ) : (
    reviews.map((reviewItem, index) => (
      <View key={index} style={styles.reviewCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {reviewItem.reviewerPic ? (
            <Image source={{ uri: reviewItem.reviewerPic }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }} />
          ) : (
            <FontAwesome name="user-circle" size={30} color="#999" style={{ marginRight: 10 }} />
          )}
          <Text style={{ fontWeight: 'bold', color: '#000' }}>{reviewItem.reviewerName || 'Unknown'}</Text>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesome
              key={star}
              name={star <= reviewItem.rating ? 'star' : 'star-o'}
              size={20}
              color="#FFD700"
            />
          ))}
        </View>
        <Text style={styles.reviewText}>{reviewItem.text}</Text>
      </View>
    ))
  )}
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    padding: 15,
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  reviewCount: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  ratingSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 100,
    textAlignVertical: 'top',
    color: '#000',
    backgroundColor: '#FFF',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
  },
  reviewsList: {
    marginTop: 30,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
  },
});