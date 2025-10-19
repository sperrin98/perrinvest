import React, { useState } from 'react';
import './CreateBlogPost.css';

const CreateBlogPost = ({ authorId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author_id', authorId);
    if (image) formData.append('image', image);

    try {
      const response = await fetch('http://localhost:5000/blog', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Blog post created successfully!');
        setTitle('');
        setContent('');
        setImage(null);
      } else {
        const data = await response.json();
        setMessage(`Failed to create post: ${data.error}`);
      }
    } catch (err) {
      setMessage('Failed to create post due to network error.');
    }
  };

  return (
    <div className="blog-container">
      <h2 className="blog-header">Create Blog Post</h2>
      <form className="blog-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="blog-input"
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="blog-textarea"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="blog-file-input"
        />
        <button type="submit" className="blog-submit-btn">Publish</button>
      </form>
      {message && <p className="blog-message">{message}</p>}
    </div>
  );
};

export default CreateBlogPost;
