import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function ReviewsPage({ navigation }) {
  const [rating, setRating] = useState(0);  
  const [review, setReview] = useState(''); 
  const [reviews, setReviews] = useState([
    { text: 'Great service!', rating: 5 },
    { text: 'Awesome product!', rating: 4 },
    { text: 'Will definitely buy again.', rating: 5 },

  ]);

  const handleSubmitReview = () => {
    if (review) {
      const newReview = { text: review, rating };
      setReviews([newReview, ...reviews]);
      setReview('');
      setRating(0);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
        <FontAwesome name="arrow-left" size={24} color="#000" />
        <Text style={styles.goBackText}>Go Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Customer Reviews</Text>
      <Text style={styles.reviewCount}>Based on {reviews.length} reviews</Text>

      <View style={styles.ratingSection}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <FontAwesome
              name={star <= rating ? 'star' : 'star-o'}
              size={30}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Write a review"
        multiline
        value={review}
        onChangeText={setReview}
      />

      <TouchableOpacity onPress={handleSubmitReview} style={styles.submitButton}>
        <Text style={styles.submitText}>Submit Review</Text>
      </TouchableOpacity>

      <View style={styles.reviewsList}>
        {reviews.map((reviewItem, index) => (
          <View key={index} style={styles.reviewCard}>
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
        ))}
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
  goBackText: {
    fontSize: 16,
    color: '#007bff',
    marginLeft: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewCount: {
    fontSize: 16,
    color: '#555',
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