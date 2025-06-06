import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-5 text-danger">
      <h1 className="display-1 fw-bold mb-4">404</h1>
      <h2>Page Not Found</h2>
      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate('/dashboard')}
      >
        Go Back To Dashboard
      </button>
    </div>
  );
};


export default PageNotFound;
