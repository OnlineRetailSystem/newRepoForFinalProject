import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiUpload } from "react-icons/fi";
import "../EditProduct/EditProduct.css";

// Compress image to reduce base64 size
function compressImage(base64String, maxWidth = 400, maxHeight = 400, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
  });
}

export default function EditProduct() {
  const { productId } = useParams(); // <-- get productId from /edit-product/:productId
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    imageUrl: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8082/products/${productId}`, {
          method: "GET",
          mode: "cors"
        });
        if (!res.ok) throw new Error("Product not found");
        const prod = await res.json();
        setForm({
          name: prod.name || "",
          description: prod.description || "",
          price: prod.price?.toString() || "",
          quantity: prod.quantity?.toString() || "",
          category: prod.category || "",
          imageUrl: prod.imageUrl || ""
        });
        if (prod.imageUrl) {
          setImagePreview(prod.imageUrl);
        }
        setError("");
      } catch (err) {
        setError("Failed to load product for editing.");
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveLoading(true);
    setError("");
    try {
      if (!form.name || !form.price || !form.quantity || !form.category)
        throw new Error("All fields except description and image are required.");

      // If new image is selected, convert to base64 and compress
      let imageBase64 = form.imageUrl;
      if (imageFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        // Compress the image to reduce size (50% quality, max 300x300px)
        imageBase64 = await compressImage(base64, 300, 300, 0.5);
      }

      const res = await fetch(`http://localhost:8082/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          quantity: Number(form.quantity),
          category: form.category,
          imageUrl: imageBase64
        })
      });
      if (!res.ok) throw new Error("Failed to update product.");
      navigate("/admindashboard");
    } catch (err) {
      setError(err.message || "Failed to update product.");
    }
    setSaveLoading(false);
  }

  if (loading)
    return <div className="addproduct-bg"><div className="pdp-loading">Loading...</div></div>;
  if (error)
    return <div className="addproduct-bg"><div className="addproduct-error">{error}</div></div>;

  return (
    <div className="addproduct-bg">
      <form className="addproduct-form" onSubmit={handleSave}>
        <h2 className="addproduct-title">Edit Product</h2>

        {/* Image Upload Section */}
        <div className="addproduct-form-group">
          <label>Product Image</label>
          <div className="addproduct-image-upload">
            <input
              type="file"
              id="image-input"
              accept="image/*"
              onChange={handleImageChange}
              className="addproduct-file-input"
            />
            <label htmlFor="image-input" className="addproduct-upload-label">
              <FiUpload size={24} />
              <span>Click to upload image</span>
              <small>Recommended size: 400x400px, Max: 5MB</small>
            </label>
          </div>
          {imagePreview && (
            <div className="addproduct-image-preview">
              <img src={imagePreview} alt="Product preview" />
              <small style={{marginTop: '8px', color: '#666'}}>Images are automatically compressed before upload</small>
              <button
                type="button"
                className="addproduct-remove-image"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                  setForm({ ...form, imageUrl: "" });
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="addproduct-form-group">
          <label>Name</label>
          <input
            className="addproduct-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            type="text"
            placeholder="Product name"
            autoFocus
            required
          />
        </div>
        <div className="addproduct-form-group">
          <label>Description</label>
          <textarea
            className="addproduct-input addproduct-textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            rows={3}
          />
        </div>
        <div className="addproduct-form-row">
          <div className="addproduct-form-group">
            <label>Price</label>
            <input
              className="addproduct-input"
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              min="0"
              step="1"
              placeholder="Price (₹)"
              required
            />
          </div>
          <div className="addproduct-form-group">
            <label>Quantity</label>
            <input
              className="addproduct-input"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              type="number"
              min="0"
              step="1"
              placeholder="Quantity"
              required
            />
          </div>
        </div>
        <div className="addproduct-form-group">
          <label>Category</label>
          <input
            className="addproduct-input"
            name="category"
            value={form.category}
            onChange={handleChange}
            type="text"
            placeholder="Category"
            required
          />
        </div>
        {error && <div className="addproduct-error">{error}</div>}
        <button className="addproduct-btn" type="submit" disabled={saveLoading}>
          {saveLoading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}