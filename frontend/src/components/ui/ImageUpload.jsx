import React, { useState, useRef, useId, useEffect } from 'react';
import { getImageUrl } from '../../config/api';

const ImageUpload = ({ 
  currentImage, 
  onImageSelect, 
  onImageRemove, 
  label = "Image (optionnelle)",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  cropAspectRatio = null, // e.g., 16/9, 1, 4/3, null for free crop
  defaultAspectRatio = null // Default aspect ratio to apply when image is loaded
}) => {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zoom: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }
    
    // Validate file size
    if (file.size > maxSize) {
      alert(`La taille de l'image ne doit pas dépasser ${(maxSize / 1024 / 1024).toFixed(0)}MB.`);
      return;
    }

    setOriginalFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setShowEditor(true);
    
    // Reset crop data with better defaults, applying default aspect ratio if specified
    let initialCropData = {
      x: 10,
      y: 10,
      width: 80,
      height: 80,
      zoom: 1,
      rotation: 0
    };

    // Apply default aspect ratio if specified
    if (defaultAspectRatio === 1) {
      // Square 1:1 aspect ratio
      const size = 70; // Slightly smaller for better fit
      const centerX = (100 - size) / 2;
      const centerY = (100 - size) / 2;
      initialCropData = {
        x: centerX,
        y: centerY,
        width: size,
        height: size,
        zoom: 1,
        rotation: 0
      };
    } else if (defaultAspectRatio === 4/3) {
      // 4:3 aspect ratio
      const width = 80;
      const height = (width * 3) / 4;
      const centerX = (100 - width) / 2;
      const centerY = (100 - height) / 2;
      initialCropData = {
        x: centerX,
        y: Math.max(0, centerY),
        width: width,
        height: Math.min(height, 100 - Math.max(0, centerY)),
        zoom: 1,
        rotation: 0
      };
    } else if (defaultAspectRatio === 16/9) {
      // 16:9 aspect ratio
      const width = 80;
      const height = (width * 9) / 16;
      const centerX = (100 - width) / 2;
      const centerY = (100 - height) / 2;
      initialCropData = {
        x: centerX,
        y: Math.max(0, centerY),
        width: width,
        height: Math.min(height, 100 - Math.max(0, centerY)),
        zoom: 1,
        rotation: 0
      };
    }

    setCropData(initialCropData);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    setImagePreview(null);
    setOriginalFile(null);
    setShowEditor(false);
    onImageRemove();
  };

  // Image editor functions
  const handleZoomChange = (e) => {
    const zoom = parseFloat(e.target.value);
    setCropData(prev => ({ ...prev, zoom }));
  };

  const handleRotationChange = (degrees) => {
    setCropData(prev => ({ ...prev, rotation: (prev.rotation + degrees) % 360 }));
  };

  const handleCropChange = (field, value) => {
    setCropData(prev => {
      const newData = { ...prev, [field]: Math.max(0, Math.min(100, value)) };
      
      // Ensure crop area stays within bounds
      if (field === 'x' && newData.x + newData.width > 100) {
        newData.width = 100 - newData.x;
      }
      if (field === 'y' && newData.y + newData.height > 100) {
        newData.height = 100 - newData.y;
      }
      if (field === 'width' && newData.x + newData.width > 100) {
        newData.x = 100 - newData.width;
      }
      if (field === 'height' && newData.y + newData.height > 100) {
        newData.y = 100 - newData.height;
      }
      
      return newData;
    });
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const cropX = (cropData.x / 100) * rect.width;
    const cropY = (cropData.y / 100) * rect.height;
    setDragStart({
      x: e.clientX - rect.left - cropX,
      y: e.clientY - rect.top - cropY
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;
    
    setCropData(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, newX)),
      y: Math.max(0, Math.min(100 - prev.height, newY))
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Add keyboard shortcuts
  React.useEffect(() => {
    if (!showEditor) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancelCrop();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSaveCrop();
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetCrop();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditor]);

  const generateCroppedImage = async () => {
    if (!imagePreview || !originalFile) {
      console.error('❌ Missing image preview or original file');
      return null;
    }

    console.log('🔄 Generating cropped image with data:', cropData);

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        console.log('📐 Original image dimensions:', {
          width: img.naturalWidth,
          height: img.naturalHeight
        });

        // Calculate actual crop dimensions based on the displayed image
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        // Calculate crop area in actual image pixels
        const cropX = (cropData.x / 100) * imgWidth;
        const cropY = (cropData.y / 100) * imgHeight;
        const cropWidth = (cropData.width / 100) * imgWidth;
        const cropHeight = (cropData.height / 100) * imgHeight;
        
        console.log('✂️ Crop area:', {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
          zoom: cropData.zoom,
          rotation: cropData.rotation
        });
        
        // Set canvas size to the final crop size
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.save();
        
        // Move to center of canvas for rotation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply rotation
        if (cropData.rotation !== 0) {
          ctx.rotate((cropData.rotation * Math.PI) / 180);
        }
        
        // Apply zoom
        if (cropData.zoom !== 1) {
          ctx.scale(cropData.zoom, cropData.zoom);
        }
        
        // Draw the image centered
        const drawWidth = cropWidth / cropData.zoom;
        const drawHeight = cropHeight / cropData.zoom;
        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
        );
        
        ctx.restore();
        
        console.log('🎨 Canvas processing complete, converting to blob...');
        
        // Convert to blob with good quality
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], originalFile.name, {
              type: originalFile.type,
              lastModified: Date.now()
            });
            
            console.log('✅ Cropped file created:', {
              name: croppedFile.name,
              size: croppedFile.size,
              type: croppedFile.type,
              originalSize: originalFile.size,
              compressionRatio: ((originalFile.size - croppedFile.size) / originalFile.size * 100).toFixed(1) + '%'
            });
            
            resolve(croppedFile);
          } else {
            console.error('❌ Failed to create blob from canvas');
            resolve(null);
          }
        }, originalFile.type, 0.92); // High quality
      };
      
      img.onerror = () => {
        console.error('❌ Failed to load image for cropping');
        resolve(null);
      };
      
      img.src = imagePreview;
    });
  };

  const handleSaveCrop = async () => {
    console.log('🎨 Starting image crop process...');
    console.log('Crop data:', cropData);
    
    const croppedFile = await generateCroppedImage();
    if (croppedFile) {
      console.log('✅ Cropped image generated successfully:', {
        name: croppedFile.name,
        size: croppedFile.size,
        type: croppedFile.type
      });
      
      const croppedPreview = URL.createObjectURL(croppedFile);
      onImageSelect(croppedFile, croppedPreview);
      setShowEditor(false);
    } else {
      console.error('❌ Failed to generate cropped image');
    }
  };

  const handleCancelCrop = () => {
    setShowEditor(false);
    setImagePreview(null);
    setOriginalFile(null);
  };

  const handleResetCrop = () => {
    setCropData({
      x: 10,
      y: 10,
      width: 80,
      height: 80,
      zoom: 1,
      rotation: 0
    });
  };

  const displayImage = imagePreview || (currentImage ? getImageUrl(currentImage) : null);

  return (
    <div className={`form-group ${className}`}>
      <label className="form-label" htmlFor={inputId}>{label}</label>
      
      <div className="image-upload-container">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        
        {displayImage && !showEditor ? (
          <div className="image-preview-container">
            <div className="image-preview-wrapper">
              <img
                src={displayImage}
                alt="Preview"
                className="image-preview-img"
              />
              <div className="image-overlay">
                <button
                  type="button"
                  className="image-action-btn edit"
                  onClick={() => {
                    if (currentImage && !imagePreview) {
                      // Edit existing image directly
                      console.log('🖼️ Loading existing image for editing:', currentImage);
                      const imageUrl = getImageUrl(currentImage);
                      
                      // Try to fetch the image with proper CORS handling
                      fetch(imageUrl, {
                        mode: 'cors',
                        credentials: 'same-origin'
                      })
                        .then(response => {
                          if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                          }
                          return response.blob();
                        })
                        .then(blob => {
                          console.log('✅ Existing image loaded successfully');
                          const file = new File([blob], 'existing-image.jpg', { type: blob.type });
                          setOriginalFile(file);
                          const preview = URL.createObjectURL(blob);
                          setImagePreview(preview);
                          setShowEditor(true);
                          
                          // Apply default aspect ratio if specified
                          let initialCropData = {
                            x: 10,
                            y: 10,
                            width: 80,
                            height: 80,
                            zoom: 1,
                            rotation: 0
                          };

                          if (defaultAspectRatio === 1) {
                            // Square 1:1 aspect ratio
                            const size = 70;
                            const centerX = (100 - size) / 2;
                            const centerY = (100 - size) / 2;
                            initialCropData = {
                              x: centerX,
                              y: centerY,
                              width: size,
                              height: size,
                              zoom: 1,
                              rotation: 0
                            };
                          }

                          setCropData(initialCropData);
                        })
                        .catch(error => {
                          console.error('❌ Error loading existing image:', error);
                          // Try alternative approach - create image element and convert to canvas
                          const img = new Image();
                          img.crossOrigin = 'anonymous';
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            canvas.toBlob((blob) => {
                              if (blob) {
                                console.log('✅ Image converted via canvas');
                                const file = new File([blob], 'existing-image.jpg', { type: 'image/jpeg' });
                                setOriginalFile(file);
                                const preview = URL.createObjectURL(blob);
                                setImagePreview(preview);
                                setShowEditor(true);
                                
                                // Apply default aspect ratio
                                let initialCropData = {
                                  x: 10,
                                  y: 10,
                                  width: 80,
                                  height: 80,
                                  zoom: 1,
                                  rotation: 0
                                };

                                if (defaultAspectRatio === 1) {
                                  const size = 70;
                                  const centerX = (100 - size) / 2;
                                  const centerY = (100 - size) / 2;
                                  initialCropData = {
                                    x: centerX,
                                    y: centerY,
                                    width: size,
                                    height: size,
                                    zoom: 1,
                                    rotation: 0
                                  };
                                }

                                setCropData(initialCropData);
                              } else {
                                alert('Impossible de charger l\'image pour l\'édition. Veuillez télécharger une nouvelle image.');
                              }
                            }, 'image/jpeg', 0.9);
                          };
                          img.onerror = () => {
                            alert('Impossible de charger l\'image pour l\'édition. Veuillez télécharger une nouvelle image.');
                          };
                          img.src = imageUrl;
                        });
                    } else if (imagePreview && originalFile) {
                      // Re-open editor for already loaded image
                      setShowEditor(true);
                    } else {
                      // No existing image, open file selector
                      fileInputRef.current?.click();
                    }
                  }}
                  title={currentImage && !imagePreview ? "Modifier l'image actuelle" : imagePreview ? "Modifier l'image" : "Ajouter une image"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="image-action-btn replace"
                  onClick={() => fileInputRef.current?.click()}
                  title="Changer l'image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91-6.91a2.12 2.12 0 0 1 0-3l2.83-2.83a2.12 2.12 0 0 1 3 0l.71.71"/>
                    <path d="M11 2a2 2 0 0 0-2 2v6h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="image-action-btn remove"
                  onClick={handleRemove}
                  title="Supprimer l'image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="image-info">
              <small>
                {imagePreview ? (
                  <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                    ✅ Image modifiée et prête à sauvegarder
                  </span>
                ) : (
                  'Image actuelle'
                )}
              </small>
            </div>
          </div>
        ) : showEditor && imagePreview ? (
          <div className="image-editor">
            <div className="editor-header">
              <div className="editor-title">
                <h4>Modifier l'image</h4>
                <div className="editor-help" title="Raccourcis: Échap = Annuler, Ctrl+Entrée = Appliquer, Ctrl+R = Réinitialiser">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <point cx="12" cy="17"/>
                  </svg>
                </div>
              </div>
              <div className="editor-actions">
                <button type="button" className="btn secondary" onClick={handleResetCrop}>
                  Réinitialiser
                </button>
                <button type="button" className="btn secondary" onClick={handleCancelCrop}>
                  Annuler
                </button>
                <button type="button" className="btn primary" onClick={handleSaveCrop}>
                  Appliquer
                </button>
              </div>
            </div>
            
            <div className="editor-content">
              <div className="editor-preview" ref={containerRef}>
                <img
                  ref={imageRef}
                  src={imagePreview}
                  alt="Editor preview"
                  className="editor-image"
                  style={{
                    transform: `scale(${cropData.zoom}) rotate(${cropData.rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                />
                <div
                  className="crop-overlay"
                  style={{
                    left: `${cropData.x}%`,
                    top: `${cropData.y}%`,
                    width: `${cropData.width}%`,
                    height: `${cropData.height}%`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div className="crop-handles">
                    <div className="crop-handle top-left"></div>
                    <div className="crop-handle top-right"></div>
                    <div className="crop-handle bottom-left"></div>
                    <div className="crop-handle bottom-right"></div>
                  </div>
                </div>
              </div>
              
              <div className="editor-controls">
                <div className="control-group">
                  <label>Zoom</label>
                  <div className="zoom-controls">
                    <button 
                      type="button" 
                      onClick={() => setCropData(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))}
                      disabled={cropData.zoom <= 0.5}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={cropData.zoom}
                      onChange={handleZoomChange}
                      className="zoom-slider"
                    />
                    <button 
                      type="button" 
                      onClick={() => setCropData(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.1) }))}
                      disabled={cropData.zoom >= 3}
                    >
                      +
                    </button>
                    <span className="zoom-value">{Math.round(cropData.zoom * 100)}%</span>
                  </div>
                </div>
                
                <div className="control-group">
                  <label>Rotation</label>
                  <div className="rotation-controls">
                    <button type="button" onClick={() => handleRotationChange(-90)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                    </button>
                    <button type="button" onClick={() => handleRotationChange(90)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6"/>
                        <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
                      </svg>
                    </button>
                    <span className="rotation-value">{cropData.rotation}°</span>
                  </div>
                </div>
                
                <div className="control-group">
                  <label>Proportions prédéfinies</label>
                  <div className="aspect-ratio-controls">
                    <button 
                      type="button" 
                      onClick={() => {
                        // Free aspect ratio - reset to center with reasonable size
                        setCropData(prev => ({ 
                          ...prev, 
                          x: 10, 
                          y: 10, 
                          width: 80, 
                          height: 80 
                        }));
                      }}
                      className="aspect-btn"
                    >
                      Libre
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        // Square 1:1 aspect ratio
                        const size = Math.min(80, 80); // Use smaller dimension
                        const centerX = (100 - size) / 2;
                        const centerY = (100 - size) / 2;
                        setCropData(prev => ({ 
                          ...prev, 
                          x: centerX, 
                          y: centerY, 
                          width: size, 
                          height: size 
                        }));
                      }}
                      className="aspect-btn"
                    >
                      1:1
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        // 4:3 aspect ratio
                        const width = 80;
                        const height = (width * 3) / 4; // 4:3 ratio
                        const centerX = (100 - width) / 2;
                        const centerY = (100 - height) / 2;
                        setCropData(prev => ({ 
                          ...prev, 
                          x: centerX, 
                          y: Math.max(0, centerY), 
                          width: width, 
                          height: Math.min(height, 100 - Math.max(0, centerY))
                        }));
                      }}
                      className="aspect-btn"
                    >
                      4:3
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        // 16:9 aspect ratio
                        const width = 80;
                        const height = (width * 9) / 16; // 16:9 ratio
                        const centerX = (100 - width) / 2;
                        const centerY = (100 - height) / 2;
                        setCropData(prev => ({ 
                          ...prev, 
                          x: centerX, 
                          y: Math.max(0, centerY), 
                          width: width, 
                          height: Math.min(height, 100 - Math.max(0, centerY))
                        }));
                      }}
                      className="aspect-btn"
                    >
                      16:9
                    </button>
                  </div>
                </div>
                
                <div className="control-group">
                  <label>Position et Taille</label>
                  <div className="crop-controls">
                    <div className="crop-inputs">
                      <div>
                        <label>X</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={Math.round(cropData.x)}
                          onChange={(e) => handleCropChange('x', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Y</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={Math.round(cropData.y)}
                          onChange={(e) => handleCropChange('y', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Largeur</label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={Math.round(cropData.width)}
                          onChange={(e) => handleCropChange('width', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Hauteur</label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={Math.round(cropData.height)}
                          onChange={(e) => handleCropChange('height', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`image-upload-placeholder ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <p>Cliquez ou glissez une image ici</p>
            <small>JPG, PNG, GIF jusqu'à {(maxSize / 1024 / 1024).toFixed(0)}MB</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;