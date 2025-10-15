import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BlogList = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/blog')
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error('Error fetching posts:', err));
  }, []);

  return (
    <div className="blog-list">
      <h2>Investment Analysis Blog</h2>
      {posts.map((post) => (
        <div key={post.post_id} className="blog-post">
          <h3>{post.title}</h3>
          <p>
            <i>
              by {post.author} on {new Date(post.created_at).toLocaleDateString()}
            </i>
          </p>
          {post.image && (
            <img
              src={`http://localhost:5000/static/uploads/${post.image}`}
              alt={post.title}
              style={{ maxWidth: '300px', display: 'block', marginBottom: '10px' }}
            />
          )}
          <p>{post.content.substring(0, 200)}...</p>
          <Link to={`/blog/${post.post_id}`}>Read more</Link>
        </div>
      ))}
    </div>
  );
};

export default BlogList;
