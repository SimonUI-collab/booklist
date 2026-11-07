/**
 * Book List Application
 * Pure Vanilla JavaScript with LocalStorage Persistence
 */

(function () {
  'use strict';

  // --- Storage Key & State ---
  const STORAGE_KEY = 'simple_booklist_data_v1';
  let books = loadBooks();
  let searchQuery = '';
  let pendingDeleteId = null;

  // --- DOM Elements ---
  // Stats
  const totalBooksCountEl = document.getElementById('totalBooksCount');
  const readBooksCountEl = document.getElementById('readBooksCount');
  const unreadBooksCountEl = document.getElementById('unreadBooksCount');

  // Add Book Form
  const addBookForm = document.getElementById('addBookForm');
  const bookTitleInput = document.getElementById('bookTitle');
  const bookAuthorInput = document.getElementById('bookAuthor');
  const bookStatusInput = document.getElementById('bookStatus');

  // Search & List
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchFeedbackEl = document.getElementById('searchFeedback');
  const bookListEl = document.getElementById('bookList');

  // Empty State
  const emptyStateEl = document.getElementById('emptyState');
  const emptyStateTitleEl = document.getElementById('emptyStateTitle');
  const emptyStateMessageEl = document.getElementById('emptyStateMessage');
  const loadSampleBtn = document.getElementById('loadSampleBtn');

  // Edit Modal
  const editModal = document.getElementById('editModal');
  const editBookForm = document.getElementById('editBookForm');
  const editBookIdInput = document.getElementById('editBookId');
  const editTitleInput = document.getElementById('editTitle');
  const editAuthorInput = document.getElementById('editAuthor');
  const editStatusInput = document.getElementById('editStatus');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Confirm Delete Modal
  const confirmModal = document.getElementById('confirmModal');
  const confirmModalText = document.getElementById('confirmModalText');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // --- Helper Functions ---

  /**
   * Load books array from browser localStorage
   * @returns {Array} List of book objects
   */
  function loadBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load books from localStorage:', err);
      return [];
    }
  }

  /**
   * Save current books array to localStorage
   */
  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Failed to save books to localStorage:', err);
      alert('Could not save data. Your browser storage might be full or restricted.');
    }
  }

  /**
   * Generate a unique ID for each book
   */
  function generateId() {
    return 'book_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  // --- Render Function ---

  /**
   * Main render method to refresh counts, list, and empty states
   */
  function render() {
    // 1. Update Stats at Top
    const totalCount = books.length;
    const readCount = books.filter((b) => b.isRead).length;
    const unreadCount = totalCount - readCount;

    totalBooksCountEl.textContent = totalCount;
    readBooksCountEl.textContent = readCount;
    unreadBooksCountEl.textContent = unreadCount;

    // 2. Filter books based on search query
    const query = searchQuery.trim().toLowerCase();
    const filteredBooks = query
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query)
        )
      : books;

    // 3. Clear current list DOM
    bookListEl.innerHTML = '';

    // 4. Handle Empty States
    if (totalCount === 0) {
      // Completely empty list
      emptyStateEl.hidden = false;
      bookListEl.hidden = true;
      emptyStateTitleEl.textContent = 'Your reading list is empty!';
      emptyStateMessageEl.textContent =
        "You haven't added any books yet. Add your favorite books above to get started!";
      loadSampleBtn.hidden = false;
      searchFeedbackEl.textContent = '';
      return;
    }

    if (filteredBooks.length === 0) {
      // No books matching the search
      emptyStateEl.hidden = false;
      bookListEl.hidden = true;
      emptyStateTitleEl.textContent = 'No matching books found';
      emptyStateMessageEl.textContent = `No books match "${searchQuery}". Check the spelling or try searching for another title or author.`;
      loadSampleBtn.hidden = true;
      searchFeedbackEl.textContent = `0 results found for "${searchQuery}"`;
      return;
    }

    // Hide empty state and show list
    emptyStateEl.hidden = true;
    bookListEl.hidden = false;

    // Update search feedback text
    if (query) {
      searchFeedbackEl.textContent = `Showing ${filteredBooks.length} of ${totalCount} books`;
    } else {
      searchFeedbackEl.textContent = '';
    }

    // 5. Render Book Items
    filteredBooks.forEach((book) => {
      const li = document.createElement('li');
      li.className = 'book-card';
      li.dataset.id = book.id;

      // Book Info Block
      const infoDiv = document.createElement('div');
      infoDiv.className = 'book-info';

      const headerRow = document.createElement('div');
      headerRow.className = 'book-header-row';

      const titleEl = document.createElement('h3');
      titleEl.className = 'book-title';
      titleEl.textContent = book.title;

      // Status Badge (clickable to quickly toggle status)
      const statusBtn = document.createElement('button');
      statusBtn.type = 'button';
      statusBtn.className = `status-pill ${book.isRead ? 'read' : 'unread'}`;
      statusBtn.title = `Click to mark as ${book.isRead ? 'unread' : 'read'}`;
      statusBtn.setAttribute('aria-label', `Status: ${book.isRead ? 'Read' : 'To Read'}. Click to toggle.`);
      statusBtn.innerHTML = book.isRead
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Read`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg> To Read`;

      statusBtn.addEventListener('click', () => toggleReadStatus(book.id));

      headerRow.appendChild(titleEl);
      headerRow.appendChild(statusBtn);

      const authorEl = document.createElement('p');
      authorEl.className = 'book-author';
      authorEl.textContent = `by ${book.author}`;

      infoDiv.appendChild(headerRow);
      infoDiv.appendChild(authorEl);

      // Book Actions Block (Edit, Delete)
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'book-actions';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon';
      editBtn.title = 'Edit book';
      editBtn.setAttribute('aria-label', `Edit "${book.title}"`);
      editBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span class="btn-text">Edit</span>
      `;
      editBtn.addEventListener('click', () => openEditModal(book.id));

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-icon delete-btn';
      deleteBtn.title = 'Delete book';
      deleteBtn.setAttribute('aria-label', `Delete "${book.title}"`);
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span class="btn-text">Delete</span>
      `;
      deleteBtn.addEventListener('click', () => promptDeleteBook(book.id));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);

      bookListEl.appendChild(li);
    });
  }

  // --- Book Operations ---

  /**
   * Add a new book
   */
  function handleAddBook(e) {
    e.preventDefault();

    const title = bookTitleInput.value.trim();
    const author = bookAuthorInput.value.trim();
    const isRead = bookStatusInput.checked;

    if (!title || !author) {
      alert('Please fill in both the title and author.');
      return;
    }

    const newBook = {
      id: generateId(),
      title,
      author,
      isRead,
      createdAt: Date.now()
    };

    // Add to beginning of list
    books.unshift(newBook);
    saveBooks();

    // Reset form and focus
    addBookForm.reset();
    bookTitleInput.focus();

    render();
  }

  /**
   * Toggle the read/unread status of a book
   * @param {string} id Book ID
   */
  function toggleReadStatus(id) {
    const book = books.find((b) => b.id === id);
    if (book) {
      book.isRead = !book.isRead;
      saveBooks();
      render();
    }
  }

  /**
   * Open the Edit Modal with existing book data
   * @param {string} id Book ID
   */
  function openEditModal(id) {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    editBookIdInput.value = book.id;
    editTitleInput.value = book.title;
    editAuthorInput.value = book.author;
    editStatusInput.checked = book.isRead;

    editModal.hidden = false;
    editTitleInput.focus();
  }

  /**
   * Close the Edit Modal
   */
  function closeEditModal() {
    editModal.hidden = true;
    editBookForm.reset();
  }

  /**
   * Save changes from Edit Form
   */
  function handleSaveEdit(e) {
    e.preventDefault();

    const id = editBookIdInput.value;
    const title = editTitleInput.value.trim();
    const author = editAuthorInput.value.trim();
    const isRead = editStatusInput.checked;

    if (!title || !author) {
      alert('Title and Author cannot be empty.');
      return;
    }

    const book = books.find((b) => b.id === id);
    if (book) {
      book.title = title;
      book.author = author;
      book.isRead = isRead;
      saveBooks();
      closeEditModal();
      render();
    }
  }

  /**
   * Ask for confirmation before deleting any book
   * @param {string} id Book ID
   */
  function promptDeleteBook(id) {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    pendingDeleteId = id;
    confirmModalText.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(book.title)}"</strong> by ${escapeHtml(book.author)}?<br>This action cannot be undone.`;
    confirmModal.hidden = false;
    confirmDeleteBtn.focus();
  }

  /**
   * Close the confirmation modal
   */
  function closeConfirmModal() {
    pendingDeleteId = null;
    confirmModal.hidden = true;
  }

  /**
   * Execute book deletion after confirmation
   */
  function handleConfirmDelete() {
    if (!pendingDeleteId) return;

    books = books.filter((b) => b.id !== pendingDeleteId);
    saveBooks();
    closeConfirmModal();
    render();
  }

  /**
   * Simple HTML escaping helper for safe modal text rendering
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Load predefined sample books for instant testing
   */
  function handleLoadSampleBooks() {
    const sampleBooks = [
      {
        id: generateId(),
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isRead: true,
        createdAt: Date.now() - 3000
      },
      {
        id: generateId(),
        title: '1984',
        author: 'George Orwell',
        isRead: true,
        createdAt: Date.now() - 2000
      },
      {
        id: generateId(),
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isRead: false,
        createdAt: Date.now() - 1000
      },
      {
        id: generateId(),
        title: 'Atomic Habits',
        author: 'James Clear',
        isRead: false,
        createdAt: Date.now()
      }
    ];

    books = sampleBooks;
    saveBooks();
    render();
  }

  // --- Event Listeners ---

  // Form Submissions
  addBookForm.addEventListener('submit', handleAddBook);
  editBookForm.addEventListener('submit', handleSaveEdit);

  // Edit Modal Controls
  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Delete Confirmation Controls
  cancelDeleteBtn.addEventListener('click', closeConfirmModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Close modals on background overlay click
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirmModal();
  });

  // Global Escape key listener to dismiss open modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!editModal.hidden) closeEditModal();
      if (!confirmModal.hidden) closeConfirmModal();
    }
  });

  // Live Search Filtering
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.hidden = !searchQuery;
    render();
  });

  // Clear Search Button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.hidden = true;
    render();
    searchInput.focus();
  });

  // Load sample books button from empty state
  loadSampleBtn.addEventListener('click', handleLoadSampleBooks);

  // --- Initial Render ---
  render();
})();

