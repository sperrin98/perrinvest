import React, { useEffect, useState } from "react";

const NewsSidebar = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/news`);
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error("Failed to fetch news:", err);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="home-news-sidebar">
      <h3>Financial News</h3>
      <ul>
        {articles.map((article, idx) => (
          <li key={idx}>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsSidebar;
