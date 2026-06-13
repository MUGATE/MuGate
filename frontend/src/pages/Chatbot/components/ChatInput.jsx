import React from 'react';
import {
  Sparkles, X, Paperclip, Brain, Send, Mic, Image as ImageIcon, FileText
} from 'lucide-react';

const ChatInput = ({
  inputRef,
  inputText,
  setInputText,
  handleKeyDown,
  isLoading,
  isInitializing,
  isEnhancing,
  handleEnhancePrompt,
  attachedFiles,
  removeAttachedFile,
  isRecording,
  recordingSeconds,
  formatRecordingTime,
  handleVoiceRecord,
  fileInputRef,
  handleFileSelect,
  reasoningEnabled,
  setReasoningEnabled,
  handleSendMessage
}) => {
  return (
    <div className="chatbox-wrapper">
      <div className="chatbox-inner" onWheel={(e) => e.stopPropagation()}>
        <div className="chatbox-input-row">
          <button
            className={`enhance-prompt-btn${isEnhancing ? ' enhancing' : ''}${!inputText.trim() ? ' disabled' : ''}`}
            onClick={handleEnhancePrompt}
            disabled={!inputText.trim() || isEnhancing || isLoading}
            title={inputText.trim() ? 'Enhance prompt with AI' : 'Type a prompt first to enhance it'}
          >
            <Sparkles size={18} />
          </button>
          <textarea
            ref={inputRef}
            placeholder="Initiate a query or send a command to the AI..."
            className="chatbox-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isInitializing}
            rows={1}
          />
        </div>

        {/* Attachment preview chips */}
        {attachedFiles.length > 0 && (
          <div className="attachment-preview-row">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="attachment-chip">
                {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                <span className="attachment-name">
                  {file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}
                </span>
                <button className="attachment-remove" onClick={() => removeAttachedFile(idx)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recording overlay bar — shows above normal actions when recording */}
        {isRecording && (
          <div className="recording-bar">
            <div className="recording-dot-wrapper">
              <span className="recording-dot"></span>
              <span className="recording-dot-ring"></span>
            </div>
            <span className="recording-label">Recording</span>
            <span className="recording-timer">{formatRecordingTime(recordingSeconds)}</span>
            <div className="recording-bar-center">
              <div className="waveform-bars">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <button
              className="recording-stop-btn"
              onClick={handleVoiceRecord}
              title="Stop recording"
            >
              <Mic size={16} />
              <span>Stop</span>
            </button>
          </div>
        )}

        {/* Normal actions row — hidden while recording */}
        {!isRecording && (
          <div className="chatbox-actions-row">
            <div className="chatbox-left-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
              />
              <button
                className="action-btn icon-only"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file (PDF, DOCX, Image)"
              >
                <Paperclip size={18} />
              </button>
              <button
                className={`action-btn pill-btn${reasoningEnabled ? ' reasoning-active' : ''}`}
                onClick={() => setReasoningEnabled(prev => !prev)}
                title={reasoningEnabled ? 'Reasoning mode ON — click to disable' : 'Enable reasoning mode for detailed analysis'}
              >
                <Brain size={16} />
                <span>Reasoning</span>
              </button>
            </div>

            <div className="chatbox-right-actions">
              {(inputText.trim() || attachedFiles.length > 0) ? (
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
                  <Send size={20} />
                </button>
              ) : (
                <button
                  className="mic-btn"
                  onClick={handleVoiceRecord}
                  title="Start voice input"
                >
                  <Mic size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
