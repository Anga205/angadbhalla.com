/**
 * AngaDriveV3 write-up data.
 *
 * The page at `/projects/angadrive` is a technical case study, so it needs two
 * things that do not belong inline in a component: the page metadata used by
 * `Seo.astro`, and the code snippets, which are easier to review when they sit
 * together rather than scattered through markup.
 *
 * The snippets are **illustrative and corrected**. They reconstruct the
 * patterns the project uses (in-RAM indexes, bounded job runners, chunked
 * uploads, negotiated pre-compressed assets) in valid Go and TypeScript rather
 * than quoting a build of the repository verbatim. Function and file names
 * follow the ones the project's own modules use.
 */
import type { GalleryImage } from '../lib/images';

import benchmarks from '../assets/angadrive/benchmarks.png';
import dashboard from '../assets/angadrive/dashboard.png';
import github from '../assets/angadrive/github.jpeg';

/** Page-level metadata. Consumed by the route's frontmatter. */
export const ANGADRIVE_META = {
	name: 'AngaDriveV3',
	title: 'Angad Bhalla — AngaDriveV3: a performance-first file host in Go',
	description:
		'A technical case study of AngaDriveV3: a Go file host that keeps its working set in RAM over SQLite, drives a SolidJS client over one WebSocket, and bounds every expensive job.',
	keywords: [
		'AngaDriveV3',
		'self-hosted file hosting',
		'Go file server',
		'SolidJS',
		'SQLite in-memory cache',
		'Gorilla WebSocket',
		'chunked resumable uploads',
		'content-addressed storage',
		'SHA-256 deduplication',
		'bounded concurrency job queue',
		'ffmpeg animated WebP preview',
		'Brotli pre-compressed assets',
		'Linux systems engineering',
		'high performance web application',
	],
	/** ISO date the report was last revised. */
	updated: '2026-11-17',
} as const;

/**
 * Screenshots for the report's gallery.
 *
 * The alt text is written to stand on its own: it describes the layout and
 * quotes the numbers the images show, so a crawler or a screen reader gets the
 * same evidence a sighted reader does. Captions are the short label shown
 * under the lightbox.
 */
export const ANGADRIVE_GALLERY: GalleryImage[] = [
	{
		src: dashboard,
		alt: 'Dark-mode Drive V3 dashboard showing caching, file previews, and ultra-secure feature cards, a site activity line chart peaking near 1,600 on Oct 29, RAM usage at 0.44 GB of 8.00 GB, CPU usage at 2.0%, counters for 172 users and 4,136 files hosted, a space-used chart climbing from 112.0 GB to about 114.3 GB, and a blue geometric wireframe butterfly illustration.',
		caption: 'the Drive V3 dashboard: live metrics, activity, and storage',
	},
	{
		src: benchmarks,
		alt: 'Dark infographic titled AngaDrive Benchmarks with three horizontal bar charts comparing AngaDrive in blue against Google Drive, MediaFire, and Dropbox in grey. Time to first byte: AngaDrive 0.098s, Google Drive 0.452s, Dropbox 0.958s, MediaFire 0.991s. Large 1 GB uploads: AngaDrive 1m 28s, Google Drive 1m 39s, MediaFire 1m 47s, Dropbox 5m 29s. Ten 100 MB files: AngaDrive 1m 23s, Google Drive 1m 57s, MediaFire 3m 10s, Dropbox 5m 33s.',
		caption: 'benchmarks against Google Drive, Dropbox, and MediaFire',
	},
	{
		src: github,
		alt: 'GitHub repository preview card for Anga205/AngaDriveV3 on a white background with a blue bottom border. The description reads: the codebase for AngaDrive, a remote file storage web application, built mostly to optimize speed, performance and user experience. Stats show 3 contributors, 17 issues, 11 stars, and 1 fork, with a dark profile photo of the developer in the top right and the GitHub logo in the bottom right.',
		caption: 'the repository: Go, SolidJS, and the integration suite',
	},
];

/**
 * Snippets, keyed by id.
 *
 * Kept as plain strings so the component can pass them straight to
 * `CodeBlock.astro`, which owns highlighting.
 */
