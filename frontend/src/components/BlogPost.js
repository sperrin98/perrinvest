import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './BlogPost.css';

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      console.log('Fetching blog post id:', id);
      try {
        const res = await fetch(`http://localhost:5000/blog/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch post: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched post data:', data);
        setPost(data);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Error fetching blog post.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    } else {
      setError('Invalid post ID.');
      setLoading(false);
    }
  }, [id]);

  if (loading) return <p className="blog-message">Loading...</p>;
  if (error) return <p className="blog-message">{error}</p>;
  if (!post) return <p className="blog-message">Post not found.</p>;

  return (
    <div className="blog-container">
      <h1 className="blog-header">{post.title}</h1>
      <p className="blog-meta">
        <i>by {post.author} on {new Date(post.created_at).toLocaleDateString()}</i>
      </p>
      {post.image && (
        <img
          src={post.image} // Base64 image from backend
          alt={post.title}
          className="bp-image"
        />
      )}
      <div className="blog-content">{post.content}</div>
    </div>
  );
};

export default BlogPost;
