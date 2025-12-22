import { useState, useEffect } from "react";

// Export this constant so it can be used in other components
export const DEFAULT_ITEMS_PER_PAGE = 5;

const Pagination = ({ 
  totalItems, 
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,  // Uses the constant by default
  currentPage, 
  onPageChange,
  showEntriesText = true,
  showGoToPage = true
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  // Calculate showing range
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Render page numbers with ellipsis
  const renderPageNumbers = () => {
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-right");
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => {
      if (number === "ellipsis-left" || number === "ellipsis-right") {
        return (
          <li key={index} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }

      return (
        <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
          <button
            className="page-link"
            onClick={() => {
              onPageChange(number);
              setPageInput(number.toString());
            }}
          >
            {number}
          </button>
        </li>
      );
    });
  };

  if (totalItems === 0) return null;

  return (
    <nav className="d-flex justify-content-between align-items-center mt-3">
      {showEntriesText && (
        <div>
          <span className="text-muted">
            Showing {startItem} to {endItem} of {totalItems} entries
          </span>
        </div>
      )}
      
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            &laquo; Previous
          </button>
        </li>
        
        {renderPageNumbers()}
        
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next &raquo;
          </button>
        </li>
      </ul>
      
      {showGoToPage && (
        <div className="d-flex align-items-center">
          <span className="me-2">Go to:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyPress={handleKeyPress}
            className="form-control me-2"
            style={{ width: "80px" }}
          />
          <button
            className="btn btn-primary"
            onClick={handlePageNavigation}
          >
            Go
          </button>
        </div>
      )}
    </nav>
  );
};



export default Pagination;