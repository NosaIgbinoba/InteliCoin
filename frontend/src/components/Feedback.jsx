import React from "react";

const Feedback = ({ aiResponse }) => {
  return (
    <div>
      <h3>AI Feedback</h3>
      <p>{aiResponse || "Waiting for feedback..."}</p>
    </div>
  );
};

export default Feedback;
