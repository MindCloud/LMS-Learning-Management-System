import React from "react";
import { useNavigate } from "react-router-dom";
import FeedbackDialog from "./FeedbackDialog.jsx";

export default function FeedbackPage() {
  const navigate = useNavigate();
  // Always open; close returns to previous page
  return <FeedbackDialog isOpen={true} onClose={() => navigate(-1)} />;
}
