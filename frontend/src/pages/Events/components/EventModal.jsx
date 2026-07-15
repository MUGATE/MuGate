import React, { useState, useEffect } from 'react';
import EventDatePicker from './EventDatePicker';

const EventModal = ({ isOpen, onClose, editingEvent, onSave, todayStr }) => {
  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formCategory, setFormCategory] = useState("workshop");
  const [formLocation, setFormLocation] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formRegUrl, setFormRegUrl] = useState("");
  const [formIsFree, setFormIsFree] = useState(true);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        const typeToCategory = {
          workshop: "workshop", hackathon: "hackathon", competition: "competition",
          talk: "talk", meetup: "meetup", other: "other"
        };
        setFormTitle(editingEvent.title || "");
        setFormDesc(editingEvent.description || "");
        setFormStartDate(editingEvent.date || "");
        setFormCategory(typeToCategory[editingEvent.type] || "workshop");
        setFormLocation(editingEvent.location || "");
        setFormOrganizer(editingEvent.organizer || "");
        setFormImageUrl(editingEvent.imageUrl || "");
        setFormRegUrl(editingEvent.registrationUrl || "");
        setFormIsFree(editingEvent.isFree ?? true);
        
        if (editingEvent.imageUrl) {
          if (editingEvent.imageUrl.startsWith("data:")) {
            setDroppedFile({
              name: "Attached File",
              size: "Embedded Data",
              dataUrl: editingEvent.imageUrl,
              type: editingEvent.imageUrl.includes("image/") ? "image/png" : "application/octet-stream"
            });
          } else {
            setDroppedFile({
              name: "Current Image Link",
              size: "Remote URL",
              dataUrl: editingEvent.imageUrl,
              type: "image/png"
            });
          }
        } else {
          setDroppedFile(null);
        }
      } else {
        setFormTitle("");
        setFormDesc("");
        setFormStartDate("");
        setFormCategory("workshop");
        setFormLocation("");
        setFormOrganizer("");
        setFormImageUrl("");
        setFormRegUrl("");
        setFormIsFree(true);
        setDroppedFile(null);
      }
    }
  }, [isOpen, editingEvent]);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 800;
        const MAX_H = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
        if (h > MAX_H) { w = Math.round(w * MAX_H / h); h = MAX_H; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const compressedSize = Math.round(compressedDataUrl.length * 0.75 / 1024);
        setDroppedFile({
          name: file.name,
          size: compressedSize + " KB (compressed)",
          dataUrl: compressedDataUrl,
          type: "image/jpeg"
        });
        setFormImageUrl(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setDroppedFile(null);
    setFormImageUrl("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedDate = new Date(formStartDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("You cannot schedule or add events with a date in the past.");
      return;
    }

    onSave({
      title: formTitle,
      description: formDesc,
      location: formLocation,
      startDate: selectedDate,
      category: formCategory,
      tags: "",
      organizer: formOrganizer,
      imageUrl: formImageUrl,
      externalUrl: formRegUrl,
      isFree: formIsFree,
    });
  };

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="ev-modal-title">
          {editingEvent ? "Edit Pinned Event" : "Pin New Event"}
        </h2>
        <form onSubmit={handleSubmit} className="ev-modal-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Description</label>
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Start Date *</label>
              <EventDatePicker
                value={formStartDate}
                onChange={setFormStartDate}
                minDate={todayStr}
                required
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Category *</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="competition">Competition</option>
                <option value="talk">Talk / Conference</option>
                <option value="meetup">Networking / Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={e => setFormLocation(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Organizer</label>
              <input
                type="text"
                value={formOrganizer}
                onChange={e => setFormOrganizer(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Event Image / Document Attachment</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                background: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <input
                type="file"
                id="event-file-upload"
                multiple={false}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              
              {droppedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    {droppedFile.type && droppedFile.type.startsWith('image/') ? (
                      <img
                        src={droppedFile.dataUrl}
                        alt="Preview"
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#475569', fontWeight: 'bold', fontSize: '10px' }}>
                        FILE
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{droppedFile.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{droppedFile.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{ padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="event-file-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', color: '#94a3b8' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Drag & Drop or <span style={{ color: '#3b82f6', fontWeight: '600' }}>Browse</span>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Supports Images, PDF, Word Documents</p>
                  </div>
                </label>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Registration URL</label>
            <input
              type="text"
              placeholder="https://example.com/register"
              value={formRegUrl}
              onChange={e => setFormRegUrl(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="formIsFree"
              checked={formIsFree}
              onChange={e => setFormIsFree(e.target.checked)}
            />
            <label htmlFor="formIsFree" style={{ fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>This event is free</label>
          </div>
          <div className="ev-modal-actions">
            <button type="button" className="ev-modal-btn ev-modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ev-modal-btn ev-modal-btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