export const SNIPPETS = {
	/* ---------------------------------------------------------------------
	   Architecture
	   --------------------------------------------------------------------- */
	architecture: `  browser (SolidJS SPA)
  one bundle, one socket
        |
        |  WebSocket  (JSON frames, both directions)
        |  HTTP       (chunk upload, asset download)
        v
  Go server (gin)
  +---------------------------------------------------+
  |  requestHandler   dispatch, pulses                |
  |  endpoints        upload, previews, static files  |
  |  runners          bounded queue -> ffmpeg/imaging |
  +---------------------------------------------------+
        |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
  RAM indexes        SQLite (durable)   uploaded_files/
  maps + sets        gorm, WAL          i/<sha256>.<ext>

  assets host (ASSETS_URL)
  /i/:id   /preview-image/:id   /preview-video/:id`,

	envExample: `# required
export WEB_URL=drive.example.com      # the app origin, and the only allowed WS origin
export ASSETS_URL=i.example.com       # separate origin for user content (XSS isolation)

# optional, with defaults
export PORT=8080
export GIN_MODE=release               # release logging, strict CORS
export SAVE_DRIVE_RAM=false           # true = slightly better RAM use, slightly worse latency
export MAX_RUNNER_COUNT=5             # concurrent compute-heavy jobs
export MAX_QUEUE_SIZE=100             # backlog before submissions are rejected
export RAM_AVAILABLE=17179869184      # override detected memory, in bytes`,

	/* ---------------------------------------------------------------------
	   Socket dispatch
	   --------------------------------------------------------------------- */
	dispatch: `// requestHandler/dispatch.go
switch messageType {
case "login":
    processRequest(conn, data, accounts.LoginUser, "login_response")
case "get_user_files":
    handleGetUserFiles(conn, data)
case "get_collection":
    handleGetCollection(conn, data)
case "delete_file":
    handleDeleteFile(conn, data)
case "bulk_delete_files":
    processRequest(conn, data, BulkDeleteFile, "bulk_delete_files_response")
case "convert_video":
    processRequest(conn, data, HandleConversionRequest, "convert_video_response")
case "convert_image":
    processRequest(conn, data, HandleImageConversionRequest, "convert_image_response")
}`,

	/* ---------------------------------------------------------------------
	   Database layer
	   --------------------------------------------------------------------- */
	caches: `// database/caches.go
var (
    FileCache     = map[string]FileData{}
    FileCacheLock sync.RWMutex

    CollectionCache     = map[string]Collection{}
    CollectionCacheLock sync.RWMutex

    // token -> the files that account owns
    UserFiles      = map[string]*FileSet{}
    UserFilesMutex sync.RWMutex

    // collection id -> the files inside it
    CollectionFiles      = map[string]*FileSet{}
    CollectionFilesMutex sync.RWMutex

    // collection id -> its direct children
    CollectionFolders      = map[string]*CollectionSet{}
    CollectionFoldersMutex sync.RWMutex
)

// A set with zero-allocation membership checks. Only the key matters, so the
// value is an empty struct.
type FileSet struct {
    mu   sync.RWMutex
    data map[string]struct{}
}

func (s *FileSet) Add(key string) {
    s.mu.Lock()
    s.data[key] = struct{}{}
    s.mu.Unlock()
}

func (s *FileSet) Remove(key string) {
    s.mu.Lock()
    delete(s.data, key)
    s.mu.Unlock()
}

func (s *FileSet) Keys() []string {
    s.mu.RLock()
    defer s.mu.RUnlock()
    keys := make([]string, 0, len(s.data))
    for key := range s.data {
        keys = append(keys, key)
    }
    return keys
}`,

	loadCache: `// database/load.go
// Eight loaders run concurrently; the server does not accept traffic until
// every index is warm.
func LoadCache() {
    var wg sync.WaitGroup
    wg.Add(8)

    go func() { defer wg.Done(); loadUserFiles() }()
    go func() { defer wg.Done(); loadUserCollections() }()
    go func() { defer wg.Done(); loadCollectionFiles() }()
    go func() { defer wg.Done(); loadCollectionFolders() }()
    go func() { defer wg.Done(); loadFiles() }()
    go func() { defer wg.Done(); loadCollections() }()
    go func() { defer wg.Done(); loadAccountsByEmail() }()
    go func() { defer wg.Done(); loadAccountsByToken() }()

    wg.Wait()
}`,

	getFile: `// database/file_fetch.go
// Cache-first read. A hit costs a read lock and a map lookup; a miss returns
// the SQLite row immediately and repopulates the index in the background, so
// the caller never waits for the write.
func GetFile(fileDirectory string) (FileData, error) {
    FileCacheLock.RLock()
    data, ok, err := unsafeGetFile(fileDirectory)
    FileCacheLock.RUnlock()
    if err != nil {
        return FileData{}, err
    }
    if ok {
        return data, nil
    }

    go func() {
        FileCacheLock.Lock()
        defer FileCacheLock.Unlock()
        if data, ok, err := unsafeGetFile(fileDirectory); err == nil && ok {
            FileCache[fileDirectory] = data
        }
    }()

    return data, nil
}`,

	insert: `// database/insert.go
// Write-through. When Insert returns, every subsequent read observes the new
// row — RAM and SQLite never disagree for longer than the duration of the call.
func (file FileData) Insert() error {
    if err := GetDB().Create(&file).Error; err != nil {
        return err
    }

    UserFilesMutex.Lock()
    if set, ok := UserFiles[file.AccountToken]; ok {
        set.Add(file.FileDirectory)
    }
    UserFilesMutex.Unlock()

    FileCacheLock.Lock()
    FileCache[file.FileDirectory] = file
    FileCacheLock.Unlock()

    return nil
}`,

	/* ---------------------------------------------------------------------
	   Locks
	   --------------------------------------------------------------------- */
	lockOrder: `// database/size.go
//
// Locks are always acquired in this order. Anything that needs several of them
// takes them as a group, in the order below, and releases in reverse.
//
//   1. CollectionCacheLock
//   2. CollectionFilesMutex
//   3. CollectionFoldersMutex
//   4. FileCacheLock
//   5. UserFilesMutex
//   6. UserAccountsByEmailMutex
//   7. UserAccountsByTokenMutex`,

	guaranteeLocks: `// database/caches.go
// Every helper named unsafe* documents that the caller must already hold the
// relevant locks. This turns a violated contract into an immediate panic in
// development instead of a data race in production: if the lock is still free,
// nobody held it.
func guaranteeLocks(locks ...*sync.RWMutex) {
    for _, lock := range locks {
        if lock.TryLock() {
            panic("unsafe function called without the required lock")
        }
    }
}`,

	/* ---------------------------------------------------------------------
	   Relationships
	   --------------------------------------------------------------------- */
	collectionSize: `// database/size.go
// Recursive size with cycle protection and cross-branch deduplication: a file
// that lives in two sub-collections is counted once, and a collection graph
// with a cycle terminates.
func unsafeCalculateCollectionSize(
    collection Collection,
    seenCollections map[string]bool,
    seenFiles map[string]bool,
) int {
    seenCollections[collection.ID] = true

    total := 0
    for _, fileDirectory := range unsafeGetCollectionFiles(collection.ID) {
        file, ok, err := unsafeGetFile(fileDirectory)
        if err != nil || !ok || seenFiles[fileDirectory] {
            continue
        }
        seenFiles[fileDirectory] = true
        total += int(file.FileSize)
    }

    for _, childID := range unsafeGetCollectionFolders(collection.ID) {
        if seenCollections[childID] {
            continue
        }
        child, ok, err := unsafeGetCollection(childID)
        if err != nil || !ok {
            continue
        }
        total += unsafeCalculateCollectionSize(child, seenCollections, seenFiles)
    }

    return total
}`,

	/* ---------------------------------------------------------------------
	   Uploads
	   --------------------------------------------------------------------- */
	uploadClient: `// web/src/pages/MyDrive/shared/uploadChunks.ts
const CHUNK_SIZE = 7 * 1024 * 1024;         // 7 MB
const MAX_CONCURRENT_CHUNKS_PER_FILE = 6;   // in-flight chunks per upload
const MAX_CONCURRENT_UPLOADS = 3;           // files at once

async function uploadChunk(file: File, index: number, uploadId: string) {
  const start = index * CHUNK_SIZE;
  const slice = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));

  // Compression happens in the browser, so the wire carries less than the
  // file does. On typical documents this is the single biggest upload win.
  const compressed = await new Response(
    new Blob([slice]).stream().pipeThrough(new CompressionStream('gzip')),
  ).blob();

  const body = new FormData();
  body.append('chunk', compressed, \`\${file.name}.gz\`);
  body.append('chunkIndex', String(index));

  const response = await fetch(apiUrl(\`/upload/\${uploadId}\`), {
    method: 'POST',
    body,
    signal: controller.signal,   // pause / cancel
  });
  if (!response.ok) throw new Error(\`chunk \${index}: \${response.status}\`);
}`,

	uploadServer: `// endpoints/upload.go
// Finalize: concatenate the chunks, hash them in the same pass, then move the
// finished file into place with a single rename.
func finalizeUpload(c *gin.Context) {
    temp, err := os.CreateTemp(chunkDir, "upload-*.tmp")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer os.Remove(temp.Name())

    for i := 0; i < totalChunks; i++ {
        chunk, err := os.Open(filepath.Join(chunkDir, strconv.Itoa(i)))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "missing chunk"})
            return
        }
        if _, err := io.Copy(temp, chunk); err != nil {
            chunk.Close()
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        chunk.Close()
    }

    // One pass over the assembled file: no second read for hashing.
    if _, err := temp.Seek(0, io.SeekStart); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    hash := sha256.New()
    if _, err := io.Copy(hash, temp); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    sum := hex.EncodeToString(hash.Sum(nil))

    // Content-addressed path: identical bytes land on the same filename, so
    // deduplication is a rename, not a copy.
    finalPath := filepath.Join(uploadDir, "i", sum+strings.ToLower(filepath.Ext(name)))
    if err := temp.Close(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if err := os.Rename(temp.Name(), finalPath); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    record := database.FileData{
        FileDirectory: sum + strings.ToLower(filepath.Ext(name)),
        OriginalFileName: name,
        FileSize: int64(totalBytes),
        Sha256sum: sum,
        AccountToken: token,
        Timestamp: time.Now().Unix(),
    }
    if err := record.Insert(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"file_directory": record.FileDirectory})
}`,

	/* ---------------------------------------------------------------------
	   Runners
	   --------------------------------------------------------------------- */
	runnerManager: `// runners/runners.go
// A bounded work queue. The buffered channel is the backlog, the semaphore is
// the concurrency limit, and inFlight is the deduplication key.
type Manager struct {
    queue     chan queuedJob
    semaphore chan struct{}
    inFlight  sync.Map           // job.ID() -> struct{}
    runners   map[string]Runner
    notifier  Notifier           // decoupled from the WebSocket layer
}

func NewManager(maxRunners, maxQueue int, notifier Notifier) *Manager {
    m := &Manager{
        queue:     make(chan queuedJob, maxQueue),
        semaphore: make(chan struct{}, maxRunners),
        runners:   map[string]Runner{},
        notifier:  notifier,
    }
    go m.worker()
    return m
}

// Submit never blocks: a full queue is backpressure, not a stall.
func (m *Manager) Submit(runnerName string, job Job) error {
    if _, loaded := m.inFlight.LoadOrStore(job.ID(), struct{}{}); loaded {
        return fmt.Errorf("job %s already queued or running", job.ID())
    }
    select {
    case m.queue <- queuedJob{runnerName: runnerName, job: job}:
        return nil
    default:
        m.inFlight.Delete(job.ID())
        return fmt.Errorf("runner queue is full")
    }
}`,

	runnerWorker: `// runners/runners.go
// One dispatcher goroutine; each job gets its own goroutine but must hold a
// semaphore slot, so CPU-heavy work cannot starve request handling.
func (m *Manager) worker() {
    for queued := range m.queue {
        m.semaphore <- struct{}{}
        go func(queued queuedJob) {
            defer func() { <-m.semaphore }()
            defer m.inFlight.Delete(queued.job.ID())
            if err := m.runners[queued.runnerName].Run(queued.job); err != nil {
                m.notifier.Notify("runner_error", queued.runnerName, err.Error())
            }
        }(queued)
    }
}`,

	videoPreview: `// previews/video_preview.go
const (
    videoPreviewMaxDuration = 15.0  // seconds of preview, sped up if the source is longer
    videoPreviewFPS         = 24
    videoPreviewMaxDim      = 350   // longest edge, pixels
    videoPreviewQuality     = 80    // libwebp_anim quality
    videoPreviewCompression = 6     // encoder effort
)

// Animated WebP instead of GIF: full colour, no 256-colour banding, and
// roughly an order of magnitude smaller for the same clip.
func (r *VideoPreviewRunner) Run(job Job) error {
    duration := probeDuration(job.File)

    speed := 1.0
    if duration > videoPreviewMaxDuration {
        speed = duration / videoPreviewMaxDuration
    }

    filter := fmt.Sprintf(
        "setpts=PTS/%v,fps=%d,scale=%d:%d:force_original_aspect_ratio=decrease:flags=lanczos",
        speed, videoPreviewFPS, videoPreviewMaxDim, videoPreviewMaxDim,
    )

    return exec.Command("ffmpeg",
        "-y", "-v", "error",
        "-i", inputPath(job.File),
        "-vf", filter,
        "-t", strconv.FormatFloat(videoPreviewMaxDuration, 'f', -1, 64),
        "-c:v", "libwebp_anim",
        "-quality", strconv.Itoa(videoPreviewQuality),
        "-compression_level", strconv.Itoa(videoPreviewCompression),
        "-loop", "0",
        "-an",
        outputPath(job.File),
    ).Run()
}`,

	imagePreview: `// previews/image_preview.go
// Images are decoded with EXIF orientation applied, resized once, and encoded
// as PNG only when they actually carry transparency.
func generateImagePreview(file database.FileData, previewPath string) error {
    img, err := decodeImage(file)   // handles JPEG, PNG, WebP, HEIC/HEIF
    if err != nil {
        return err
    }
    img = resizeToMaxDimension(img, 512)

    temp, err := os.CreateTemp(filepath.Dir(previewPath), "preview-*.tmp")
    if err != nil {
        return err
    }
    defer os.Remove(temp.Name())

    if imageHasTransparency(img) {
        err = imaging.Encode(temp, img, imaging.PNG,
            imaging.PNGCompressionLevel(png.BestCompression))
    } else {
        err = imaging.Encode(temp, img, imaging.JPEG, imaging.JPEGQuality(80))
    }
    if err != nil {
        temp.Close()
        return err
    }
    if err := temp.Close(); err != nil {
        return err
    }

    // Never hand back a preview that is larger than the original.
    if info, err := os.Stat(previewPath); err == nil && info.Size() >= file.FileSize {
        return copyFile(originalPath(file), previewPath)
    }
    return os.Rename(temp.Name(), previewPath)
}`,

	backfill: `// runners/backfill.go
// Previews for existing libraries are generated only when the machine has
// nothing better to do.
func StartBackfillLoop(m *Manager) {
    go func() {
        for {
            m.WaitIdle()   // queue empty and no job running

            job, found := nextVideoWithoutPreview()
            if !found {
                time.Sleep(5 * time.Second)
                continue
            }
            _ = m.Submit("video_preview", job)
        }
    }()
}`,

	/* ---------------------------------------------------------------------
	   Frontend
	   --------------------------------------------------------------------- */
	observer: `// web/src/components/FilePreview.tsx
// A thumbnail is only requested when its card is actually about to be seen.
// The observer is disconnected after the first intersection, so scrolling back
// up does not re-trigger it.
const [visible, setVisible] = createSignal(false);

onMount(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      setVisible(true);
      markLoaded(props.file.file_directory); // session-wide "already fetched" set
      observer.disconnect();
    },
    { root: scrollParent(el), rootMargin: '200px 0px', threshold: 0.01 },
  );
  observer.observe(el);
  onCleanup(() => observer.disconnect());
});`,

	pulse: `// web/src/library/functions.tsx
// The server is the source of truth; the client applies pulses in place rather
// than refetching the list.
const handlePulse = (message: { type: string; data: FileData & PulseFlags }) => {
  if (message.type !== 'file_update') return;

  const file = message.data;

  if (file.toggle === true) {
    // new file
    setFiles((prev) => [file, ...prev]);
  } else if (file.toggle === false) {
    // deleted
    setFiles((prev) => prev.filter((f) => f.file_directory !== file.file_directory));
  } else {
    // replaced (rename, conversion, collection move)
    setFiles((prev) =>
      prev.map((f) => (f.file_directory === file.file_directory ? file : f)),
    );
  }
};`,

	/* ---------------------------------------------------------------------
	   Assets and build
	   --------------------------------------------------------------------- */
	cachedFile: `// endpoints/frontend_cache.go
// Every static file is compressed once at startup and held in memory, so a
// request costs a header negotiation and a write — never a gzip call.
type CachedFile struct {
    Raw         []byte
    Gzip        []byte
    Brotli      []byte
    ContentType string
}

func loadFrontendCache(distPath string) (map[string]CachedFile, error) {
    cache := map[string]CachedFile{}

    err := filepath.Walk(distPath, func(path string, info os.FileInfo, err error) error {
        if err != nil || info.IsDir() {
            return err
        }
        raw, err := os.ReadFile(path)
        if err != nil {
            return err
        }

        cached := CachedFile{Raw: raw, ContentType: detectContentType(path)}
        if isCompressible(cached.ContentType) {
            cached.Gzip = compressGzip(raw)      // gzip.BestCompression
            cached.Brotli = compressBrotli(raw)  // brotli level 11
        }

        relative, err := filepath.Rel(distPath, path)
        if err != nil {
            return err
        }
        cache[relative] = cached
        return nil
    })

    return cache, err
}`,

	negotiate: `// endpoints/frontend_cache.go
// RFC 7231 q-values, best match wins; the response always varies on the header
// so a shared cache cannot hand the wrong encoding to the next visitor.
func negotiateEncoding(header string, file CachedFile) (string, []byte) {
    type candidate struct {
        name   string
        weight float64
        body   []byte
    }

    candidates := []candidate{
        {"br", 0, file.Brotli},
        {"gzip", 0, file.Gzip},
        {"identity", 1, file.Raw},
    }

    for i, candidate := range candidates {
        candidates[i].weight = weightFor(header, candidate.name, candidate.name == "identity")
    }

    best := candidates[2]
    for _, candidate := range candidates {
        if candidate.body == nil {
            continue
        }
        if candidate.weight > 0 && candidate.weight >= best.weight {
            best = candidate
        }
    }

    return best.name, best.body
}`,

	frontendHash: `// endpoints/frontend.go
// The binary rebuilds the client only when the sources actually changed. The
// hash covers relative paths and contents, so adding, removing, or editing a
// file all invalidate the cached build.
func SetupFrontend(r *gin.Engine) error {
    want, err := hashFrontendSource("web")
    if err != nil {
        return err
    }

    stored, _ := os.ReadFile(filepath.Join(distPath, ".frontend-hash"))
    if string(stored) == want {
        return loadFrontendCache(distPath)
    }

    if err := run("bun", "install"); err != nil {
        return err
    }
    if err := run("bun", "run", "build"); err != nil {
        return err
    }

    if err := os.RemoveAll(distPath); err != nil {
        return err
    }
    if err := os.Rename(filepath.Join("web", "dist"), distPath); err != nil {
        return err
    }

    if err := os.WriteFile(filepath.Join(distPath, ".frontend-hash"), []byte(want), 0o644); err != nil {
        return err
    }

    return loadFrontendCache(distPath)
}`,

	/* ---------------------------------------------------------------------
	   CI
	   --------------------------------------------------------------------- */
	ci: `# .github/workflows/integration.yml (shape of the job graph)
jobs:
  discover:
    # list the Python integration tests
  frontend:
    # bun install && bun run build, stamp dist/.frontend-hash, upload artifact
  server:
    # go build, upload the binary artifact
  integration:
    needs: [discover, frontend, server]
    strategy:
      max-parallel: 8
      matrix:
        test: \${{ fromJson(needs.discover.outputs.tests) }}
    steps:
      - download the frontend and server artifacts
      - start the server with SAVE_DRIVE_RAM=true
      - python -m tester.main --test \${{ matrix.test }}
      - upload server logs on failure`,
} as const;

export type SnippetId = keyof typeof SNIPPETS;