import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Search, Plus, Trash2, Printer, X,
  AlertCircle, BookOpen, Grid3X3, ChevronRight, ChevronLeft,
  Library, FileSpreadsheet, CreditCard, Copy
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';
import './print.css';

const SLIPS_PER_PAGE = 21;

export default function App() {
  const [books, setBooks] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [printMode, setPrintMode] = useState(null); // null | 'sheet' | 'card'
  const [currentPage, setCurrentPage] = useState(0);
  const [cardPage, setCardPage] = useState(0);
  const [listPage, setListPage] = useState(0);
  const [preloading, setPreloading] = useState(true);  // true=visible, false=hidden
  const [hiding, setHiding]       = useState(false);   // triggers fade-out class
  const searchRef = useRef(null);

  // Auto-dismiss preloader after 2.3s (fade-out starts at 2.3s, unmounts at 2.85s)
  useEffect(() => {
    const fadeTimer  = setTimeout(() => setHiding(true),     2300);
    const killTimer  = setTimeout(() => setPreloading(false), 2850);
    return () => { clearTimeout(fadeTimer); clearTimeout(killTimer); };
  }, []);

  // Reset page counters whenever the book list changes
  React.useEffect(() => { setCurrentPage(0); setCardPage(0); setListPage(0); }, [selectedBooks.length]);

  React.useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Upload: auto-load ALL records ──
  // Normalize a raw Excel row's column names to internal keys
  const normalizeRow = (row) => {
    const norm = {};
    for (const [k, v] of Object.entries(row)) {
      // Create a super-normalized key: lowercase and ONLY letters/numbers
      const key = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (key.includes('title')) norm.title = String(v).trim();
      else if (key.includes('author')) norm.author = String(v).trim();
      else if (key.includes('class')) norm.class_no = String(v).trim();
      else if (key.includes('book')) norm.book_no = String(v).trim();
      else if (key.includes('acc')) norm.acc_no = String(v).trim();
      else norm[k] = v; // keep unknown cols as-is
    }
    return norm;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
        const data = raw.map(normalizeRow);
        if (data.length > 0) {
          setBooks(data);
          setFileName(file.name);
          // Auto-fill ALL records — no cap
          setSelectedBooks([...data]);
          const pages = Math.ceil(data.length / SLIPS_PER_PAGE);
          toast.success(`${data.length} records loaded → ${pages} sheet page${pages > 1 ? 's' : ''} ready`, { icon: '📄' });
          setTimeout(() => document.getElementById('sheet-section')?.scrollIntoView({ behavior: 'smooth' }), 200);
        } else { toast.error('Excel file is empty'); }
      } catch { toast.error('Failed to parse Excel file'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return books.filter(b =>
      Object.values(b).some(v => String(v).toLowerCase().includes(q))
    ).slice(0, 8);
  }, [books, searchQuery]);

  // ── Add book (no cap — allows unlimited & repeats) ──
  const addBook = (book) => {
    setSelectedBooks(p => [...p, book]);
    setSearchQuery(''); setShowDropdown(false);
    toast.success('Book added', { icon: '✔️' });
    setTimeout(() => document.getElementById('sheet-section')?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  // ── Duplicate a specific book ──
  const duplicateBook = (index) => {
    const book = selectedBooks[index];
    setSelectedBooks(p => [...p.slice(0, index + 1), book, ...p.slice(index + 1)]);
    toast.success('Book duplicated', { icon: '📋' });
  };

  const removeLast = () => {
    if (!selectedBooks.length) return;
    setSelectedBooks(p => p.slice(0, -1));
    toast('Last book removed', {
      icon: '🗑️',
      style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244', fontWeight: 500 },
      duration: 2000,
    });
  };

  const clearSheet = () => {
    if (!selectedBooks.length) return;
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
          <span style={{ fontSize: '18px' }}>🧹</span> Clear all books?
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          This will remove all {selectedBooks.length} book{selectedBooks.length > 1 ? 's' : ''} from the sheet.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setSelectedBooks([]);
              toast.dismiss(t.id);
              toast.success('Sheet cleared!', {
                icon: '✨',
                style: { background: '#1e1e2e', color: '#a6e3a1', border: '1px solid #313244', fontWeight: 600 },
                duration: 2500,
              });
            }}
            style={{
              flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none',
              background: '#dc2626', color: 'white', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            Yes, clear
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', background: 'white',
              color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: { background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
    });
  };

  const handlePrint = (mode) => {
    if (!selectedBooks.length) { toast.error('Add at least one book to print'); return; }
    setPrintMode(mode);
  };

  // ── Handle Printing Lifecycle ──
  // Using useEffect + delays ensures mobile browsers correctly render the hidden items
  // before the print dialog takes a snapshot of the screen.
  useEffect(() => {
    if (!printMode) return;

    // Small delay to let the DOM settle and "print-active" styles kick in
    const printTimer = setTimeout(() => {
      window.print();
      
      // Delay resetting to prevent "blank screen" before the dialog fully opens
      const resetTimer = setTimeout(() => {
        setPrintMode(null);
      }, 500);
      
      return () => clearTimeout(resetTimer);
    }, 600);

    return () => clearTimeout(printTimer);
  }, [printMode]);

  // Format class_no: Force 3-digit integer padding for Dewey decimals (e.g. 6.7 -> 006.7)
  const fmtNo = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val);
    const parts = s.split('.');
    
    // Only pad if the first part is purely numeric (e.g. Dewey class numbers)
    if (/^\d+$/.test(parts[0])) {
      parts[0] = parts[0].padStart(3, '0');
    }
    
    return parts.join('.');
  };

  // Get display value for book
  const getVal = (book, key, truncateAuthor = false) => {
    const v = book[key];
    if (v === undefined || v === null) return '';
    if (key === 'class_no') return fmtNo(v);
    if (truncateAuthor && (key === 'author' || key === 'authors')) {
      return String(v).slice(0, 3);
    }
    return String(v);
  };

  // Render slip fields for sheet print:
  // Order: class_no → book_no → acc_no → SVGU LIBRARY (hardcoded last)
  const renderSlipFields = (book) => {
    const orderedKeys = ['class_no', 'book_no', 'acc_no'];
    const rows = orderedKeys.map((key, idx) => {
      const value = getVal(book, key);
      return (
        <div key={key} className={idx === 0 ? 'slip-field slip-field-first' : 'slip-field'}>
          {value}
        </div>
      );
    });
    // Always append SVGU LIBRARY as last line
    rows.push(
      <div key="lib" className="slip-field">
        SVGU LIBRARY
      </div>
    );
    return rows;
  };

  // Highlight search
  const hl = (text, q) => {
    if (!q) return String(text);
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = String(text).split(new RegExp(`(${safe})`, 'gi'));
    return <span>{parts.map((p, i) => p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="bg-amber-300 text-amber-900 px-0.5 rounded">{p}</mark> : p)}</span>;
  };

  const filled = selectedBooks.length;
  const totalPages = Math.ceil(filled / SLIPS_PER_PAGE) || 0;

  // ── Build paginated sheet pages (each 21 slips) ──
  const sheetPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < filled; i += SLIPS_PER_PAGE) {
      pages.push(selectedBooks.slice(i, i + SLIPS_PER_PAGE));
    }
    return pages;
  }, [selectedBooks, filled]);

  // ── Card component (for screen preview) ──
  // Order: class_no → book_no → acc_no → title → author
  const LibraryCard = ({ book }) => (
    <div className="lib-card">
      <div className="card-fields">
        <div className="card-row"><span className="card-label">Class No.</span><span className="card-line">{getVal(book, 'class_no')}</span></div>
        <div className="card-row"><span className="card-label">Book No.</span><span className="card-line">{getVal(book, 'book_no')}</span></div>
        <div className="card-row"><span className="card-label">Acc No.</span><span className="card-line">{getVal(book, 'acc_no')}</span></div>
        <div className="card-row"><span className="card-label">Title</span><span className="card-line">{getVal(book, 'title')}</span></div>
        <div className="card-spacer" />
        <div className="card-row"><span className="card-label">Author</span><span className="card-line">{getVal(book, 'author')}</span></div>
      </div>
      <table className="card-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Issue Date</th>
            <th>Membership No.</th>
            <th>Sign.</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r}><td>&nbsp;</td><td></td><td></td><td></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Card for PRINT: values only (no labels/borders/table) ──
  // Order: class_no → book_no → acc_no → title → author
  const LibraryCardPrint = ({ book }) => (
    <div className="card-print-values">
      <div className="cpv-line cpv-1">{getVal(book, 'class_no')}</div>
      <div className="cpv-line cpv-2">{getVal(book, 'book_no')}</div>
      <div className="cpv-line cpv-3">{getVal(book, 'acc_no')}</div>
      <div className="cpv-line cpv-4">{getVal(book, 'title')}</div>
      <div className="cpv-line cpv-5">{getVal(book, 'author')}</div>
    </div>
  );

  return (
    <>
      {/* ── PRELOADER ── */}
      {preloading && (
        <div className={`preloader${hiding ? ' hiding' : ''}`}>
          {/* Floating icon with orbit ring */}
          <div className="pl-icon-wrap">
            <div className="pl-orbit" />
            <div className="pl-icon-bg">
              <Library size={36} color="white" />
            </div>
          </div>

          {/* Text + bar + dots */}
          <div className="pl-text-block">
            <h1 className="pl-title">SVGU Library</h1>
            <p className="pl-sub">Book Slip Generator</p>
            <div className="pl-bar-track">
              <div className="pl-bar-fill" />
            </div>
            <div className="pl-dots">
              <span className="pl-dot" />
              <span className="pl-dot" />
              <span className="pl-dot" />
            </div>
          </div>

          <div className="pl-credits">
            Developed by <span className="pl-dev-name">Yash Bachwani</span>
          </div>
        </div>
      )}
      {/* ── PRINT-ONLY: SHEET MODE — multi-page ── */}
      <div id="print-wrapper" className={printMode === 'sheet' ? 'print-active' : ''}>
        {sheetPages.map((page, pageIdx) => (
          <div key={pageIdx} className="print-grid print-page-break">
            {Array.from({ length: SLIPS_PER_PAGE }).map((_, i) => (
              <div key={i} className={`slip-cell ${page[i] ? 'filled' : ''}`}>
                {page[i] && renderSlipFields(page[i])}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── PRINT-ONLY: CARD MODE — values only, no labels/borders ── */}
      <div id="print-wrapper-cards" className={printMode === 'card' ? 'print-active' : ''}>
        <div className="card-page">
          {selectedBooks.map((book, i) => (
            <LibraryCardPrint key={`print-${i}`} book={book} />
          ))}
        </div>
      </div>

      {/* ── MAIN UI ──────────────────────────────── */}
      <div className="no-print app-shell">
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />

        {/* HEADER */}
        <header className="app-header">
          <div className="header-brand">
            <div className="brand-icon"><Library size={20} color="white" /></div>
            <div>
              <h1 className="brand-title">Book Slip Generator</h1>
              <p className="brand-sub">
                {fileName
                  ? <><FileSpreadsheet size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /><span className="filename-badge">{fileName}</span> &nbsp;·&nbsp; {books.length} records</>
                  : 'SVGU College Library — No file loaded'}
              </p>
            </div>
          </div>
          <label className="btn-upload">
            <Upload size={15} /> Upload Excel
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </label>
        </header>

        {/* SEARCH */}
        <section className="search-hero">
          <div className="hero-text">
            <h2 className="hero-title">Find &amp; Add Books</h2>
            <p className="hero-sub">{books.length === 0 ? 'Upload an Excel file to start' : 'Search to add more books or duplicates…'}</p>
          </div>
          <div className="search-wrap" ref={searchRef}>
            <div className={`search-box ${showDropdown && searchQuery ? 'active' : ''}`}>
              <Search size={17} className="search-icon" />
              <input type="text" value={searchQuery} disabled={books.length === 0}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder={books.length === 0 ? 'Upload a file first…' : 'Search books…'}
                className="search-input" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={15} /></button>}
            </div>
            {showDropdown && searchQuery && (
              <div className="dropdown">
                {filteredBooks.length > 0 ? filteredBooks.map((book, idx) => (
                  <button key={idx} onClick={() => addBook(book)} className="dropdown-item">
                    <div className="di-info">
                      <div className="di-name">{hl(book.title || '', searchQuery)}</div>
                      <div className="di-meta">
                        <span>Class: {hl(book.class_no || '', searchQuery)}</span>
                        <span>Book: {hl(book.book_no || '', searchQuery)}</span>
                        <span>Acc: {hl(book.acc_no || '', searchQuery)}</span>
                        <span>{hl(book.author || '', searchQuery)}</span>
                      </div>
                    </div>
                    <div className="di-add"><Plus size={15} /></div>
                  </button>
                )) : (
                  <div className="dropdown-empty"><AlertCircle size={24} /><p>No matching books found</p></div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SHEET SECTION */}
        <section id="sheet-section" className="sheet-section">
          <div className="sheet-controls">
            <div className="sheet-title-group">
              <h3 className="sheet-title">Print Sheet</h3>
              <div className="fill-badge" style={{ color: '#c7d2fe', borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.15)' }}>
                {filled} books · {totalPages} page{totalPages !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="sheet-actions">
              <button onClick={removeLast} disabled={!filled} className="btn-ghost"><Trash2 size={14} /> <span>Remove Last</span></button>
              <button onClick={clearSheet} disabled={!filled} className="btn-danger"><Trash2 size={14} /> <span>Clear All</span></button>
              <button onClick={() => handlePrint('sheet')} disabled={!filled} className="btn-print">
                <Printer size={15} /> <span>Sheet Print</span>
              </button>
              <button onClick={() => handlePrint('card')} disabled={!filled} className="btn-card-print">
                <CreditCard size={15} /> <span>Card Print</span>
              </button>
            </div>
          </div>

          {/* Grid preview — paginated with arrow navigation */}
          <div className="grid-card">
            {filled === 0 ? (
              <div className="empty-state">
                {books.length === 0
                  ? <><BookOpen size={44} className="empty-icon" /><p className="empty-title">No data loaded</p><p className="empty-sub">Upload an Excel file to get started</p></>
                  : <><Grid3X3 size={44} className="empty-icon" /><p className="empty-title">Sheet is empty</p><p className="empty-sub">Search a book above and click to add it</p></>}
              </div>
            ) : (
              <div className="grid-scroll-wrap">
                {/* Current page grid */}
                <div className="grid-scaler">
                  <div className="print-grid">
                    {Array.from({ length: SLIPS_PER_PAGE }).map((_, i) => {
                      const book = sheetPages[currentPage]?.[i];
                      return (
                        <div key={i} className={`slip-cell ${book ? 'filled' : ''}`}>
                          {book ? renderSlipFields(book) : <span className="slip-empty-num">{currentPage * SLIPS_PER_PAGE + i + 1}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Page navigation bar — below the grid */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                        background: currentPage === 0 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.25)',
                        color: currentPage === 0 ? '#555' : '#a5b4fc',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 600, minWidth: '90px', textAlign: 'center' }}>
                      Page {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                        background: currentPage === totalPages - 1 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.25)',
                        color: currentPage === totalPages - 1 ? '#555' : '#a5b4fc',
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card preview — 3 cards per row, responsive, arrow nav below */}
          {filled > 0 && (() => {
            const CARDS_PER_ROW = 3;
            const totalCardRows = Math.ceil(filled / CARDS_PER_ROW);
            const rowStart = cardPage * CARDS_PER_ROW;
            const rowCards = selectedBooks.slice(rowStart, rowStart + CARDS_PER_ROW);
            return (
              <div style={{ marginTop: '20px' }}>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Card Preview (front) &nbsp;·&nbsp; {rowStart + 1}–{Math.min(rowStart + CARDS_PER_ROW, filled)} of {filled}
                </p>
                {/* Row of 3 cards — uses responsive CSS classes */}
                <div className="card-preview-row">
                  {rowCards.map((book, i) => (
                    <div key={rowStart + i} className="card-preview-item">
                      <div className="card-preview-scaler">
                        <LibraryCard book={book} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Arrow nav — below the row */}
                {totalCardRows > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
                    <button
                      onClick={() => setCardPage(p => Math.max(0, p - 1))}
                      disabled={cardPage === 0}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                        background: cardPage === 0 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.25)',
                        color: cardPage === 0 ? '#555' : '#a5b4fc',
                        cursor: cardPage === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 600, minWidth: '110px', textAlign: 'center' }}>
                      Row {cardPage + 1} / {totalCardRows}
                    </span>
                    <button
                      onClick={() => setCardPage(p => Math.min(totalCardRows - 1, p + 1))}
                      disabled={cardPage === totalCardRows - 1}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                        background: cardPage === totalCardRows - 1 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.25)',
                        color: cardPage === totalCardRows - 1 ? '#555' : '#a5b4fc',
                        cursor: cardPage === totalCardRows - 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Structured Book List Table with Pagination */}
          {filled > 0 && (() => {
            const ROWS_PER_PAGE = 5;
            const totalListPages = Math.ceil(filled / ROWS_PER_PAGE);
            const startIdx = listPage * ROWS_PER_PAGE;
            const paginatedBooks = selectedBooks.slice(startIdx, startIdx + ROWS_PER_PAGE);

            return (
              <div className="books-table-wrapper">
                <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: 0 }}>
                    Books on Sheet ({filled})
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    Showing {startIdx + 1}–{Math.min(startIdx + ROWS_PER_PAGE, filled)}
                  </span>
                </div>
                <div className="books-table-scroll">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th className="td-num">#</th>
                        <th className="td-title">Book Details</th>
                        <th className="td-acc">Acc No.</th>
                        <th className="td-codes">Class / Book</th>
                        <th className="td-actions text-right" style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBooks.map((b, localIdx) => {
                        const globalIdx = startIdx + localIdx;
                        return (
                          <tr key={globalIdx}>
                            <td className="td-num">{globalIdx + 1}</td>
                            <td className="td-title">
                              <span className="title-main">{b.title || 'Untitled'}</span>
                              <span className="title-sub">{b.author || 'No Author'}</span>
                            </td>
                            <td className="td-acc">{b.acc_no || 'N/A'}</td>
                            <td className="td-codes">
                              {b.class_no || '—'} / {b.book_no || '—'}
                            </td>
                            <td className="td-actions">
                              <div className="table-action-dots">
                                <button onClick={() => duplicateBook(globalIdx)} className="btn-icon-sm" title="Duplicate">
                                  <Copy size={13} />
                                </button>
                                <button onClick={() => setSelectedBooks(p => p.filter((_, j) => j !== globalIdx))} className="btn-icon-sm danger" title="Remove">
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* List Table Pagination Controls */}
                {totalListPages > 1 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setListPage(p => Math.max(0, p - 1))}
                      disabled={listPage === 0}
                      className="btn-icon-sm"
                      style={{ opacity: listPage === 0 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', minWidth: '100px', textAlign: 'center' }}>
                      Page {listPage + 1} / {totalListPages}
                    </span>
                    <button
                      onClick={() => setListPage(p => Math.min(totalListPages - 1, p + 1))}
                      disabled={listPage === totalListPages - 1}
                      className="btn-icon-sm"
                      style={{ opacity: listPage === totalListPages - 1 ? 0.4 : 1 }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-line-decor" />
            <p className="footer-tagline">Designed &amp; Developed by</p>
            <h3 className="footer-dev-name">Yash Bachwani</h3>
            <p className="footer-org">SVGU College Library · v1.0</p>
          </div>
        </footer>
      </div>
    </>
  );
}
