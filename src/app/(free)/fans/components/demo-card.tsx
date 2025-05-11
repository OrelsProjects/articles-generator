import React from "react";

interface DemoCardProps {
  title: string;
  children: React.ReactNode;
}

const DemoCard: React.FC<DemoCardProps> = ({ title, children }) => {
  return (
    <div className="bg-card rounded-xl shadow-md p-6 mb-8 border border-border overflow-visible">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
};

export default DemoCard;
