import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BlogList.css';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      console.log('Fetching all blog posts...');
      try {
        const res = await fetch('http://localhost:5000/blog');
        if (!res.ok) {
          throw new Error(`Failed to fetch posts: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched posts:', data);
        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Error fetching blog posts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p className="bl-title">Loading blog posts...</p>;
  if (error) return <p className="bl-title">{error}</p>;
  if (!posts.length) return <p className="bl-title">No blog posts available.</p>;

  return (
    <div className="bl-container">
      <div className="bl-posts-wrapper">
        {posts.map((post) => (
          <div key={post.post_id} className="bl-post-card">
            <h2 className="bl-post-title">
              <Link to={`/blog/${post.post_id}`}>{post.title}</Link>
            </h2>
            <p className="bl-post-meta">
              <i>
                by {post.author} on {new Date(post.created_at).toLocaleDateString()}
              </i>
            </p>
            {post.image && (
              <img
                src={post.image} // Base64 image from backend
                alt={post.title}
                className="bl-post-image"
              />
            )}
            <div className="bl-post-excerpt">{post.content.substring(0, 100)}...</div>
            <Link to={`/blog/${post.post_id}`} className="bl-post-readmore">
              Read more
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
