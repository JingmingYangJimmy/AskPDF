# AskPDF (Next AI)

AskPDF lets you upload a PDF and ask natural-language questions about its content. It uses Retrieval-Augmented Generation (RAG) powered by LangChain and OpenAI to find relevant passages and generate concise answers. The UI supports both text and voice-driven conversations.

## What this project does

- Drag-and-drop PDF upload (client) → stored on the Node/Express server
- Splits the PDF into chunks, embeds them with OpenAI embeddings, and stores them in an in-memory vector store (server)
- Runs a RetrievalQA chain with `gpt` to answer your question using the most relevant chunks
- Chat mode with speech-to-text (question) and text-to-speech (answer)

## Tech stack

- Frontend: React 18, Ant Design, axios, react-speech-recognition, speak-tts
- Backend: Node.js/Express, multer (file upload), pdf-parse via LangChain `PDFLoader`, LangChain (text splitter, embeddings, vector store, RetrievalQA)
- LLM/Embeddings: OpenAI (ChatOpenAI + OpenAIEmbeddings)

## Architecture overview

1. User uploads a PDF from the React app (`PdfUploader`) to `POST /upload`.
2. Server stores it under `server/uploads/` and remembers the latest uploaded file path.
3. When the user asks a question (`ChatComponent` → `GET /chat?question=...`), the server:
   - Loads the PDF with LangChain `PDFLoader`
   - Splits the content into chunks (size 500, overlap 0) via `RecursiveCharacterTextSplitter`
   - Creates embeddings with `OpenAIEmbeddings` and stores them in a `MemoryVectorStore`
   - Uses `RetrievalQAChain` + `ChatOpenAI` with a concise-answer prompt
   - Returns the answer text
4. If Chat Mode is ON, the client speaks the answer back via `speak-tts` and resumes listening.

Note: The vector store is created fresh per question and is in-memory only. This is simple and great for demos, but not optimized for large PDFs or repeated queries.

## Project structure

```
AskPDF/
├── public/                # CRA public assets
├── server/                # Node/Express backend
│   ├── server.js          # Express app, file upload and chat endpoints
│   ├── chat.js            # LangChain pipeline (PDF → chunks → embeddings → QA)
│   ├── uploads/           # Saved PDFs
│   └── package.json
├── src/                   # React frontend
│   ├── App.js             # Shell layout, wires uploader, chat, and Q/A render
│   ├── components/
│   │   ├── PdfUploader.js # Drag-and-drop uploader (AntD Dragger)
│   │   ├── ChatComponent.js# Search bar, chat mode, speech in/out
│   │   └── RenderQA.js    # Conversation transcript UI
│   └── index.js
├── package.json           # Root scripts (client + dev orchestration)
└── README.md
```

### Run the app (client + server)

From the project root, run both concurrently:

```bash
npm run dev
```

This starts:

- React app at http://localhost:3000
- Express server at http://localhost:5001

## API

### POST /upload

Uploads a PDF to the server.

- Content-Type: `multipart/form-data`
- Field name: `file`

Response: plain text file path (example: `uploads/my.pdfupload successfully.`)

### GET /chat

Asks a question about the last uploaded PDF.

Query params:

- `question` (string) – the user’s question

Response: plain text answer string

## Key components

- `src/components/PdfUploader.js` – AntD Dragger component; posts the file to `${REACT_APP_DOMAIN}/upload`.
- `src/components/ChatComponent.js` – Text input and Chat Mode toggle. In Chat Mode it uses:
  - `react-speech-recognition` for microphone input
  - `speak-tts` to read answers aloud and resume listening
- `src/components/RenderQA.js` – Renders the Q/A transcript and a loading spinner.
- `server/chat.js` – LangChain pipeline using `PDFLoader`, `RecursiveCharacterTextSplitter`, `OpenAIEmbeddings`, `MemoryVectorStore`, and `RetrievalQAChain` with a concise-answer prompt.
- `server/server.js` – Express app with `/upload` and `/chat` endpoints; last uploaded file path is used for all subsequent questions.

## Ideas for improvements

- Persist embeddings to a vector DB and reuse across questions
- Support multiple PDFs and per-user sessions
- Streaming answers and token-by-token UI
- Document and handle non-PDF uploads gracefully
- Add auth and rate limiting
