import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './App';

function BookDetail({ token }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [shelf, setShelf] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const fetchBook = async () => {
    try {
      const res = await axios.get(`${API_URL}/books/${id}/`);
      setBook(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShelf = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/reading-list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const match = res.data.find(item => item.book === parseInt(id));
      if (match) setShelf(match.status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBook();
    fetchShelf();
  }, [id, token]);

  const handleShelfChange = async (newStatus) => {
    if (!token) return alert('Please login to manage your reading list!');
    try {
      await axios.post(`${API_URL}/reading-list/`, {
        book_id: id,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShelf(newStatus);
    } catch (err) {
      alert('Failed to update shelf.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to leave a review!');
    try {
      await axios.post(`${API_URL}/books/${id}/reviews/`, {
        rating,
        review_text: reviewText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewText('');
      fetchBook();
    } catch (err) {
      alert('Failed to submit review.');
    }
  };

  if (!book) return <div className="container">Loading book details...</div>;

  return (
    <div className="container">
      <Link to="/" className="btn btn-outline" style={{ display: 'inline-block', marginBottom: '16px' }}>← Back to Books</Link>

      <div className="detail-layout">
        <div>
          {book.cover_image ? (
            <img src={book.cover_image} alt={book.title} className="detail-cover" />
          ) : (
            <div className="detail-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📖</div>
          )}

          <div className="shelf-box">
            <h4>My Reading Shelf</h4>
            <select
              className="select"
              style={{ width: '100%', marginTop: '8px' }}
              value={shelf}
              onChange={(e) => handleShelfChange(e.target.value)}
            >
              <option value="" disabled>Add to Shelf...</option>
              <option value="Want to Read">Want to Read</option>
              <option value="Currently Reading">Currently Reading</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <span className="badge">{book.genre}</span>
          <h1 style={{ marginTop: '8px' }}>{book.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '16px' }}>by {book.author}</p>
          <p className="stars" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>★ {book.average_rating} / 5.0</p>
          <p style={{ lineHeight: '1.6', marginBottom: '24px' }}>{book.description}</p>

          <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

          <h3>Community Reviews ({book.reviews?.length || 0})</h3>
          
          {token ? (
            <form onSubmit={handleReviewSubmit} style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div className="form-group">
                <label>Rate this book (1 to 5 Stars):</label>
                <select className="select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Terrible</option>
                </select>
              </div>
              <div className="form-group">
                <label>Your Review:</label>
                <textarea
                  className="input"
                  rows="3"
                  required
                  placeholder="Share your thoughts about this book..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Post Review</button>
            </form>
          ) : (
            <p style={{ margin: '12px 0', color: 'var(--muted)' }}>Log in above to leave a rating and review.</p>
          )}

          <div className="reviews-section">
            {book.reviews && book.reviews.length > 0 ? (
              book.reviews.map((rev) => (
                <div key={rev.id} className="review-item">
                  <div className="review-header">
                    <strong>{rev.username}</strong>
                    <span className="stars">{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p style={{ color: '#475569' }}>{rev.review_text}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)', marginTop: '8px' }}>No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetail;