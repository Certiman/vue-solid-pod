# Legacy Code Archive

This folder contains legacy code that has been archived but preserved for historical reference and potential future use.

## Books Module (archived: 2025-06-18)

The Books functionality was the original Inrupt Solid Pods demo implementation. It has been replaced with railway-specific functionality but preserved here as legacy code.

### Archived Components:

- **views/BooksView.vue** - Main books view component
- **components/ReadingList.vue** - Component for displaying reading lists
- **components/ReadingItem.vue** - Individual reading item component  
- **modals/ShaclViewBookModal.vue** - Modal for viewing book details with SHACL forms
- **modals/ShaclAddBookModal.vue** - Modal for adding books with SHACL forms

### Router Configuration

The books route (`/books`) has been commented out in `src/router/index.js`. To re-enable:

1. Uncomment the route configuration
2. Update the import path to point to `../legacy/books/views/BooksView.vue`
3. Add the navigation link back to `src/components/NavBar.vue`

### Dependencies

These components may have dependencies on:

- Reading list data structures
- SHACL form configurations specific to books
- Book-related vocabularies and RDF schemas

### Notes

- All code is functional and was working at the time of archival
- Components follow the same patterns as the active codebase
- Can be used as reference for implementing similar functionality
- May require updates to work with current dependencies if restored
