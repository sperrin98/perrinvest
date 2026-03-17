import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./BlogPost.css";

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/blog/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch post: ${res.status}`);
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Error fetching blog post.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    } else {
      setError("Invalid post ID.");
      setLoading(false);
    }
  }, [id]);

  const renderMessage = (message) => (
    <div className="bp-page">
      <div className="bp-container">
        <div className="bp-message-card">{message}</div>
      </div>
    </div>
  );

  if (loading) return renderMessage("Loading...");
  if (error) return renderMessage(error);
  if (!post) return renderMessage("Post not found.");

  return (
    <div className="bp-page">
      <div className="bp-container">
        <article className="bp-card">
          <header className="bp-header-block">
            <h1 className="bp-title">{post.title}</h1>
            <p className="bp-meta">
              <i>
                by {post.author} on {new Date(post.created_at).toLocaleDateString()}
              </i>
            </p>
          </header>

          {post.image && (
            <div className="bp-image-frame">
              <img
                src={post.image}
                alt={post.title}
                className="bp-image"
              />
            </div>
          )}

          <div className="bp-content">{post.content}</div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;