import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./BlogList.css";

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/blog`);
        if (!res.ok) {
          throw new Error(`Failed to fetch posts: ${res.status}`);
        }
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Error fetching blog posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const renderMessage = (message) => (
    <div className="bl-page">
      <div className="bl-container">
        <div className="bl-page-header">
          <h1 className="bl-title">Blogs</h1>
        </div>
        <div className="bl-message-card">{message}</div>
      </div>
    </div>
  );

  if (loading) return renderMessage("Loading blog posts...");
  if (error) return renderMessage(error);
  if (!posts.length) return renderMessage("No blog posts available.");

  return (
    <div className="bl-page">
      <div className="bl-container">
        <div className="bl-page-header">
          <h1 className="bl-title">Blogs</h1>
          <p className="bl-subtitle">Latest articles and updates from Perrinvest</p>
        </div>

        <div className="bl-posts-wrapper">
          {posts.map((post) => (
            <article key={post.post_id} className="bl-post-card">
              {post.image && (
                <div className="bl-post-image-side">
                  <div className="bl-post-image-frame">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="bl-post-image"
                    />
                  </div>
                </div>
              )}

              <div className="bl-post-content">
                <h2 className="bl-post-title">
                  <Link to={`/blog/${post.post_id}`}>{post.title}</Link>
                </h2>

                <p className="bl-post-meta">
                  <i>
                    by {post.author} on{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </i>
                </p>

                <div className="bl-post-excerpt">
                  {post.content.substring(0, 180)}...
                </div>

                <Link to={`/blog/${post.post_id}`} className="bl-post-readmore">
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogList;