import React, { useState } from 'react';

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
    if (image) {
      formData.append('image', image);
    }

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
    <div>
      <h2>Create Blog Post</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
        <button type="submit">Publish</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateBlogPost;
