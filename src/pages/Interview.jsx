import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useAuth } from '../context/AuthContext'
import DraggableOverlay from '../components/DraggableOverlay'
import ShareButtons from '../components/ShareButtons'
import { usePHTracking } from '../hooks/usePHTracking'
import { Zap, MessageSquare, TrendingUp, Eye, EyeOff } from 'lucide-react'
import '../App.css'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
}

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const SESSION_ID = 'interview-copilot-session'
const CONSENT_KEY = 'privacy-consent'
const RESUME_KEY = 'interview-resume'
const SHOW_TIPS_KEY = 'show-interview-tips'

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
  }
  return text.trim()
}

function resumeLabel(fileName, extractedText) {
  if (fileName) {
    const base = fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim()
    if (base) return base
  }
  const firstLine = extractedText?.split(/\n/)[0]?.trim()
  if (firstLine && firstLine.length < 60) return firstLine
  return 'Resume'
}

export default function Interview() {
  const { isLoggedIn, remainingSessions, currentPlan, getAccessToken } = useAuth()
  usePHTracking() // Initialize PH tracking
  const [consent, setConsent] = useState(() => localStorage.getItem(CONSENT_KEY) === 'true')
  const [resume, setResume] = useState(() => localStorage.getItem(RESUME_KEY) || '')
  const [resumeLoadedLabel, setResumeLoadedLabel] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const fileInputRef = useRef(null)
  const [jobUrl, setJobUrl] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [parsing, setParsing] = useState(false)
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOverlay, setShowOverlay] = useState(() => {
    const saved = localStorage.getItem(SHOW_TIPS_KEY)
    return saved === null ? true : saved === 'true'
  })
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const toggleOverlay = () => {
    setShowOverlay((prev) => {
      const newValue = !prev
      localStorage.setItem(SHOW_TIPS_KEY, String(newValue))
      return newValue
    })
  }

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setConsent(true)
  }

  const saveResume = useCallback(async () => {
    localStorage.setItem(RESUME_KEY, resume)
    setError('')
    const token = await getAccessToken()
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch(`${API_URL}/resume`, { method: 'POST', headers, body: new URLSearchParams({ session_id: SESSION_ID, content: resume }) }).catch(() => {})
  }, [resume, getAccessToken])

  const processPdfFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    setError('')
    setPdfExtracting(true)
    try {
      const text = await extractTextFromPdf(file)
      setResume(text || '(No text found in PDF.)')
      setResumeLoadedLabel(resumeLabel(file.name, text))
    } catch (err) {
      setError('PDF could not be read: ' + (err.message || 'Unknown error'))
    } finally {
      setPdfExtracting(false)
    }
  }, [])

  const handleResumeDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processPdfFile(file)
  }
  const handleResumeDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }
  const handleResumeDragLeave = (e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }
  const handleResumeClick = () => fileInputRef.current?.click()
  const handleFileInputChange = (e) => {
    const file = e.target?.files?.[0]
    if (file) processPdfFile(file)
    e.target.value = ''
  }

  const parseJobUrl = async () => {
    if (!jobUrl.trim()) return
    setParsing(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url: jobUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Parse failed')
      setParsedQuestions(data.questions || [])
    } catch (err) {
      setError(err.message || 'URL could not be parsed.')
    } finally {
      setParsing(false)
    }
  }

  const sendAudioChunk = async (blob) => {
    if (!blob || blob.size < 100) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')
      form.append('session_id', SESSION_ID)
      const token = await getAccessToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/stream`, { method: 'POST', headers, body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Stream error')
      setTranscript(data.transcript || '')
      setAnswer(data.answer || '')
      setConfidence(data.confidence ?? 0)
    } catch (err) {
      setError(err.message || 'Audio processing failed.')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) sendAudioChunk(e.data) }
      mr.start(5000)
      setIsRecording(true)
      setError('')
    } catch (err) {
      setError('Microphone access denied: ' + err.message)
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    const stream = streamRef.current
    if (mr?.state !== 'inactive') mr?.stop()
    stream?.getTracks?.().forEach((t) => t.stop())
    mediaRecorderRef.current = null
    streamRef.current = null
    setIsRecording(false)
  }

  useEffect(() => () => stopRecording(), [])

  const canStartSession = currentPlan === 'pro' || remainingSessions > 0

  if (!consent) {
    return (
      <div className="overlay dsgvo-modal">
        <div className="dsgvo-box">
          <h2>Data Processing Consent</h2>
          <p>This app processes audio and resume data to create interview aids. Data is sent to OpenAI for processing and stored locally.</p>
          <p>Please accept the data processing to continue.</p>
          <button className="btn-primary" onClick={acceptConsent}>Accept</button>
        </div>
      </div>
    )
  }

  if (isLoggedIn && !canStartSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Remaining</h2>
          <p className="text-gray-600 mb-4">Upgrade to Pro for unlimited interview sessions.</p>
          <Link to="/dashboard" className="text-indigo-600 font-medium hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay">
      <div className="container">
        <header className="header">
          <h1>AI Interview Copilot</h1>
          <div className="mic-controls">
            {!isRecording ? (
              <button className="btn-mic" onClick={startRecording} title="Start recording">Start</button>
            ) : (
              <button className="btn-mic recording" onClick={stopRecording} title="Stop recording">Stop</button>
            )}
            {loading && <span className="loading-badge">Processing...</span>}
          </div>
        </header>

        <div className="main">
          <section className="left-panel">
            <div className="resume-section">
              <input ref={fileInputRef} type="file" accept="application/pdf" className="resume-file-input" onChange={handleFileInputChange} aria-label="Select PDF" />
              <div
                className={`resume-drop-zone ${isDragOver ? 'resume-drop-zone--over' : ''}`}
                onDrop={handleResumeDrop}
                onDragOver={handleResumeDragOver}
                onDragLeave={handleResumeDragLeave}
                onClick={handleResumeClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleResumeClick()}
              >
                {pdfExtracting ? <span className="resume-drop-text">Reading PDF...</span> : <span className="resume-drop-text">Drop PDF here or click to upload</span>}
              </div>
              {resumeLoadedLabel && <p className="resume-loaded-label">Resume loaded: {resumeLoadedLabel}</p>}
              <div className="resume-actions">
                <button type="button" className="btn-secondary" onClick={saveResume}>Save & Parse</button>
                <button type="button" className="btn-xing" onClick={parseJobUrl} disabled={parsing}>{parsing ? 'Parsing...' : 'Parse Job URL'}</button>
              </div>
            </div>
            <textarea className="resume-textarea" placeholder="Or paste resume text here..." value={resume} onChange={(e) => setResume(e.target.value)} rows={5} aria-label="Resume text" />
            <div className="job-url">
              <label>Job Posting URL</label>
              <input type="url" placeholder="https://linkedin.com/jobs/..." value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
              <button className="btn-secondary" onClick={parseJobUrl} disabled={parsing}>{parsing ? 'Parsing...' : 'Extract Questions'}</button>
            </div>
            {parsedQuestions.length > 0 && (
              <div className="questions-list">
                <h3>Expected Questions</h3>
                <ol>{parsedQuestions.map((q, i) => <li key={i}>{q}</li>)}</ol>
              </div>
            )}
          </section>
          <section className="right-panel">
            <div className="live-answer">
              <h3>Live Answer</h3>
              {transcript && <p className="transcript">"{transcript}"</p>}
              {answer && (
                <>
                  <div className="confidence-bar">
                    <span>Confidence:</span>
                    <div className="bar"><div className="fill" style={{ width: `${confidence}%` }} /></div>
                    <span>{confidence}/100</span>
                  </div>
                  <div className="answer-text">{answer}</div>
                </>
              )}
              {!answer && !transcript && <p className="placeholder">Start recording for real-time answers...</p>}
            </div>
          </section>
        </div>

        {error && <div className="error-banner">{error}</div>}
        
        {/* Share Buttons at bottom */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <ShareButtons variant="compact" />
        </div>
      </div>

      {/* Floating Toggle Button - Show/Hide Tips */}
      {showOverlay ? null : (
        <button
          onClick={toggleOverlay}
          className="fixed bottom-4 right-4 z-[999998] bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
          title="Show Interview Tips"
        >
          <Zap className="h-5 w-5" />
        </button>
      )}

      {/* Draggable AI Copilot Overlay - Shows live tips during interview */}
      {showOverlay && (
        <DraggableOverlay onClose={toggleOverlay}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">Live Interview Tips</span>
              </div>
              <button
                onClick={toggleOverlay}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Hide tips for this session"
              >
                <EyeOff className="h-3 w-3" />
                Hide
              </button>
            </div>
            
            {isRecording && (
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording Active</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Speak clearly and use STAR method for behavioral questions.
                </p>
              </div>
            )}

            {answer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Suggestion</span>
                </div>
                <p className="text-sm bg-muted rounded p-2">{answer.slice(0, 200)}{answer.length > 200 ? '...' : ''}</p>
                <div className="flex items-center gap-2 text-amber-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Confidence: {confidence}%</span>
                </div>
              </div>
            )}

            {!isRecording && !answer && (
              <div className="text-sm text-muted-foreground">
                <p>Click "Start" to begin recording and get real-time AI suggestions.</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Keep your answers concise (30-90 seconds)</li>
                  <li>• Use STAR method for behavioral questions</li>
                  <li>• Maintain eye contact with camera</li>
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>💡 Drag this overlay anywhere on screen</p>
            </div>
          </div>
        </DraggableOverlay>
      )}
    </div>
  )
}
