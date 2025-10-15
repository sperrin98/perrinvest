import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/blog/${id}`)
      .then((res) => res.json())
      .then((data) => setPost(data))
      .catch((err) => console.error('Error fetching post:', err));
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return (
    <div className="blog-post">
      <h2>{post.title}</h2>
      <p>
        <i>
          by {post.author} on {new Date(post.created_at).toLocaleDateString()}
        </i>
      </p>
      {post.image && (
        <img
          src={`http://localhost:5000/static/uploads/${post.image}`}
          alt={post.title}
          style={{ maxWidth: '500px', display: 'block', marginBottom: '20px' }}
        />
      )}
      <div>{post.content}</div>
    </div>
  );
};

export default BlogPost;
