import React, { useState, useEffect } from "react";
import axios from "axios";

export default function SecureImage({ src, alt, className }) {
  const [imgSrc, setImgSrc] = useState("");

  useEffect(() => {
    if (!src) {
      setImgSrc("");
      return;
    }

    // If it's a data URL, load it directly
    if (src.startsWith("data:")) {
      setImgSrc(src);
      return;
    }

    // If it's a secure api file route, fetch it with auth headers
    if (src.startsWith("/api/files/")) {
      const fetchImage = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${src}?format=dataUrl`, {
            headers: { "access-token": token },
          });
          if (res.data.success && res.data.data?.dataUrl) {
            setImgSrc(res.data.data.dataUrl);
          } else {
            setImgSrc("/placeholder-image.jpg");
          }
        } catch (err) {
          console.error("Failed to load secure image", err);
          setImgSrc("/placeholder-image.jpg");
        }
      };
      fetchImage();
      return;
    }

    // For any other URL (external or public relative upload)
    if (src.startsWith("http")) {
      setImgSrc(src);
    } else {
      const relativePath = src.startsWith("/") ? src : `/${src}`;
      setImgSrc(relativePath);
    }
  }, [src]);

  if (!imgSrc) {
    return <div className={`animate-pulse bg-slate-800/80 ${className}`}></div>;
  }

  return <img src={imgSrc} alt={alt} className={className} />;
}
