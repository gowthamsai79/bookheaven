import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './App';

function Home({ token }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: 'Fiction', description: '', cover_image: null });

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API_URL}/books/?search=${search}&genre=${genre}`);
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, genre]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login first!');

    const formData = new FormData();
    formData.append('title', newBook.title);
    formData.append('author', newBook.author);
    formData.append('genre', newBook.genre);
    formData.append('description', newBook.description);
    if (newBook.cover_image) {
      formData.append('cover_image', newBook.cover_image);
    }

    try {
      await axios.post(`${API_URL}/books/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowAddModal(false);
      setNewBook({ title: '', author: '', genre: 'Fiction', description: '', cover_image: null });
      fetchBooks();
    } catch (err) {
      alert('Failed to add book. Please make sure you are logged in.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Discover Books</h1>
        {token && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Book</button>
        )}
      </div>

      <div className="filter-row">
        <input
          type="text"
          className="input search-input"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="All">All Genres</option>
          <option value="Fiction">Fiction</option>
          <option value="Non-Fiction">Non-Fiction</option>
          <option value="Science Fiction">Science Fiction</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Mystery">Mystery</option>
          <option value="Biography">Biography</option>
        </select>
      </div>

      <div className="book-grid">
        {books.map((b) => (
          <Link to={`/book/${b.id}`} key={b.id} className="book-card">
            {b.cover_image ? (
              <img src={b.cover_image} alt={b.title} className="book-cover" />
            ) : (
              <div className="book-cover">📚</div>
            )}
            <div className="book-info">
              <span className="badge">{b.genre}</span>
              <div className="book-title" title={b.title}>{b.title}</div>
              <div className="book-author">by {b.author}</div>
              <div className="card-bottom">
                <span className="stars">★ {b.average_rating}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Details →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginBottom: '16px' }}>Add a New Book</h2>
            <form onSubmit={handleCreateBook}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" className="input" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input type="text" className="input" required value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select className="select" value={newBook.genre} onChange={e => setNewBook({ ...newBook, genre: e.target.value })}>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Biography">Biography</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" rows="3" required value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Book Cover Image</label>
                <input type="file" accept="image/*" onChange={e => setNewBook({ ...newBook, cover_image: e.target.files[0] })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Save Book</button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: '6px' }} onClick={() => setShowAddModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;